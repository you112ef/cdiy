import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { classNames } from '~/utils/classNames';
import { TabTile } from '~/components/@settings/shared/components/TabTile';
import { useFeatures } from '~/lib/hooks/useFeatures';
import { useNotifications } from '~/lib/hooks/useNotifications';
import { useConnectionStatus } from '~/lib/hooks/useConnectionStatus';
import { tabConfigurationStore, resetTabConfiguration } from '~/lib/stores/settings';
import { profileStore } from '~/lib/stores/profile';
import type { TabType, Profile } from './types';
import { TAB_LABELS, DEFAULT_TAB_CONFIG, TAB_DESCRIPTIONS } from './constants';
import { DialogTitle } from '~/components/ui/Dialog';
import { AvatarDropdown } from './AvatarDropdown';
import BackgroundRays from '~/components/ui/BackgroundRays';

// Import all tab components
import ProfileTab from '~/components/@settings/tabs/profile/ProfileTab';
import SettingsTab from '~/components/@settings/tabs/settings/SettingsTab';
import NotificationsTab from '~/components/@settings/tabs/notifications/NotificationsTab';
import FeaturesTab from '~/components/@settings/tabs/features/FeaturesTab';
import { DataTab } from '~/components/@settings/tabs/data/DataTab';
import { EventLogsTab } from '~/components/@settings/tabs/event-logs/EventLogsTab';
import ConnectionsTab from '~/components/@settings/tabs/connections/ConnectionsTab';
import CloudProvidersTab from '~/components/@settings/tabs/providers/cloud/CloudProvidersTab';
import ServiceStatusTab from '~/components/@settings/tabs/providers/status/ServiceStatusTab';
import LocalProvidersTab from '~/components/@settings/tabs/providers/local/LocalProvidersTab';

interface ControlPanelProps {
  open: boolean;
  onClose: () => void;
}

// Beta status for experimental features
const BETA_TABS = new Set<TabType>(['service-status', 'local-providers']);

const BetaLabel = () => (
  <div className="absolute top-2 right-2 text-xs bg-purple-500 text-white rounded-full px-2 py-0.5 font-medium">
    BETA
  </div>
);

export const ControlPanel = ({ open, onClose }: ControlPanelProps) => {
  // State
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [loadingTab, setLoadingTab] = useState<TabType | null>(null);
  const [showTabManagement, setShowTabManagement] = useState(false);

  // Store values
  const tabConfiguration = useStore(tabConfigurationStore);
  const profile = useStore(profileStore) as Profile;

  // Status hooks
  const { hasNewFeatures, unviewedFeatures, acknowledgeAllFeatures } = useFeatures();
  const { hasUnreadNotifications, unreadNotifications, markAllAsRead } = useNotifications();
  const { hasConnectionIssues, currentIssue, acknowledgeIssue } = useConnectionStatus();

  // Memoize the base tab configurations to avoid recalculation
  const baseTabConfig = useMemo(() => {
    return new Map(DEFAULT_TAB_CONFIG.map((tab) => [tab.id, tab]));
  }, []);

  // Add visibleTabs logic using useMemo with optimized calculations
  const visibleTabs = useMemo(() => {
    if (!tabConfiguration?.userTabs || !Array.isArray(tabConfiguration.userTabs)) {
      console.warn('Invalid tab configuration, resetting to defaults');
      resetTabConfiguration();
      return [];
    }

    const notificationsDisabled = profile?.preferences?.notifications === false;

    // Optimize user mode tab filtering
    return tabConfiguration.userTabs
      .filter((tab) => {
        if (!tab?.id) {
          return false;
        }

        if (tab.id === 'notifications' && notificationsDisabled) {
          return false;
        }

        return tab.visible && tab.window === 'user';
      })
      .sort((a, b) => a.order - b.order);
  }, [tabConfiguration, profile?.preferences?.notifications, baseTabConfig]);

  // Reset to default view when modal opens/closes
  useEffect(() => {
    if (!open) {
      // Reset when closing
      setActiveTab(null);
      setLoadingTab(null);
      setShowTabManagement(false);
    } else {
      // When opening, set to null to show the main view
      setActiveTab(null);
    }
  }, [open]);

  // Handle closing
  const handleClose = () => {
    setActiveTab(null);
    setLoadingTab(null);
    setShowTabManagement(false);
    onClose();
  };

  // Handlers
  const handleBack = () => {
    if (showTabManagement) {
      setShowTabManagement(false);
    } else if (activeTab) {
      setActiveTab(null);
    }
  };

  const getTabComponent = (tabId: TabType) => {
    switch (tabId) {
      case 'profile':
        return <ProfileTab />;
      case 'settings':
        return <SettingsTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'features':
        return <FeaturesTab />;
      case 'data':
        return <DataTab />;
      case 'cloud-providers':
        return <CloudProvidersTab />;
      case 'local-providers':
        return <LocalProvidersTab />;
      case 'connection':
        return <ConnectionsTab />;
      case 'event-logs':
        return <EventLogsTab />;
      case 'service-status':
        return <ServiceStatusTab />;
      default:
        return null;
    }
  };

  const getTabUpdateStatus = (tabId: TabType): boolean => {
    switch (tabId) {
      case 'features':
        return hasNewFeatures;
      case 'notifications':
        return hasUnreadNotifications;
      case 'connection':
        return hasConnectionIssues;
      default:
        return false;
    }
  };

  const getStatusMessage = (tabId: TabType): string => {
    switch (tabId) {
      case 'features':
        return `${unviewedFeatures.length} new feature${unviewedFeatures.length === 1 ? '' : 's'} to explore`;
      case 'notifications':
        return `${unreadNotifications.length} unread notification${unreadNotifications.length === 1 ? '' : 's'}`;
      case 'connection':
        return currentIssue === 'disconnected'
          ? 'Connection lost'
          : currentIssue === 'high-latency'
            ? 'High latency detected'
            : 'Connection issues detected';
      default:
        return '';
    }
  };

  const handleTabClick = (tabId: TabType) => {
    setLoadingTab(tabId);
    setActiveTab(tabId);
    setShowTabManagement(false);

    // Acknowledge notifications based on tab
    switch (tabId) {
      case 'features':
        acknowledgeAllFeatures();
        break;
      case 'notifications':
        markAllAsRead();
        break;
      case 'connection':
        acknowledgeIssue();
        break;
    }

    // Clear loading state after a delay
    setTimeout(() => setLoadingTab(null), 500);
  };

  return (
    <RadixDialog.Root open={open}>
      <RadixDialog.Portal>
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
          <RadixDialog.Overlay className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-200" />

          <RadixDialog.Content
            aria-describedby={undefined}
            onEscapeKeyDown={handleClose}
            onPointerDownOutside={handleClose}
            className="relative z-[101] w-full max-w-6xl max-h-[90vh] mx-auto"
          >
            <div
              className={classNames(
                'bg-zinc-900 rounded-2xl shadow-xl border border-zinc-700',
                'flex flex-col overflow-hidden',
                'relative',
                'transform transition-all duration-200 ease-out',
                open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4',
              )}
            >
              <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-10">
                <BackgroundRays />
              </div>
              
              <div className="relative z-10 flex flex-col h-full max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-700 bg-zinc-800/50 rounded-t-2xl">
                  <div className="flex items-center gap-3 md:gap-4">
                    {(activeTab || showTabManagement) && (
                      <button
                        onClick={handleBack}
                        className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-700 hover:bg-zinc-600 group transition-colors duration-150"
                      >
                        <div className="i-ph:arrow-left w-4 h-4 md:w-5 md:h-5 text-zinc-300 group-hover:text-white transition-colors" />
                      </button>
                    )}
                    <DialogTitle className="text-lg md:text-xl font-semibold text-white flex items-center gap-2">
                      {showTabManagement ? 'Tab Management' : activeTab ? TAB_LABELS[activeTab] : 'Control Panel'}
                    </DialogTitle>
                  </div>

                  <div className="flex items-center gap-4 md:gap-6">
                    {/* Avatar and Dropdown */}
                    <div className="pl-2 md:pl-6">
                      <AvatarDropdown onSelectTab={handleTabClick} />
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={handleClose}
                      className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-700 hover:bg-red-600 group transition-all duration-200"
                    >
                      <div className="i-ph:x w-4 h-4 md:w-5 md:h-5 text-zinc-300 group-hover:text-white transition-colors" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 md:p-6 transition-opacity duration-150">
                    {activeTab ? (
                      <div className="max-w-4xl mx-auto">
                        {getTabComponent(activeTab)}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
                        {visibleTabs.map((tab, index) => (
                          <div
                            key={tab.id}
                            className={classNames(
                              'aspect-[1.2/1] transition-transform duration-100 ease-out',
                              'hover:scale-105',
                            )}
                            style={{
                              animationDelay: `${index * 50}ms`,
                              animation: open ? 'fadeInUp 300ms ease-out forwards' : 'none',
                            }}
                          >
                            <div
                              onClick={() => handleTabClick(tab.id as TabType)}
                              className="h-full bg-zinc-800 hover:bg-zinc-700 rounded-2xl shadow-md p-4 md:p-6 cursor-pointer transition-all duration-200 relative border border-zinc-700 hover:border-purple-500/50 group"
                            >
                              {BETA_TABS.has(tab.id) && <BetaLabel />}
                              
                              <div className="flex flex-col h-full">
                                {/* Tab Icon */}
                                <div className="flex-shrink-0 mb-3 md:mb-4">
                                  <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                                    <div className="w-5 h-5 md:w-6 md:h-6 text-purple-400 group-hover:text-purple-300" />
                                  </div>
                                </div>
                                
                                {/* Tab Title */}
                                <h3 className="text-sm md:text-base font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                                  {TAB_LABELS[tab.id]}
                                </h3>
                                
                                {/* Tab Description */}
                                <p className="text-xs md:text-sm text-zinc-400 line-clamp-2 flex-1 group-hover:text-zinc-300 transition-colors">
                                  {TAB_DESCRIPTIONS[tab.id]}
                                </p>
                                
                                {/* Status Indicator */}
                                {getTabUpdateStatus(tab.id) && (
                                  <div className="mt-3 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-xs text-green-400 font-medium">
                                      {getStatusMessage(tab.id)}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Loading State */}
                                {loadingTab === tab.id && (
                                  <div className="absolute inset-0 bg-zinc-800/80 rounded-2xl flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </RadixDialog.Content>
        </div>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};
