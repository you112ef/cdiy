import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import { CanvasAddon } from '@xterm/addon-canvas';
import { SerializeAddon } from '@xterm/addon-serialize';
import { Terminal as XTerm } from '@xterm/xterm';
import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react';
import type { Theme } from '~/lib/stores/theme';
import { createScopedLogger } from '~/utils/logger';
import { getTerminalTheme } from './theme';

const logger = createScopedLogger('Terminal');

export interface TerminalRef {
  reloadStyles: () => void;
  getTerminal: () => XTerm | undefined;
  focus: () => void;
  clear: () => void;
  selectAll: () => void;
  copy: () => void;
  paste: () => void;
  search: (term: string) => void;
  findNext: () => void;
  findPrevious: () => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  serialize: () => string;
}

export interface TerminalProps {
  className?: string;
  theme: Theme;
  readonly?: boolean;
  id: string;
  onTerminalReady?: (terminal: XTerm) => void;
  onTerminalResize?: (cols: number, rows: number) => void;
  onData?: (data: string) => void;
  onTitle?: (title: string) => void;
  enableSearch?: boolean;
  enableWebGL?: boolean;
  fontSize?: number;
  fontFamily?: string;
  cursorBlink?: boolean;
  scrollback?: number;
}

export const Terminal = memo(
  forwardRef<TerminalRef, TerminalProps>(
    (
      {
        className,
        theme,
        readonly = false,
        id,
        onTerminalReady,
        onTerminalResize,
        onData,
        onTitle,
        enableSearch = true,
        enableWebGL = true,
        fontSize = 14,
        fontFamily = 'Menlo, "Cascadia Code", "Fira Code", Monaco, courier-new, courier, monospace',
        cursorBlink = true,
        scrollback = 1000,
      },
      ref,
    ) => {
      const terminalElementRef = useRef<HTMLDivElement>(null);
      const terminalRef = useRef<XTerm>();
      const fitAddonRef = useRef<FitAddon>();
      const searchAddonRef = useRef<SearchAddon>();
      const webLinksAddonRef = useRef<WebLinksAddon>();
      const renderAddonRef = useRef<WebglAddon | CanvasAddon>();
      const serializeAddonRef = useRef<SerializeAddon>();

      const [currentFontSize, setCurrentFontSize] = useState(fontSize);
      const [isInitialized, setIsInitialized] = useState(false);

      const handleResize = useCallback(() => {
        if (fitAddonRef.current && terminalRef.current) {
          try {
            fitAddonRef.current.fit();

            const terminal = terminalRef.current;
            onTerminalResize?.(terminal.cols, terminal.rows);
          } catch (error) {
            logger.warn('Terminal resize failed:', error);
          }
        }
        return undefined;
      }, [onTerminalResize]);

      const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
          const terminal = terminalRef.current;

          if (!terminal || readonly) {
            return;
          }

          // Handle keyboard shortcuts
          if (event.ctrlKey || event.metaKey) {
            switch (event.key.toLowerCase()) {
              case 'c':
                if (terminal.hasSelection()) {
                  document.execCommand('copy');
                  event.preventDefault();
                }

                break;
              case 'v':
                if (!readonly) {
                  navigator.clipboard.readText().then((text) => {
                    terminal.paste(text);
                  });
                  event.preventDefault();
                }

                break;
              case 'a':
                terminal.selectAll();
                event.preventDefault();
                break;
              case 'f':
                if (enableSearch && searchAddonRef.current) {
                  // This would trigger search UI in a real implementation
                  event.preventDefault();
                }

                break;
              case '+':
              case '=':
                setCurrentFontSize((prev) => Math.min(prev + 2, 32));
                event.preventDefault();
                break;
              case '-':
                setCurrentFontSize((prev) => Math.max(prev - 2, 8));
                event.preventDefault();
                break;
              case '0':
                setCurrentFontSize(fontSize);
                event.preventDefault();
                break;
            }
          }

          // Handle other special keys
          switch (event.key) {
            case 'Home':
              if (event.ctrlKey) {
                terminal.scrollToTop();
                event.preventDefault();
              }

              break;
            case 'End':
              if (event.ctrlKey) {
                terminal.scrollToBottom();
                event.preventDefault();
              }

              break;
            case 'PageUp':
              terminal.scrollPages(-1);
              event.preventDefault();
              break;
            case 'PageDown':
              terminal.scrollPages(1);
              event.preventDefault();
              break;
          }
        },
        [readonly, enableSearch, fontSize],
      );

      useEffect(() => {
        const element = terminalElementRef.current;

        if (!element) {
          return;
        }

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();
        const serializeAddon = new SerializeAddon();

        fitAddonRef.current = fitAddon;
        webLinksAddonRef.current = webLinksAddon;
        serializeAddonRef.current = serializeAddon;

        let searchAddon: SearchAddon | undefined;

        if (enableSearch) {
          searchAddon = new SearchAddon();
          searchAddonRef.current = searchAddon;
        }

        const terminal = new XTerm({
          cursorBlink,
          convertEol: true,
          disableStdin: readonly,
          theme: getTerminalTheme(readonly ? { cursor: '#00000000' } : {}),
          fontSize: currentFontSize,
          fontFamily,
          scrollback,
          allowProposedApi: true,
          rightClickSelectsWord: true,
          windowsMode: navigator.platform.indexOf('Win') >= 0,
        });

        terminalRef.current = terminal;

        // Load addons
        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);
        terminal.loadAddon(serializeAddon);

        if (searchAddon) {
          terminal.loadAddon(searchAddon);
        }

        // Try to load WebGL addon, fallback to Canvas
        if (enableWebGL) {
          try {
            const webglAddon = new WebglAddon();
            terminal.loadAddon(webglAddon);
            renderAddonRef.current = webglAddon;
          } catch (error) {
            logger.warn('WebGL not supported, falling back to Canvas:', error);

            try {
              const canvasAddon = new CanvasAddon();
              terminal.loadAddon(canvasAddon);
              renderAddonRef.current = canvasAddon;
            } catch (canvasError) {
              logger.warn('Canvas addon failed to load:', canvasError);
            }
          }
        }

        terminal.open(element);

        // Set up event listeners
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(element);

        // Terminal event handlers
        const onDataHandler = (data: string) => {
          onData?.(data);
        };

        const onTitleChangeHandler = (title: string) => {
          onTitle?.(title);
        };

        const onResizeHandler = ({ cols, rows }: { cols: number; rows: number }) => {
          onTerminalResize?.(cols, rows);
        };

        terminal.onData(onDataHandler);
        terminal.onTitleChange(onTitleChangeHandler);
        terminal.onResize(onResizeHandler);

        // Keyboard event listener
        element.addEventListener('keydown', handleKeyDown);

        logger.debug(`Terminal attached [${id}]`);

        // Initial fit and notify ready
        requestAnimationFrame(() => {
          handleResize();
          setIsInitialized(true);
          onTerminalReady?.(terminal);
        });

        return () => {
          element.removeEventListener('keydown', handleKeyDown);
          resizeObserver.disconnect();
          terminal.dispose();
          logger.debug(`Terminal disposed [${id}]`);
        };
      }, [
        id,
        enableSearch,
        enableWebGL,
        currentFontSize,
        fontFamily,
        cursorBlink,
        scrollback,
        readonly,
        handleResize,
        handleKeyDown,
        onTerminalReady,
        onTerminalResize,
        onData,
        onTitle,
      ]);

      // Update theme when it changes
      useEffect(() => {
        const terminal = terminalRef.current;

        if (!terminal) {
          return;
        }

        terminal.options.theme = getTerminalTheme(readonly ? { cursor: '#00000000' } : {});
        terminal.options.disableStdin = readonly;
      }, [theme, readonly]);

      // Update font size when it changes
      useEffect(() => {
        const terminal = terminalRef.current;

        if (!terminal) {
          return;
        }

        terminal.options.fontSize = currentFontSize;

        // Trigger a resize to adjust to new font size
        setTimeout(handleResize, 100);
      }, [currentFontSize, handleResize]);

      useImperativeHandle(ref, () => {
        const terminal = terminalRef.current;
        const searchAddon = searchAddonRef.current;
        const serializeAddon = serializeAddonRef.current;

        return {
          reloadStyles: () => {
            if (terminal) {
              terminal.options.theme = getTerminalTheme(readonly ? { cursor: '#00000000' } : {});
            }
          },
          getTerminal: () => terminal,
          focus: () => {
            terminal?.focus();
          },
          clear: () => {
            terminal?.clear();
          },
          selectAll: () => {
            terminal?.selectAll();
          },
          copy: () => {
            if (terminal?.hasSelection()) {
              document.execCommand('copy');
            }
          },
          paste: () => {
            if (terminal && !readonly) {
              navigator.clipboard
                .readText()
                .then((text) => {
                  terminal.paste(text);
                })
                .catch((err) => {
                  logger.warn('Failed to paste from clipboard:', err);
                });
            }
          },
          search: (term: string) => {
            if (searchAddon && term) {
              searchAddon.findNext(term);
            }
          },
          findNext: () => {
            searchAddon?.findNext();
          },
          findPrevious: () => {
            searchAddon?.findPrevious();
          },
          scrollToTop: () => {
            terminal?.scrollToTop();
          },
          scrollToBottom: () => {
            terminal?.scrollToBottom();
          },
          increaseFontSize: () => {
            setCurrentFontSize((prev) => Math.min(prev + 2, 32));
          },
          decreaseFontSize: () => {
            setCurrentFontSize((prev) => Math.max(prev - 2, 8));
          },
          resetFontSize: () => {
            setCurrentFontSize(fontSize);
          },
          serialize: () => {
            return serializeAddon?.serialize() || '';
          },
        };
      }, [readonly, fontSize]);

      return (
        <div
          className={className}
          ref={terminalElementRef}
          style={{
            opacity: isInitialized ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        />
      );
    },
  ),
);
