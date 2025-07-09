import { acceptCompletion, autocompletion, closeBrackets, startCompletion } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, foldGutter, indentOnInput, indentUnit, syntaxHighlighting, defaultHighlightStyle, codeFolding, foldAll, unfoldAll } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { Compartment, EditorSelection, EditorState, StateEffect, StateField, type Extension } from '@codemirror/state';
import {
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  scrollPastEnd,
  showTooltip,
  tooltips,
  type Tooltip,
  rectangularSelection,
  crosshairCursor,
  highlightSpecialChars,
  placeholder,
} from '@codemirror/view';
import { memo, useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { Theme } from '~/types/theme';
import { classNames } from '~/utils/classNames';
import { debounce } from '~/utils/debounce';
import { createScopedLogger, renderLogger } from '~/utils/logger';
import { isFileLocked, getCurrentChatId } from '~/utils/fileLocks';
import { BinaryContent } from './BinaryContent';
import { getTheme, reconfigureTheme } from './cm-theme';
import { indentKeyBinding } from './indent';
import { getLanguage } from './languages';
import { createEnvMaskingExtension } from './EnvMasking';

const logger = createScopedLogger('CodeMirrorEditor');

// Create a module-level reference to the current document for use in tooltip functions
let currentDocRef: EditorDocument | undefined;

export interface EditorDocument {
  value: string;
  isBinary: boolean;
  filePath: string;
  scroll?: ScrollPosition;
}

export interface EditorSettings {
  fontSize?: string;
  gutterFontSize?: string;
  tabSize?: number;
  lineWrapping?: boolean;
  showLineNumbers?: boolean;
  showFoldGutter?: boolean;
  enableAutocompletion?: boolean;
  enableBracketMatching?: boolean;
  enableHighlightSelectionMatches?: boolean;
  enableMultipleCursors?: boolean;
  enableVimMode?: boolean;
  minimap?: boolean;
}

type TextEditorDocument = EditorDocument & {
  value: string;
};

export interface ScrollPosition {
  top?: number;
  left?: number;
  line?: number;
  column?: number;
}

export interface EditorUpdate {
  selection: EditorSelection;
  content: string;
}

export type OnChangeCallback = (update: EditorUpdate) => void;
export type OnScrollCallback = (position: ScrollPosition) => void;
export type OnSaveCallback = () => void;

interface Props {
  theme: Theme;
  id?: unknown;
  doc?: EditorDocument;
  editable?: boolean;
  debounceChange?: number;
  debounceScroll?: number;
  autoFocusOnDocumentChange?: boolean;
  onChange?: OnChangeCallback;
  onScroll?: OnScrollCallback;
  onSave?: OnSaveCallback;
  className?: string;
  settings?: EditorSettings;
}

type EditorStates = Map<string, EditorState>;

const readOnlyTooltipStateEffect = StateEffect.define<boolean>();

const editableTooltipField = StateField.define<readonly Tooltip[]>({
  create: () => [],
  update(_tooltips, transaction) {
    if (!transaction.state.readOnly) {
      return [];
    }

    for (const effect of transaction.effects) {
      if (effect.is(readOnlyTooltipStateEffect) && effect.value) {
        return getReadOnlyTooltip(transaction.state);
      }
    }

    return [];
  },
  provide: (field) => {
    return showTooltip.computeN([field], (state) => state.field(field));
  },
});

const editableStateEffect = StateEffect.define<boolean>();

const editableStateField = StateField.define<boolean>({
  create() {
    return true;
  },
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(editableStateEffect)) {
        return effect.value;
      }
    }

    return value;
  },
});

export const CodeMirrorEditor = memo(
  ({
    id,
    doc,
    debounceScroll = 100,
    debounceChange = 150,
    autoFocusOnDocumentChange = false,
    editable = true,
    onScroll,
    onChange,
    onSave,
    theme,
    settings = {
      fontSize: '14px',
      tabSize: 2,
      lineWrapping: false,
      showLineNumbers: true,
      showFoldGutter: true,
      enableAutocompletion: true,
      enableBracketMatching: true,
      enableHighlightSelectionMatches: true,
      enableMultipleCursors: true,
      enableVimMode: false,
      minimap: false,
    },
    className = '',
  }: Props) => {
    renderLogger.trace('CodeMirrorEditor');

    const [languageCompartment] = useState(new Compartment());
    const [envMaskingCompartment] = useState(new Compartment());

    const containerRef = useRef<HTMLDivElement | null>(null);
    const viewRef = useRef<EditorView>();
    const themeRef = useRef<Theme>();
    const docRef = useRef<EditorDocument>();
    const editorStatesRef = useRef<EditorStates>();
    const onScrollRef = useRef(onScroll);
    const onChangeRef = useRef(onChange);
    const onSaveRef = useRef(onSave);

    /**
     * This effect is used to avoid side effects directly in the render function
     * and instead the refs are updated after each render.
     */
    useEffect(() => {
      onScrollRef.current = onScroll;
      onChangeRef.current = onChange;
      onSaveRef.current = onSave;
      docRef.current = doc;

      // Update the module-level reference for use in tooltip functions
      currentDocRef = doc;
      themeRef.current = theme;
    });

    useEffect(() => {
      if (!viewRef.current || !doc || doc.isBinary) {
        return;
      }

      if (typeof doc.scroll?.line === 'number') {
        const line = doc.scroll.line;
        const column = doc.scroll.column ?? 0;

        try {
          const totalLines = viewRef.current.state.doc.lines;

          if (line < totalLines) {
            const linePos = viewRef.current.state.doc.line(line + 1).from + column;
            viewRef.current.dispatch({
              selection: { anchor: linePos },
              scrollIntoView: true,
            });
            viewRef.current.focus();
          } else {
            logger.warn(`Invalid line number ${line + 1} in ${totalLines}-line document`);
          }
        } catch (error) {
          logger.error('Error scrolling to line:', error);
        }
      } else if (typeof doc.scroll?.top === 'number' || typeof doc.scroll?.left === 'number') {
        viewRef.current.scrollDOM.scrollTo(doc.scroll.left ?? 0, doc.scroll.top ?? 0);
      }
    }, [doc?.scroll?.line, doc?.scroll?.column, doc?.scroll?.top, doc?.scroll?.left]);

    useEffect(() => {
      const onUpdate = debounce((update: EditorUpdate) => {
        onChangeRef.current?.(update);
      }, debounceChange);

      const view = new EditorView({
        parent: containerRef.current!,
        dispatchTransactions(transactions) {
          const previousSelection = view.state.selection;

          view.update(transactions);

          const newSelection = view.state.selection;

          const selectionChanged =
            newSelection !== previousSelection &&
            (newSelection === undefined || previousSelection === undefined || !newSelection.eq(previousSelection));

          if (docRef.current && (transactions.some((transaction) => transaction.docChanged) || selectionChanged)) {
            onUpdate({
              selection: view.state.selection,
              content: view.state.doc.toString(),
            });

            editorStatesRef.current!.set(docRef.current.filePath, view.state);
          }
        },
      });

      viewRef.current = view;

      return () => {
        viewRef.current?.destroy();
        viewRef.current = undefined;
      };
    }, []);

    useEffect(() => {
      if (!viewRef.current) {
        return;
      }

      viewRef.current.dispatch({
        effects: [reconfigureTheme(theme)],
      });
    }, [theme]);

    useEffect(() => {
      editorStatesRef.current = new Map<string, EditorState>();
    }, [id]);

    useEffect(() => {
      const editorStates = editorStatesRef.current!;
      const view = viewRef.current!;
      const theme = themeRef.current!;

      if (!doc) {
        const state = newEditorState('', theme, settings, onScrollRef, debounceScroll, onSaveRef, [
          languageCompartment.of([]),
          envMaskingCompartment.of([]),
        ]);

        view.setState(state);
        setNoDocument(view);
        return;
      }

      if (doc.isBinary) {
        return;
      }

      if (doc.filePath === '') {
        logger.warn('File path should not be empty');
      }

      let state = editorStates.get(doc.filePath);

      if (!state) {
        state = newEditorState(doc.value, theme, settings, onScrollRef, debounceScroll, onSaveRef, [
          languageCompartment.of([]),
          envMaskingCompartment.of([createEnvMaskingExtension(() => docRef.current?.filePath)]),
        ]);

        editorStates.set(doc.filePath, state);
      }

      view.setState(state);

      setEditorDocument(
        view,
        theme,
        editable,
        languageCompartment,
        autoFocusOnDocumentChange,
        doc as TextEditorDocument,
      );

      // Check if the file is locked and update the editor state accordingly
      const currentChatId = getCurrentChatId();
      const { locked } = isFileLocked(doc.filePath, currentChatId);

      if (locked) {
        view.dispatch({
          effects: [editableStateEffect.of(false)],
        });
      }
    }, [doc?.value, editable, doc?.filePath, autoFocusOnDocumentChange, settings]);

    return (
      <div className={classNames('relative h-full', className)}>
        {doc?.isBinary && <BinaryContent />}
        <div className="h-full overflow-hidden" ref={containerRef} />
      </div>
    );
  },
);

export default CodeMirrorEditor;

CodeMirrorEditor.displayName = 'CodeMirrorEditor';

function newEditorState(
  content: string,
  theme: Theme,
  settings: EditorSettings,
  onScrollRef: MutableRefObject<OnScrollCallback | undefined>,
  debounceScroll: number,
  onFileSaveRef: MutableRefObject<OnSaveCallback | undefined>,
  extensions: Extension[],
) {
  const baseExtensions: Extension[] = [
    // Enhanced event handlers
    EditorView.domEventHandlers({
      scroll: debounce((event, view) => {
        if (event.target !== view.scrollDOM) {
          return;
        }
        onScrollRef.current?.({ left: view.scrollDOM.scrollLeft, top: view.scrollDOM.scrollTop });
      }, debounceScroll),
      keydown: (event, view) => {
        if (view.state.readOnly) {
          view.dispatch({
            effects: [readOnlyTooltipStateEffect.of(event.key !== 'Escape')],
          });
          return true;
        }
        return false;
      },
    }),
    
    // Core features
    getTheme(theme, settings),
    history(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    
    // Enhanced keymap
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
      { key: 'Tab', run: acceptCompletion },
      indentWithTab,
      {
        key: 'Mod-s',
        preventDefault: true,
        run: () => {
          onFileSaveRef.current?.();
          return true;
        },
      },
      {
        key: 'Mod-/',
        run: () => {
          // Toggle comment functionality would go here
          return false;
        },
      },
      {
        key: 'Mod-d',
        run: () => {
          // Duplicate line functionality would go here
          return false;
        },
      },
      {
        key: 'Ctrl-Space',
        run: startCompletion,
      },
      {
        key: 'Mod-Shift-k',
        run: () => {
          // Delete line functionality would go here
          return false;
        },
      },
      {
        key: 'Mod-Shift-[',
        run: foldAll,
      },
      {
        key: 'Mod-Shift-]',
        run: unfoldAll,
      },
      indentKeyBinding,
    ]),
    
    // Text editing features
    indentUnit.of('\t'),
    EditorState.tabSize.of(settings?.tabSize ?? 2),
    indentOnInput(),
    
    // Visual enhancements
    highlightSpecialChars(),
    drawSelection(),
    dropCursor(),
    scrollPastEnd(),
    placeholder('Start typing...'),
    
    // State management
    editableTooltipField,
    editableStateField,
    EditorState.readOnly.from(editableStateField, (editable) => !editable),
    
    // Tooltips configuration
    tooltips({
      position: 'absolute',
      parent: document.body,
      tooltipSpace: (view) => {
        const rect = view.dom.getBoundingClientRect();
        return {
          top: rect.top - 50,
          left: rect.left,
          bottom: rect.bottom,
          right: rect.right + 10,
        };
      },
    }),
  ];

  // Conditional features based on settings
  if (settings.showLineNumbers !== false) {
    baseExtensions.push(lineNumbers());
    baseExtensions.push(highlightActiveLineGutter());
  }

  if (settings.enableAutocompletion !== false) {
    baseExtensions.push(
      autocompletion({
        closeOnBlur: false,
        activateOnTyping: true,
        override: [],
      })
    );
  }

  if (settings.enableBracketMatching !== false) {
    baseExtensions.push(
      closeBrackets(),
      bracketMatching()
    );
  }

  if (settings.enableHighlightSelectionMatches !== false) {
    baseExtensions.push(highlightSelectionMatches());
  }

  if (settings.enableMultipleCursors !== false) {
    baseExtensions.push(
      rectangularSelection(),
      crosshairCursor()
    );
  }

  if (settings.showFoldGutter !== false) {
    baseExtensions.push(
      codeFolding(),
      foldGutter({
        markerDOM: (open) => {
          const icon = document.createElement('div');
          icon.className = `fold-icon ${open ? 'i-ph-caret-down-bold' : 'i-ph-caret-right-bold'}`;
          return icon;
        },
      })
    );
  }

  if (settings.lineWrapping) {
    baseExtensions.push(EditorView.lineWrapping);
  }

  baseExtensions.push(highlightActiveLine());

  return EditorState.create({
    doc: content,
    extensions: [...baseExtensions, ...extensions],
  });
}

function setNoDocument(view: EditorView) {
  view.dispatch({
    selection: { anchor: 0 },
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: '',
    },
  });

  view.scrollDOM.scrollTo(0, 0);
}

function setEditorDocument(
  view: EditorView,
  theme: Theme,
  editable: boolean,
  languageCompartment: Compartment,
  autoFocus: boolean,
  doc: TextEditorDocument,
) {
  if (doc.value !== view.state.doc.toString()) {
    view.dispatch({
      selection: { anchor: 0 },
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: doc.value,
      },
    });
  }

  // Check if the file is locked
  const currentChatId = getCurrentChatId();
  const { locked } = isFileLocked(doc.filePath, currentChatId);

  // Set editable state based on both the editable prop and the file's lock state
  view.dispatch({
    effects: [editableStateEffect.of(editable && !doc.isBinary && !locked)],
  });

  getLanguage(doc.filePath).then((languageSupport) => {
    if (!languageSupport) {
      return;
    }

    view.dispatch({
      effects: [languageCompartment.reconfigure([languageSupport]), reconfigureTheme(theme)],
    });

    requestAnimationFrame(() => {
      const currentLeft = view.scrollDOM.scrollLeft;
      const currentTop = view.scrollDOM.scrollTop;
      const newLeft = doc.scroll?.left ?? 0;
      const newTop = doc.scroll?.top ?? 0;

      if (typeof doc.scroll?.line === 'number') {
        const line = doc.scroll.line;
        const column = doc.scroll.column ?? 0;

        try {
          const totalLines = view.state.doc.lines;

          if (line < totalLines) {
            const linePos = view.state.doc.line(line + 1).from + column;
            view.dispatch({
              selection: { anchor: linePos },
              scrollIntoView: true,
            });
            
            if (autoFocus) {
              view.focus();
            }
          } else {
            logger.warn(`Invalid line number ${line + 1} in ${totalLines}-line document`);
          }
        } catch (error) {
          logger.error('Error scrolling to line:', error);
        }

        return;
      }

      if (currentLeft !== newLeft || currentTop !== newTop) {
        view.scrollDOM.scrollTo(newLeft, newTop);
      }
      
      if (autoFocus) {
        view.focus();
      }
    });
  });
}

function getReadOnlyTooltip(state: EditorState) {
  return [
    {
      pos: state.selection.main.head,
      above: false,
      strictSide: true,
      arrow: true,
      create: () => {
        const dom = document.createElement('div');
        dom.className = 'cm-readonly-tooltip';
        dom.textContent = 'File is read-only';
        return { dom };
      },
    },
  ];
}
