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
        'relative bg-zinc-800/80 p-4 sm:p-6 rounded-2xl shadow-2xl flex flex-col gap-4 border border-zinc-700/50 w-full max-w-2xl mx-auto z-prompt backdrop-blur-md',
        'yousefsh-card-hover',
        'sm:rounded-xl sm:gap-3',
      )}
    >
      {/* YOUSEF SH Gradient Border Effect */}
      <div className="absolute inset-0 rounded-2xl sm:rounded-xl bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-orange-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Model Settings Section */}
      <div>
        <ClientOnly>
          {() => (
            <div className={classNames(
              'transition-all duration-300 ease-in-out overflow-hidden',
              props.isModelSettingsCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
            )}>
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

      {/* File Preview Section */}
      <FilePreview
        files={props.uploadedFiles}
        imageDataList={props.imageDataList}
        onRemove={(index) => {
          props.setUploadedFiles?.(props.uploadedFiles.filter((_, i) => i !== index));
          props.setImageDataList?.(props.imageDataList.filter((_, i) => i !== index));
        }}
      />

      {/* Screenshot State Manager */}
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

      {/* Selected Element Indicator */}
      {props.selectedElement && (
        <div className="flex mx-1.5 gap-2 items-center justify-between rounded-lg rounded-b-none border border-b-none border-emerald-500/50 text-white py-2 px-3 font-medium text-xs bg-emerald-500/10 backdrop-blur-sm">
          <div className="flex gap-2 items-center">
            <code className="bg-emerald-600 rounded px-2 py-1 text-white text-xs font-mono">
              {props?.selectedElement?.tagName}
            </code>
            <span className="font-arabic">عنصر محدد للفحص</span>
          </div>
          <button
            className="bg-transparent text-emerald-400 hover:text-emerald-300 transition-colors font-arabic"
            onClick={() => props.setSelectedElement?.(null)}
          >
            مسح
          </button>
        </div>
      )}

      {/* Input Section */}
      <div className={classNames(
        'relative shadow-lg border border-zinc-600/50 backdrop-blur-md rounded-xl bg-zinc-800/90 flex items-center gap-3 p-3',
        'sm:rounded-lg sm:gap-2 sm:p-2',
        'transition-all duration-200 hover:border-zinc-500/50 hover:shadow-xl'
      )}>
        <textarea
          ref={props.textareaRef}
          className={classNames(
            'w-full pl-3 pt-3 pr-16 outline-none resize-none text-white placeholder-zinc-400 bg-transparent text-sm font-arabic',
            'transition-all duration-200',
            'focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50',
            'min-h-[44px] max-h-[120px] sm:min-h-[40px] sm:max-h-[100px]',
            'rounded-lg',
          )}
          onDragEnter={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '2px solid #10b981';
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '2px solid #10b981';
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
          placeholder={props.chatMode === 'build' ? 'كيف يمكن لـ YOUSEF SH مساعدتك اليوم؟' : 'ماذا تريد أن تناقش؟'}
          translate="no"
        />
        
        {/* Send Button */}
        <button
          className={classNames(
            'bg-emerald-600 hover:bg-emerald-700 rounded-lg w-12 h-12 sm:w-10 sm:h-10 flex items-center justify-center text-lg transition-all duration-200',
            'shadow-lg hover:shadow-xl',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-800',
            props.isStreaming ? 'bg-red-600 hover:bg-red-700' : ''
          )}
          onClick={() => {
            if (props.isStreaming) {
              props.handleStop?.();
              return;
            }

            if (props.input.length > 0 || props.uploadedFiles.length > 0) {
              const fakeEvent = { currentTarget: null } as unknown as React.UIEvent<Element, UIEvent>;
              props.handleSendMessage?.(fakeEvent);
            }
          }}
          title={props.isStreaming ? 'إيقاف' : 'إرسال'}
        >
          {props.isStreaming ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="font-arabic">إرسال</span>
          )}
        </button>
      </div>

      {/* Toolbar Section */}
      <div className="flex justify-between items-center text-sm p-2 pt-1 sm:p-4 sm:pt-2">
        <div className="flex gap-1 items-center overflow-x-auto flex-nowrap sm:overflow-visible scrollbar-hide">
          <ColorSchemeDialog designScheme={props.designScheme} setDesignScheme={props.setDesignScheme} className="hidden sm:block" />
          
          <button
            className="transition-all text-zinc-300 hover:text-white hover:bg-zinc-600 rounded-lg p-2 text-base sm:text-xl"
            onClick={() => props.handleFileUpload()}
            title="إرفاق ملف"
          >
            <div className="i-ph:paperclip" />
          </button>
          
          <button
            disabled={props.input.length === 0 || props.enhancingPrompt}
            className={classNames(
              'transition-all text-zinc-300 hover:text-white hover:bg-zinc-600 rounded-lg p-2 text-base sm:text-xl',
              props.enhancingPrompt ? 'opacity-100' : 'disabled:opacity-50',
            )}
            onClick={() => {
              props.enhancePrompt?.();
              toast.success('تم تحسين النص!', { position: 'top-right' });
            }}
            title="تحسين النص"
          >
            <div className={props.enhancingPrompt ? 'i-svg-spinners:90-ring-with-bg text-emerald-400 animate-spin' : 'i-bolt:stars'} />
          </button>

          <SpeechRecognitionButton
            isListening={props.isListening}
            onStart={props.startListening}
            onStop={props.stopListening}
            disabled={props.isStreaming}
            className="text-base sm:text-xl"
          />
          
          {props.chatStarted && (
            <button
              className={classNames(
                'transition-all flex items-center gap-1 px-1.5 rounded-lg p-2 text-base sm:text-xl',
                props.chatMode === 'discuss'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white',
              )}
              onClick={() => {
                props.setChatMode?.(props.chatMode === 'discuss' ? 'build' : 'discuss');
              }}
              title={props.chatMode === 'discuss' ? 'التبديل إلى وضع البناء' : 'التبديل إلى وضع النقاش'}
            >
              <div className="i-ph:chats" />
            </button>
          )}
          
          <button
            className={classNames('transition-all flex items-center gap-1 rounded-lg p-2 text-base sm:text-xl', {
              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50': props.isModelSettingsCollapsed,
              'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white': !props.isModelSettingsCollapsed,
            })}
            onClick={() => props.setIsModelSettingsCollapsed(!props.isModelSettingsCollapsed)}
            disabled={!props.providerList || props.providerList.length === 0}
            title={props.isModelSettingsCollapsed ? 'إظهار الإعدادات' : 'إخفاء الإعدادات'}
          >
            <div className={`i-ph:caret-${props.isModelSettingsCollapsed ? 'right' : 'down'}`} />
          </button>
        </div>
        
        {/* Keyboard Shortcuts Help */}
        {props.input.length > 3 ? (
          <div className="text-xs text-zinc-400 font-arabic hidden sm:block">
            استخدم{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300 border border-zinc-600">Shift</kbd> +{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300 border border-zinc-600">Return</kbd>{' '}
            لسطر جديد
          </div>
        ) : null}
        
        <SupabaseConnection />
        <ExpoQrModal open={props.qrModalOpen} onClose={() => props.setQrModalOpen(false)} />
      </div>
    </div>
  );
};
