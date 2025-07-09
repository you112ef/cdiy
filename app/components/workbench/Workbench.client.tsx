import { useStore } from '@nanostores/react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';
import { computed } from 'nanostores';
import { memo, useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { toast } from 'react-toastify';
import { Popover, Transition } from '@headlessui/react';
import { diffLines, type Change } from 'diff';
import { getLanguageFromExtension } from '~/utils/getLanguageFromExtension';
import type { FileHistory } from '~/types/actions';
import { DiffView } from './DiffView';
import {
  type OnChangeCallback as OnEditorChange,
  type OnScrollCallback as OnEditorScroll,
} from '~/components/editor/codemirror/CodeMirrorEditor';
import { IconButton } from '~/components/ui/IconButton';
import { PanelHeaderButton } from '~/components/ui/PanelHeaderButton';
import { Slider, type SliderOptions } from '~/components/ui/Slider';
import { workbenchStore, type WorkbenchViewType } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { renderLogger } from '~/utils/logger';
import { EditorPanel } from './EditorPanel';
import { Preview } from './Preview';
import useViewport from '~/lib/hooks';
import { PushToGitHubDialog } from '~/components/@settings/tabs/connections/components/PushToGitHubDialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { usePreviewStore } from '~/lib/stores/previews';
import { chatStore } from '~/lib/stores/chat';
import type { ElementInfo } from './Inspector';

interface WorkspaceProps {
  chatStarted?: boolean;
  isStreaming?: boolean;
  metadata?: {
    gitUrl?: string;
  };
  updateChatMestaData?: (metadata: any) => void;
  setSelectedElement?: (element: ElementInfo | null) => void;
}

const viewTransition = { ease: cubicEasingFn };

// Enhanced slider options with better mobile support
const sliderOptions: SliderOptions<WorkbenchViewType> = {
  left: {
    value: 'code',
    text: 'Code',
    icon: 'i-ph:code',
  },
  middle: {
    value: 'diff',
    text: 'Diff',
    icon: 'i-ph:git-diff',
  },
  right: {
    value: 'preview',
    text: 'Preview',
    icon: 'i-ph:eye',
  },
};

const workbenchVariants = {
  closed: {
    width: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    width: 'var(--workbench-width)',
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  openMobile: {
    width: '100vw',
    transition: {
      duration: 0.3,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

// Enhanced file dropdown with better search and organization
const FileModifiedDropdown = memo(
  ({
    fileHistory,
    onSelectFile,
  }: {
    fileHistory: Record<string, FileHistory>;
    onSelectFile: (filePath: string) => void;
  }) => {
    const modifiedFiles = Object.entries(fileHistory);
    const hasChanges = modifiedFiles.length > 0;
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'modified' | 'size'>('modified');

    const filteredAndSortedFiles = useMemo(() => {
      let filtered = modifiedFiles.filter(([filePath]) => 
        filePath.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Sort files based on selected criteria
      switch (sortBy) {
        case 'name':
          filtered.sort(([a], [b]) => a.localeCompare(b));
          break;
        case 'modified':
          filtered.sort(([, aHistory], [, bHistory]) => {
            const aTime = aHistory.versions[aHistory.versions.length - 1]?.timestamp || 0;
            const bTime = bHistory.versions[bHistory.versions.length - 1]?.timestamp || 0;
            return bTime - aTime;
          });
          break;
        case 'size':
          filtered.sort(([, aHistory], [, bHistory]) => {
            const aSize = aHistory.versions[aHistory.versions.length - 1]?.content.length || 0;
            const bSize = bHistory.versions[bHistory.versions.length - 1]?.content.length || 0;
            return bSize - aSize;
          });
          break;
      }

      return filtered;
    }, [modifiedFiles, searchQuery, sortBy]);

    const stats = useMemo(() => {
      const totalFiles = modifiedFiles.length;
      const totalChanges = modifiedFiles.reduce((acc, [, history]) => {
        if (!history.originalContent) return acc;
        
        const changes = diffLines(
          history.originalContent.replace(/\r\n/g, '\n'),
          history.versions[history.versions.length - 1]?.content.replace(/\r\n/g, '\n') || ''
        );
        
        return acc + changes.reduce((changeAcc, change) => {
          if (change.added) changeAcc.additions += change.value.split('\n').length;
          if (change.removed) changeAcc.deletions += change.value.split('\n').length;
          return changeAcc;
        }, { additions: 0, deletions: 0 }).additions + changes.reduce((changeAcc, change) => {
          if (change.removed) changeAcc += change.value.split('\n').length;
          return changeAcc;
        }, 0);
      }, 0);

      return { totalFiles, totalChanges };
    }, [modifiedFiles]);

    return (
      <div className="flex items-center gap-2">
        <Popover className="relative">
          {({ open }: { open: boolean }) => (
            <>
              <Popover.Button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-300 hover:text-white border border-zinc-600 hover:border-purple-500/50">
                <span className="text-sm font-medium">File Changes</span>
                {hasChanges && (
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center border border-purple-500/30 font-semibold">
                    {stats.totalFiles}
                  </span>
                )}
              </Popover.Button>
              <Transition
                show={open}
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Popover.Panel className="absolute right-0 z-20 mt-2 w-80 sm:w-96 origin-top-right rounded-xl bg-zinc-900 shadow-xl border border-zinc-700">
                  <div className="p-4">
                    {/* Search and Sort Controls */}
                    <div className="flex flex-col gap-3 mb-3">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search files..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full h-9 px-3 py-2 text-sm rounded-lg bg-zinc-800 border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 pl-8 text-white placeholder:text-zinc-400"
                        />
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400">
                          <div className="i-ph:magnifying-glass w-4 h-4" />
                        </div>
                      </div>
                      
                      {/* Sort Options */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400">Sort by:</span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as 'name' | 'modified' | 'size')}
                          className="text-xs bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white focus:ring-2 focus:ring-purple-500/50"
                        >
                          <option value="modified">Modified</option>
                          <option value="name">Name</option>
                          <option value="size">Size</option>
                        </select>
                      </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg mb-3">
                      <span className="text-xs text-zinc-300">
                        {stats.totalFiles} files modified
                      </span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-400">+{stats.totalChanges}</span>
                        <span className="text-red-400">-{Math.floor(stats.totalChanges * 0.3)}</span>
                      </div>
                    </div>

                    {/* File List */}
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {filteredAndSortedFiles.length > 0 ? (
                        filteredAndSortedFiles.map(([filePath, history]) => {
                          const extension = filePath.split('.').pop() || '';
                          const language = getLanguageFromExtension(extension);
                          const lastModified = new Date(history.versions[history.versions.length - 1]?.timestamp || Date.now());

                          return (
                            <button
                              key={filePath}
                              onClick={() => onSelectFile(filePath)}
                              className="w-full p-3 text-left rounded-md hover:bg-zinc-800 transition-colors group bg-transparent border border-transparent hover:border-zinc-600"
                            >
                              <div className="flex items-center gap-3">
                                <div className="shrink-0 w-4 h-4 text-zinc-400">
                                  {/* File type icons */}
                                  {(['typescript', 'javascript', 'jsx', 'tsx'].includes(language)) && <div className="i-ph:file-js" />}
                                  {(['css', 'scss', 'less'].includes(language)) && <div className="i-ph:paint-brush" />}
                                  {(language === 'html') && <div className="i-ph:code" />}
                                  {(language === 'json') && <div className="i-ph:brackets-curly" />}
                                  {(language === 'python') && <div className="i-ph:file-text" />}
                                  {(language === 'markdown') && <div className="i-ph:article" />}
                                  {(['yaml', 'yml'].includes(language)) && <div className="i-ph:file-text" />}
                                  {(language === 'sql') && <div className="i-ph:database" />}
                                  {(language === 'dockerfile') && <div className="i-ph:cube" />}
                                  {(language === 'shell') && <div className="i-ph:terminal" />}
                                  {!(['typescript', 'javascript', 'css', 'html', 'json', 'python', 'markdown', 'yaml', 'yml', 'sql', 'dockerfile', 'shell', 'jsx', 'tsx', 'scss', 'less'].includes(language)) && <div className="i-ph:file-text" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex flex-col min-w-0">
                                      <span className="truncate text-sm font-medium text-white">
                                        {filePath.split('/').pop()}
                                      </span>
                                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                                        <span className="truncate">{filePath}</span>
                                        <span>•</span>
                                        <span>{lastModified.toLocaleTimeString()}</span>
                                      </div>
                                    </div>
                                    {(() => {
                                      // Calculate diff stats
                                      const { additions, deletions } = (() => {
                                        if (!history.originalContent) {
                                          return { additions: 0, deletions: 0 };
                                        }

                                        const normalizedOriginal = history.originalContent.replace(/\r\n/g, '\n');
                                        const normalizedCurrent =
                                          history.versions[history.versions.length - 1]?.content.replace(
                                            /\r\n/g,
                                            '\n',
                                          ) || '';

                                        if (normalizedOriginal === normalizedCurrent) {
                                          return { additions: 0, deletions: 0 };
                                        }

                                        const changes = diffLines(normalizedOriginal, normalizedCurrent, {
                                          newlineIsToken: false,
                                          ignoreWhitespace: true,
                                          ignoreCase: false,
                                        });

                                        return changes.reduce(
                                          (acc: { additions: number; deletions: number }, change: Change) => {
                                            if (change.added) {
                                              acc.additions += change.value.split('\n').length;
                                            }

                                            if (change.removed) {
                                              acc.deletions += change.value.split('\n').length;
                                            }

                                            return acc;
                                          },
                                          { additions: 0, deletions: 0 },
                                        );
                                      })();

                                      const showStats = additions > 0 || deletions > 0;

                                      return (
                                        showStats && (
                                          <div className="flex items-center gap-2 text-xs shrink-0">
                                            {additions > 0 && <span className="text-green-400">+{additions}</span>}
                                            {deletions > 0 && <span className="text-red-400">-{deletions}</span>}
                                          </div>
                                        )
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                          <div className="w-12 h-12 mb-2 text-zinc-400">
                            <div className="i-ph:file-dashed" />
                          </div>
                          <p className="text-sm font-medium text-white">
                            {searchQuery ? 'No matching files' : 'No modified files'}
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">
                            {searchQuery ? 'Try another search' : 'Changes will appear here as you edit'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {hasChanges && (
                    <div className="border-t border-zinc-700 p-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(filteredAndSortedFiles.map(([filePath]) => filePath).join('\n'));
                            toast('File list copied to clipboard', {
                              icon: <div className="i-ph:check-circle text-purple-500" />,
                            });
                          }}
                          className="flex-1 flex items-center justify-center gap-2 h-8 px-3 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-300 hover:text-white border border-zinc-600"
                        >
                          <div className="i-ph:copy" />
                          Copy List
                        </button>
                        <button
                          onClick={() => {
                            // Export changes as patch
                            const patch = filteredAndSortedFiles.map(([filePath, history]) => {
                              return `--- ${filePath}\n+++ ${filePath}\n${history.versions[history.versions.length - 1]?.content || ''}`;
                            }).join('\n\n');
                            
                            const blob = new Blob([patch], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'changes.patch';
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 h-8 px-3 text-xs rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                        >
                          <div className="i-ph:download" />
                          Export
                        </button>
                      </div>
                    </div>
                  )}
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    );
  },
);

export const Workbench = memo(
  ({ chatStarted, isStreaming, metadata, updateChatMestaData, setSelectedElement }: WorkspaceProps) => {
    renderLogger.trace('Workbench');

    const [isSyncing, setIsSyncing] = useState(false);
    const [isPushDialogOpen, setIsPushDialogOpen] = useState(false);
    const [fileHistory, setFileHistory] = useState<Record<string, FileHistory>>({});
    const [isFullscreen, setIsFullscreen] = useState(false);
    const workbenchRef = useRef<HTMLDivElement>(null);

    const hasPreview = useStore(computed(workbenchStore.previews, (previews) => previews.length > 0));
    const showWorkbench = useStore(workbenchStore.showWorkbench);
    const selectedFile = useStore(workbenchStore.selectedFile);
    const currentDocument = useStore(workbenchStore.currentDocument);
    const unsavedFiles = useStore(workbenchStore.unsavedFiles);
    const files = useStore(workbenchStore.files);
    const selectedView = useStore(workbenchStore.currentView);
    const { showChat } = useStore(chatStore);
    const canHideChat = showWorkbench || !showChat;

    const isSmallViewport = useViewport(1024);
    const isMobileViewport = useViewport(768);

    const setSelectedView = (view: WorkbenchViewType) => {
      workbenchStore.currentView.set(view);
    };

    // Enhanced keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.ctrlKey || event.metaKey) {
          switch (event.key.toLowerCase()) {
            case '1':
              setSelectedView('code');
              event.preventDefault();
              break;
            case '2':
              setSelectedView('diff');
              event.preventDefault();
              break;
            case '3':
              setSelectedView('preview');
              event.preventDefault();
              break;
            case 'f11':
              setIsFullscreen(!isFullscreen);
              event.preventDefault();
              break;
            case 'b':
              if (canHideChat) {
                chatStore.setKey('showChat', !showChat);
                event.preventDefault();
              }
              break;
          }
        }
      };

      if (showWorkbench) {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
      }
    }, [showWorkbench, isFullscreen, canHideChat, showChat]);

    useEffect(() => {
      if (hasPreview) {
        setSelectedView('preview');
      }
    }, [hasPreview]);

    useEffect(() => {
      workbenchStore.setDocuments(files);
    }, [files]);

    const onEditorChange = useCallback<OnEditorChange>((update) => {
      workbenchStore.setCurrentDocumentContent(update.content);
    }, []);

    const onEditorScroll = useCallback<OnEditorScroll>((position) => {
      workbenchStore.setCurrentDocumentScrollPosition(position);
    }, []);

    const onFileSelect = useCallback((filePath: string | undefined) => {
      workbenchStore.setSelectedFile(filePath);
    }, []);

    const onFileSave = useCallback(() => {
      workbenchStore
        .saveCurrentDocument()
        .then(() => {
          const previewStore = usePreviewStore();
          previewStore.refreshAllPreviews();
          toast.success('File saved successfully', {
            icon: <div className="i-ph:check-circle text-green-500" />,
          });
        })
        .catch(() => {
          toast.error('Failed to update file content');
        });
    }, []);

    const onFileReset = useCallback(() => {
      workbenchStore.resetCurrentDocument();
    }, []);

    const handleSyncFiles = useCallback(async () => {
      setIsSyncing(true);

      try {
        const directoryHandle = await window.showDirectoryPicker();
        await workbenchStore.syncFiles(directoryHandle);
        toast.success('Files synced successfully');
      } catch (error) {
        console.error('Error syncing files:', error);
        toast.error('Failed to sync files');
      } finally {
        setIsSyncing(false);
      }
    }, []);

    const handleSelectFile = useCallback((filePath: string) => {
      workbenchStore.setSelectedFile(filePath);
      workbenchStore.currentView.set('diff');
    }, []);

    const getWorkbenchVariant = () => {
      if (!showWorkbench) return 'closed';
      return isMobileViewport ? 'openMobile' : 'open';
    };

    return (
      chatStarted && (
        <motion.div
          ref={workbenchRef}
          initial="closed"
          animate={getWorkbenchVariant()}
          variants={workbenchVariants}
          className={classNames('z-workbench', {
            'fixed inset-0 z-50': isFullscreen,
          })}
        >
          <div
            className={classNames(
              'fixed transition-[left,width] duration-200 bolt-ease-cubic-bezier',
              {
                'top-[calc(var(--header-height)+0.75rem)] bottom-3': !isFullscreen && !isMobileViewport,
                'top-0 bottom-0': isFullscreen || isMobileViewport,
                'w-[var(--workbench-inner-width)]': !isMobileViewport,
                'w-full': isMobileViewport,
                'left-0': (showWorkbench && isSmallViewport) || isFullscreen || isMobileViewport,
                'left-[var(--workbench-left)]': showWorkbench && !isSmallViewport && !isFullscreen && !isMobileViewport,
                'left-[100%]': !showWorkbench,
              },
            )}
          >
            <div className={classNames('absolute inset-0', {
              'mobile-p-sm lg:px-4': !isFullscreen && !isMobileViewport,
              'p-0': isFullscreen || isMobileViewport,
            })}>
              <div className={classNames(
                'h-full flex flex-col bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor shadow-sm overflow-hidden',
                {
                  'rounded-lg': !isFullscreen && !isMobileViewport,
                  'rounded-none': isFullscreen || isMobileViewport,
                }
              )}>
                {/* Enhanced Header */}
                <div className="flex items-center mobile-p-md border-b border-bolt-elements-borderColor mobile-gap-md bg-bolt-elements-background-depth-1">
                  {/* Left Side Controls */}
                  <div className="flex items-center mobile-gap-md">
                    <button
                      className={classNames(
                        'mobile-btn-icon rounded-md transition-colors',
                        showChat ? 'i-ph:sidebar-simple-fill' : 'i-ph:sidebar-simple',
                        {
                          'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary': canHideChat && !isSmallViewport,
                          'text-bolt-elements-textTertiary cursor-not-allowed': !canHideChat || isSmallViewport,
                        }
                      )}
                      disabled={!canHideChat || isSmallViewport}
                      onClick={() => {
                        if (canHideChat) {
                          chatStore.setKey('showChat', !showChat);
                        }
                      }}
                      title={canHideChat ? 'Toggle Chat Panel (Ctrl+B)' : 'Cannot hide chat panel'}
                    />
                    
                    {/* View Selector */}
                    <div className="flex-1 max-w-xs">
                      <Slider 
                        selected={selectedView} 
                        options={sliderOptions} 
                        setSelected={setSelectedView}
                        className="mobile-text-sm"
                      />
                    </div>
                  </div>

                  {/* Center - View-specific Controls */}
                  <div className="flex items-center mobile-gap-md flex-1 justify-center">
                    {selectedView === 'diff' && (
                      <FileModifiedDropdown fileHistory={fileHistory} onSelectFile={handleSelectFile} />
                    )}
                  </div>

                  {/* Right Side Controls */}
                  <div className="flex items-center mobile-gap-md">
                    {selectedView === 'code' && (
                      <div className="flex items-center mobile-gap-sm">
                        <PanelHeaderButton
                          className="mobile-btn-sm mobile-text-sm"
                          onClick={() => {
                            workbenchStore.toggleTerminal(!workbenchStore.showTerminal.get());
                          }}
                        >
                          <div className="i-ph:terminal mobile-icon-sm" />
                          <span className="hidden sm:inline">Terminal</span>
                        </PanelHeaderButton>
                        
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger className="mobile-btn-sm mobile-text-sm flex items-center mobile-gap-sm text-bolt-elements-item-contentDefault bg-transparent enabled:hover:text-bolt-elements-item-contentActive rounded-md enabled:hover:bg-bolt-elements-item-backgroundActive disabled:cursor-not-allowed">
                            <div className="i-ph:box-arrow-up mobile-icon-sm" />
                            <span className="hidden sm:inline">Sync</span>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content
                            className={classNames(
                              'min-w-[200px] sm:min-w-[240px] z-[250]',
                              'bg-white dark:bg-[#141414]',
                              'rounded-lg shadow-lg',
                              'border border-gray-200/50 dark:border-gray-800/50',
                              'animate-in fade-in-0 zoom-in-95',
                              'py-1',
                            )}
                            sideOffset={5}
                            align="end"
                          >
                            <DropdownMenu.Item
                              className="cursor-pointer flex items-center w-full mobile-p-md mobile-text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive mobile-gap-md rounded-md group relative"
                              onClick={handleSyncFiles}
                              disabled={isSyncing}
                            >
                              <div className="flex items-center mobile-gap-md">
                                {isSyncing ? <div className="i-ph:spinner animate-spin" /> : <div className="i-ph:cloud-arrow-down" />}
                                <span>{isSyncing ? 'Syncing...' : 'Sync Files'}</span>
                              </div>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              className="cursor-pointer flex items-center w-full mobile-p-md mobile-text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive mobile-gap-md rounded-md group relative"
                              onClick={() => setIsPushDialogOpen(true)}
                            >
                              <div className="flex items-center mobile-gap-md">
                                <div className="i-ph:git-branch" />
                                Push to GitHub
                              </div>
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Root>
                      </div>
                    )}
                    
                    {/* Fullscreen Toggle */}
                    <IconButton
                      icon={isFullscreen ? "i-ph:arrows-in" : "i-ph:arrows-out"}
                      size="sm"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="hover:bg-bolt-elements-item-backgroundActive"
                      title={isFullscreen ? "Exit Fullscreen (F11)" : "Enter Fullscreen (F11)"}
                    />
                    
                    {/* Close Button */}
                    <IconButton
                      icon="i-ph:x-circle"
                      size="sm"
                      onClick={() => {
                        workbenchStore.showWorkbench.set(false);
                        setIsFullscreen(false);
                      }}
                      className="hover:bg-bolt-elements-item-backgroundActive"
                      title="Close Workbench"
                    />
                  </div>
                </div>

                {/* Content Area */}
                <div className="relative flex-1 overflow-hidden">
                  <View initial={{ x: '0%' }} animate={{ x: selectedView === 'code' ? '0%' : '-100%' }}>
                    <EditorPanel
                      editorDocument={currentDocument}
                      isStreaming={isStreaming}
                      selectedFile={selectedFile}
                      files={files}
                      unsavedFiles={unsavedFiles}
                      fileHistory={fileHistory}
                      onFileSelect={onFileSelect}
                      onEditorScroll={onEditorScroll}
                      onEditorChange={onEditorChange}
                      onFileSave={onFileSave}
                      onFileReset={onFileReset}
                    />
                  </View>
                  <View
                    initial={{ x: '100%' }}
                    animate={{ x: selectedView === 'diff' ? '0%' : selectedView === 'code' ? '100%' : '-100%' }}
                  >
                    <DiffView fileHistory={fileHistory} setFileHistory={setFileHistory} />
                  </View>
                  <View initial={{ x: '100%' }} animate={{ x: selectedView === 'preview' ? '0%' : '100%' }}>
                    <Preview setSelectedElement={setSelectedElement} />
                  </View>
                </div>
              </div>
            </div>
          </div>
          
          {/* GitHub Push Dialog */}
          <PushToGitHubDialog
            isOpen={isPushDialogOpen}
            onClose={() => setIsPushDialogOpen(false)}
            onPush={async (repoName, username, token, isPrivate) => {
              try {
                await workbenchStore.pushToGitHub(repoName, username, token, isPrivate);
                setIsPushDialogOpen(false);
                toast.success('Successfully pushed to GitHub');
              } catch (error) {
                console.error('Failed to push to GitHub:', error);
                toast.error('Failed to push to GitHub');
              }
            }}
          />
        </motion.div>
      )
    );
  },
);

interface ViewProps extends HTMLMotionProps<'div'> {
  children: JSX.Element;
}

const View = ({ children, ...motionProps }: ViewProps) => {
  return (
    <motion.div className="absolute inset-0" {...motionProps}>
      {children}
    </motion.div>
  );
};
