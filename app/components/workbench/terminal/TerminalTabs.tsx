import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { type RefObject } from 'react';
import { IconButton } from '~/components/ui/IconButton';
import { type Theme } from '~/lib/stores/theme';
import { classNames } from '~/utils/classNames';
import { Terminal, type TerminalRef } from './Terminal';

// Default terminal size as a percentage of the panel
export const DEFAULT_TERMINAL_SIZE = 30;

export interface TerminalTabData {
  id: string;
  title: string;
  icon?: string;
  isRunning?: boolean;
  hasError?: boolean;
  lastOutput?: string;
  workingDirectory?: string;
  command?: string;
  createdAt: Date;
  isActive?: boolean;
}

interface TerminalTabsProps {
  className?: string;
  theme: Theme;
  onTerminalReady?: (id: string, terminal: any) => void;
  onTerminalResize?: (id: string, cols: number, rows: number) => void;
  onTabChange?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onNewTab?: () => void;
  activeTabId?: string;
  tabs?: TerminalTabData[];
  maxTabs?: number;
  enableSearch?: boolean;
  enableWebGL?: boolean;
  readonly?: boolean;
}

export default function TerminalTabs({
  className,
  theme,
  onTerminalReady,
  onTerminalResize,
  onTabChange,
  onTabClose,
  onNewTab,
  activeTabId,
  tabs = [],
  maxTabs = 10,
  enableSearch = true,
  enableWebGL = true,
  readonly = false,
}: TerminalTabsProps) {
  const terminalRefs = useRef<Record<string, RefObject<TerminalRef>>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [terminalStates, setTerminalStates] = useState<
    Record<
      string,
      {
        isConnected: boolean;
        lastActivity: Date;
        output: string[];
      }
    >
  >({});

  // Ensure we have at least one tab
  const effectiveTabs = useMemo(() => {
    if (tabs.length === 0) {
      return [
        {
          id: 'default',
          title: 'Terminal',
          icon: 'i-ph:terminal',
          createdAt: new Date(),
          isActive: true,
        },
      ];
    }

    return tabs;
  }, [tabs]);

  const activeTab = useMemo(() => {
    const active = effectiveTabs.find((tab) => tab.id === activeTabId) || effectiveTabs[0];
    return active;
  }, [effectiveTabs, activeTabId]);

  // Initialize terminal refs for new tabs
  useEffect(() => {
    effectiveTabs.forEach((tab) => {
      if (!terminalRefs.current[tab.id]) {
        terminalRefs.current[tab.id] = { current: null };
      }
    });

    // Clean up refs for removed tabs
    Object.keys(terminalRefs.current).forEach((id) => {
      if (!effectiveTabs.find((tab) => tab.id === id)) {
        delete terminalRefs.current[id];
      }
    });
  }, [effectiveTabs]);

  const handleTabClick = useCallback(
    (tabId: string) => {
      onTabChange?.(tabId);
    },
    [onTabChange],
  );

  const handleTabClose = useCallback(
    (tabId: string, event: React.MouseEvent) => {
      event.stopPropagation();

      if (effectiveTabs.length > 1) {
        onTabClose?.(tabId);
      }
    },
    [effectiveTabs.length, onTabClose],
  );

  const handleNewTab = useCallback(() => {
    if (effectiveTabs.length < maxTabs) {
      onNewTab?.();
    }
  }, [effectiveTabs.length, maxTabs, onNewTab]);

  const handleTerminalReady = useCallback(
    (tabId: string, terminal: any) => {
      setTerminalStates((prev) => ({
        ...prev,
        [tabId]: {
          isConnected: true,
          lastActivity: new Date(),
          output: [],
        },
      }));
      onTerminalReady?.(tabId, terminal);
    },
    [onTerminalReady],
  );

  const handleTerminalResize = useCallback(
    (tabId: string, cols: number, rows: number) => {
      onTerminalResize?.(tabId, cols, rows);
    },
    [onTerminalResize],
  );

  const handleSearch = useCallback(
    (term: string) => {
      if (activeTab && terminalRefs.current[activeTab.id]?.current) {
        terminalRefs.current[activeTab.id].current?.search(term);
      }
    },
    [activeTab],
  );

  const handleSearchNext = useCallback(() => {
    if (activeTab && terminalRefs.current[activeTab.id]?.current) {
      terminalRefs.current[activeTab.id].current?.findNext();
    }
  }, [activeTab]);

  const handleSearchPrevious = useCallback(() => {
    if (activeTab && terminalRefs.current[activeTab.id]?.current) {
      terminalRefs.current[activeTab.id].current?.findPrevious();
    }
  }, [activeTab]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 't':
            if (effectiveTabs.length < maxTabs) {
              handleNewTab();
              event.preventDefault();
            }

            break;
          case 'w':
            if (effectiveTabs.length > 1 && activeTab) {
              onTabClose?.(activeTab.id);
              event.preventDefault();
            }

            break;
          case 'f':
            if (enableSearch) {
              setIsSearchVisible((prev) => !prev);
              event.preventDefault();
            }

            break;
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9': {
            const tabIndex = parseInt(event.key) - 1;

            if (tabIndex < effectiveTabs.length) {
              handleTabClick(effectiveTabs[tabIndex].id);
              event.preventDefault();
            }

            break;
          }
        }
      }
    },
    [effectiveTabs, maxTabs, activeTab, enableSearch, handleNewTab, onTabClose, handleTabClick],
  );

  // Clear terminals when tabs change
  const handleClearAll = useCallback(() => {
    Object.values(terminalRefs.current).forEach((ref) => {
      ref.current?.clear();
    });
  }, []);

  const getTabDisplayTitle = useCallback((_tab: TerminalTabData) => {
    if (_tab.command) {
      return `${_tab.title}: ${_tab.command}`;
    }

    if (_tab.workingDirectory) {
      const dirName = _tab.workingDirectory.split('/').pop() || _tab.workingDirectory;
      return `${_tab.title} (${dirName})`;
    }

    return _tab.title;
  }, []);

  return (
    <div
      className={classNames('flex flex-col h-full bg-bolt-elements-bg-depth-1', className)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Tab Bar */}
      <div className="flex items-center border-b border-bolt-elements-borderColor bg-bolt-elements-bg-depth-2 px-2 py-1">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
            {effectiveTabs.map((tab) => {
              const isActive = tab.id === activeTab?.id;
              const state = terminalStates[tab.id];

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={classNames(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 min-w-0 max-w-48',
                    'border border-transparent',
                    {
                      'bg-bolt-elements-bg-depth-1 text-bolt-elements-textPrimary border-bolt-elements-borderColorActive':
                        isActive,
                      'hover:bg-bolt-elements-bg-depth-3 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary':
                        !isActive,
                      'bg-red-500/10 border-red-500/30': tab.hasError,
                    },
                  )}
                  title={getTabDisplayTitle(tab)}
                >
                  {/* Tab Icon */}
                  {tab.icon && (
                    <div
                      className={classNames(tab.icon, 'text-sm flex-shrink-0', {
                        'text-green-500': state?.isConnected && tab.isRunning,
                        'text-red-500': tab.hasError,
                        'text-yellow-500': state?.isConnected && !tab.isRunning,
                      })}
                    />
                  )}

                  {/* Tab Title */}
                  <span className="truncate flex-1 min-w-0">{tab.title}</span>

                  {/* Running Indicator */}
                  {tab.isRunning && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />}

                  {/* Close Button */}
                  {effectiveTabs.length > 1 && (
                    <IconButton
                      icon="i-ph:x"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-500 flex-shrink-0"
                      onClick={(e) => handleTabClose(tab.id, e)}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* New Tab Button */}
          {effectiveTabs.length < maxTabs && (
            <IconButton
              icon="i-ph:plus"
              size="sm"
              onClick={handleNewTab}
              className="flex-shrink-0 hover:bg-bolt-elements-bg-depth-3"
              title="New Terminal (Ctrl+T)"
            />
          )}
        </div>

        {/* Terminal Actions */}
        <div className="flex items-center gap-1 ml-2">
          {enableSearch && (
            <IconButton
              icon="i-ph:magnifying-glass"
              size="sm"
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className={classNames('hover:bg-bolt-elements-bg-depth-3', {
                'text-accent-500 bg-accent-500/10': isSearchVisible,
              })}
              title="Search (Ctrl+F)"
            />
          )}

          <IconButton
            icon="i-ph:broom"
            size="sm"
            onClick={handleClearAll}
            className="hover:bg-bolt-elements-bg-depth-3"
            title="Clear All Terminals"
          />

          <IconButton
            icon="i-ph:list"
            size="sm"
            className="hover:bg-bolt-elements-bg-depth-3"
            title="Terminal Options"
          />
        </div>
      </div>

      {/* Search Bar */}
      {isSearchVisible && enableSearch && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-bolt-elements-borderColor bg-bolt-elements-bg-depth-2">
          <input
            type="text"
            placeholder="Search in terminal..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleSearch(e.target.value);
            }}
            className="flex-1 px-3 py-1 text-sm bg-bolt-elements-bg-depth-1 border border-bolt-elements-borderColor rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500/50 text-bolt-elements-textPrimary"
            autoFocus
          />
          <IconButton
            icon="i-ph:caret-up"
            size="sm"
            onClick={handleSearchPrevious}
            className="hover:bg-bolt-elements-bg-depth-3"
            title="Previous (Shift+Enter)"
          />
          <IconButton
            icon="i-ph:caret-down"
            size="sm"
            onClick={handleSearchNext}
            className="hover:bg-bolt-elements-bg-depth-3"
            title="Next (Enter)"
          />
          <IconButton
            icon="i-ph:x"
            size="sm"
            onClick={() => setIsSearchVisible(false)}
            className="hover:bg-bolt-elements-bg-depth-3"
            title="Close Search (Escape)"
          />
        </div>
      )}

      {/* Terminal Content */}
      <div className="flex-1 relative">
        {effectiveTabs.map((tab) => {
          const isActive = tab.id === activeTab?.id;

          return (
            <div
              key={tab.id}
              className={classNames('absolute inset-0 transition-opacity duration-200', {
                'opacity-100 pointer-events-auto': isActive,
                'opacity-0 pointer-events-none': !isActive,
              })}
            >
              <Terminal
                ref={terminalRefs.current[tab.id]}
                id={tab.id}
                theme={theme}
                readonly={readonly}
                enableSearch={enableSearch}
                enableWebGL={enableWebGL}
                className="w-full h-full"
                onTerminalReady={(terminal) => handleTerminalReady(tab.id, terminal)}
                onTerminalResize={(cols, rows) => handleTerminalResize(tab.id, cols, rows)}
                onData={(data) => {
                  // Update last activity
                  setTerminalStates((prev) => ({
                    ...prev,
                    [tab.id]: {
                      ...prev[tab.id],
                      lastActivity: new Date(),
                      output: [...(prev[tab.id]?.output || []), data].slice(-1000), // Keep last 1000 lines
                    },
                  }));
                }}
                onTitle={(title) => {
                  // Could update tab title based on terminal title
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 text-xs text-bolt-elements-textTertiary border-t border-bolt-elements-borderColor bg-bolt-elements-bg-depth-2">
        <div className="flex items-center gap-4">
          <span>
            Terminal {effectiveTabs.findIndex((t) => t.id === activeTab?.id) + 1} of {effectiveTabs.length}
          </span>
          {activeTab?.workingDirectory && (
            <span className="truncate max-w-64" title={activeTab.workingDirectory}>
              📁 {activeTab.workingDirectory}
            </span>
          )}
          {activeTab?.isRunning && <span className="text-green-500">● Running</span>}
        </div>

        <div className="flex items-center gap-2">
          <span>WebGL: {enableWebGL ? 'On' : 'Off'}</span>
          <span>Search: {enableSearch ? 'On' : 'Off'}</span>
        </div>
      </div>
    </div>
  );
}
