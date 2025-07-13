import React from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import { ModelSelector } from '~/components/chat/ModelSelector';
import { APIKeyManager } from './APIKeyManager';
import { LOCAL_PROVIDERS } from '~/lib/stores/settings';
import FilePreview from './FilePreview';
import { ScreenshotStateManager } from './ScreenshotStateManager';
import { SendButton } from './SendButton.client';
import IconButton from '~/components/ui/IconButton';
import { toast } from 'react-toastify';
import { SpeechRecognitionButton } from '~/components/chat/SpeechRecognition';
import { SupabaseConnection } from './SupabaseConnection';
import { ExpoQrModal } from '~/components/workbench/ExpoQrModal';
import styles from './BaseChat.module.scss';
import type { ProviderInfo } from '~/types/model';
import { ColorSchemeDialog } from '~/components/ui/ColorSchemeDialog';
import type { DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';

interface ChatBoxProps {
  isModelSettingsCollapsed: boolean;
  setIsModelSettingsCollapsed: (collapsed: boolean) => void;
  provider: any;
  providerList: any[];
  modelList: any[];
  apiKeys: Record<string, string>;
  isModelLoading: string | undefined;
  onApiKeysChange: (providerName: string, apiKey: string) => void;
  uploadedFiles: File[];
  imageDataList: string[];
  textareaRef: React.RefObject<HTMLTextAreaElement> | undefined;
  input: string;
  handlePaste: (e: React.ClipboardEvent) => void;
  TEXTAREA_MIN_HEIGHT: number;
  TEXTAREA_MAX_HEIGHT: number;
  isStreaming: boolean;
  handleSendMessage: (event: React.UIEvent, messageInput?: string) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  chatStarted: boolean;
  exportChat?: () => void;
  qrModalOpen: boolean;
  setQrModalOpen: (open: boolean) => void;
  handleFileUpload: () => void;
  setProvider?: ((provider: ProviderInfo) => void) | undefined;
  model?: string | undefined;
  setModel?: ((model: string) => void) | undefined;
  setUploadedFiles?: ((files: File[]) => void) | undefined;
  setImageDataList?: ((dataList: string[]) => void) | undefined;
  handleInputChange?: ((event: React.ChangeEvent<HTMLTextAreaElement>) => void) | undefined;
  handleStop?: (() => void) | undefined;
  enhancingPrompt?: boolean | undefined;
  enhancePrompt?: (() => void) | undefined;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
  selectedElement?: ElementInfo | null;
  setSelectedElement?: ((element: ElementInfo | null) => void) | undefined;
}

export const ChatBox: React.FC<ChatBoxProps> = (props) => {
  return (
    <div
      className={classNames(
        'relative bg-zinc-800/70 p-4 rounded-xl shadow-inner flex flex-col gap-4 border border-zinc-700 w-full max-w-md mx-auto z-prompt backdrop-blur-sm',
        'sm:p-2 sm:gap-2 sm:rounded-lg sm:max-w-full',
      )}
    >
      <svg className={classNames(styles.PromptEffectContainer)}>
        <defs>
          <linearGradient
            id="line-gradient"
            x1="20%"
            y1="0%"
            x2="-14%"
            y2="10%"
            gradientUnits="userSpaceOnUse"
            gradientTransform="rotate(-45)"
          >
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0%"></stop>
            <stop offset="40%" stopColor="#a855f7" stopOpacity="80%"></stop>
            <stop offset="50%" stopColor="#a855f7" stopOpacity="80%"></stop>
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0%"></stop>
          </linearGradient>
          <linearGradient id="shine-gradient">
            <stop offset="0%" stopColor="white" stopOpacity="0%"></stop>
            <stop offset="40%" stopColor="#ffffff" stopOpacity="80%"></stop>
            <stop offset="50%" stopColor="#ffffff" stopOpacity="80%"></stop>
            <stop offset="100%" stopColor="white" stopOpacity="0%"></stop>
          </linearGradient>
        </defs>
        <rect className={classNames(styles.PromptEffectLine)} pathLength="100" strokeLinecap="round"></rect>
        <rect className={classNames(styles.PromptShine)} x="48" y="24" width="70" height="1"></rect>
      </svg>
      <div>
        <ClientOnly>
          {() => (
            <div className={props.isModelSettingsCollapsed ? 'hidden' : ''}>
              <ModelSelector
                key={props.provider?.name + ':' + props.modelList.length}
                model={props.model}
                setModel={props.setModel}
                modelList={props.modelList}
                provider={props.provider}
                setProvider={props.setProvider}
                providerList={props.providerList || (PROVIDER_LIST as ProviderInfo[])}
                apiKeys={props.apiKeys}
                modelLoading={props.isModelLoading}
              />
              {(props.providerList || []).length > 0 &&
                props.provider &&
                (!LOCAL_PROVIDERS.includes(props.provider.name) || 'OpenAILike') && (
                  <APIKeyManager
                    provider={props.provider}
                    apiKey={props.apiKeys[props.provider.name] || ''}
                    setApiKey={(key) => {
                      props.onApiKeysChange(props.provider.name, key);
                    }}
                  />
                )}
            </div>
          )}
        </ClientOnly>
      </div>
      <FilePreview
        files={props.uploadedFiles}
        imageDataList={props.imageDataList}
        onRemove={(index) => {
          props.setUploadedFiles?.(props.uploadedFiles.filter((_, i) => i !== index));
          props.setImageDataList?.(props.imageDataList.filter((_, i) => i !== index));
        }}
      />
      <ClientOnly>
        {() => (
          <ScreenshotStateManager
            setUploadedFiles={props.setUploadedFiles}
            setImageDataList={props.setImageDataList}
            uploadedFiles={props.uploadedFiles}
            imageDataList={props.imageDataList}
          />
        )}
      </ClientOnly>
      {props.selectedElement && (
        <div className="flex mx-1.5 gap-2 items-center justify-between rounded-lg rounded-b-none border border-b-none border-zinc-600 text-white flex py-1 px-2.5 font-medium text-xs bg-zinc-800">
          <div className="flex gap-2 items-center lowercase">
            <code className="bg-purple-500 rounded px-1.5 py-1 mr-0.5 text-white text-xs">
              {props?.selectedElement?.tagName}
            </code>
            selected for inspection
          </div>
          <button
            className="bg-transparent text-purple-400 hover:text-purple-300 transition-colors"
            onClick={() => props.setSelectedElement?.(null)}
          >
            Clear
          </button>
        </div>
      )}
      <div className={classNames('fixed sm:static bottom-0 left-0 w-full sm:relative shadow-md border border-zinc-600 backdrop-blur rounded-lg bg-zinc-800 flex items-center gap-2 mt-4 z-50 sm:z-auto', 'sm:rounded-lg sm:mt-2')}>
        <textarea
          ref={props.textareaRef}
          className={classNames(
            'w-full pl-3 pt-3 pr-14 outline-none resize-none text-white placeholder-zinc-400 bg-transparent text-sm',
            'transition-all duration-200',
            'focus:ring-2 focus:ring-purple-500/50',
            'min-h-[40px] max-h-[120px] sm:min-h-[32px] sm:max-h-[80px]',
            'rounded-lg',
          )}
          onDragEnter={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '2px solid #a855f7';
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '2px solid #a855f7';
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '1px solid #52525b';
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '1px solid #52525b';

            const files = Array.from(e.dataTransfer.files);
            files.forEach((file) => {
              if (file.type.startsWith('image/')) {
                const reader = new FileReader();

                reader.onload = (e) => {
                  const base64Image = e.target?.result as string;
                  props.setUploadedFiles?.([...props.uploadedFiles, file]);
                  props.setImageDataList?.([...props.imageDataList, base64Image]);
                };
                reader.readAsDataURL(file);
              }
            });
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              if (event.shiftKey) {
                return;
              }

              event.preventDefault();

              if (props.isStreaming) {
                props.handleStop?.();
                return;
              }

              // ignore if using input method engine
              if (event.nativeEvent.isComposing) {
                return;
              }

              props.handleSendMessage?.(event);
            }
          }}
          value={props.input}
          onChange={(event) => {
            props.handleInputChange?.(event);
          }}
          onPaste={props.handlePaste}
          style={{
            minHeight: props.TEXTAREA_MIN_HEIGHT,
            maxHeight: props.TEXTAREA_MAX_HEIGHT,
          }}
          placeholder={props.chatMode === 'build' ? 'How can Bolt help you today?' : 'What would you like to discuss?'}
          translate="no"
        />
        <button
          className="bg-green-500 hover:bg-green-600 rounded-lg w-12 h-12 sm:w-10 sm:h-10 flex items-center justify-center text-lg ml-2"
          onClick={() => {
            if (props.isStreaming) {
              props.handleStop?.();
              return;
            }

            if (props.input.length > 0 || props.uploadedFiles.length > 0) {
              // تمرير حدث وهمي من نوع UIEvent لتفادي خطأ النوع
              const fakeEvent = { currentTarget: null } as unknown as React.UIEvent<Element, UIEvent>;
              props.handleSendMessage?.(fakeEvent);
            }
          }}
        >
          إرسال
        </button>
        <div className="flex justify-between items-center text-sm p-2 pt-1 sm:p-4 sm:pt-2">
          <div className="flex gap-1 items-center overflow-x-auto flex-nowrap sm:overflow-visible">
            <ColorSchemeDialog designScheme={props.designScheme} setDesignScheme={props.setDesignScheme} className="hidden sm:block" />
            <IconButton
              className="transition-all text-zinc-300 hover:text-white hover:bg-zinc-600 rounded-lg p-2 text-base sm:text-xl"
              onClick={() => props.handleFileUpload()}
              icon="i-ph:paperclip"
            />
            <IconButton
              disabled={props.input.length === 0 || props.enhancingPrompt}
              className={classNames(
                'transition-all text-zinc-300 hover:text-white hover:bg-zinc-600 rounded-lg p-2 text-base sm:text-xl',
                props.enhancingPrompt ? 'opacity-100' : 'disabled:opacity-50',
              )}
              onClick={() => {
                props.enhancePrompt?.();
                toast.success('Prompt enhanced!');
              }}
              icon={props.enhancingPrompt ? 'i-svg-spinners:90-ring-with-bg text-purple-400 animate-spin' : 'i-bolt:stars'}
            />

            <SpeechRecognitionButton
              isListening={props.isListening}
              onStart={props.startListening}
              onStop={props.stopListening}
              disabled={props.isStreaming}
              className="text-base sm:text-xl"
            />
            {props.chatStarted && (
              <IconButton
                className={classNames(
                  'transition-all flex items-center gap-1 px-1.5 rounded-lg p-2 text-base sm:text-xl',
                  props.chatMode === 'discuss'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white',
                )}
                onClick={() => {
                  props.setChatMode?.(props.chatMode === 'discuss' ? 'build' : 'discuss');
                }}
                icon="i-ph:chats"
              />
            )}
            <IconButton
              className={classNames('transition-all flex items-center gap-1 rounded-lg p-2 text-base sm:text-xl', {
                'bg-purple-500/20 text-purple-300 border border-purple-500/50': props.isModelSettingsCollapsed,
                'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white': !props.isModelSettingsCollapsed,
              })}
              onClick={() => props.setIsModelSettingsCollapsed(!props.isModelSettingsCollapsed)}
              disabled={!props.providerList || props.providerList.length === 0}
              icon={`i-ph:caret-${props.isModelSettingsCollapsed ? 'right' : 'down'}`}
            />
          </div>
          {props.input.length > 3 ? (
            <div className="text-xs text-zinc-400">
              Use{' '}
              <kbd className="kdb px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300 border border-zinc-600">Shift</kbd> +{' '}
              <kbd className="kdb px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300 border border-zinc-600">Return</kbd>{' '}
              for a new line
            </div>
          ) : null}
          <SupabaseConnection />
          <ExpoQrModal open={props.qrModalOpen} onClose={() => props.setQrModalOpen(false)} />
        </div>
      </div>
    </div>
  );
};
