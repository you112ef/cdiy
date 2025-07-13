import React from 'react';
import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames(
        'flex items-center px-4 sm:px-6 border-b h-[var(--header-height)] relative z-20',
        'bg-zinc-900/80 backdrop-blur-md border-zinc-800/50',
        'transition-all duration-300 ease-in-out',
        {
          'border-transparent': !chat.started,
          'border-zinc-700/50': chat.started,
        }
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center gap-3 z-10">
        <a 
          href="/" 
          className="flex items-center group transition-all duration-200 hover:scale-105"
          title="YOUSEF SH - الصفحة الرئيسية"
        >
          <div className="relative">
            <img 
              src="/yousefsh-logo.png" 
              alt="YOUSEF SH" 
              className="h-10 w-auto sm:h-12 transition-all duration-200 group-hover:drop-shadow-lg" 
            />
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-purple-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
          </div>
        </a>
        
        {/* App Name */}
        <div className="hidden sm:flex flex-col">
          <h1 className="text-lg font-bold text-white font-arabic leading-tight">
            YOUSEF SH
          </h1>
          <p className="text-xs text-zinc-400 font-arabic leading-tight">
            تطبيق ذكي للدردشة والبرمجة
          </p>
        </div>
      </div>

      {/* Chat Description - Only show when chat has started */}
      {chat.started && (
        <div className="flex-1 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <ClientOnly>
              {() => (
                <div className="text-center">
                  <ChatDescription />
                </div>
              )}
            </ClientOnly>
          </div>
        </div>
      )}

      {/* Action Buttons - Only show when chat has started */}
      {chat.started && (
        <ClientOnly>
          {() => (
            <div className="flex items-center gap-2">
              <HeaderActionButtons chatStarted={chat.started} />
            </div>
          )}
        </ClientOnly>
      )}

      {/* Welcome Message - Show when chat hasn't started */}
      {!chat.started && (
        <div className="flex-1 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-white font-arabic mb-1">
              مرحباً بك في YOUSEF SH
            </h2>
            <p className="text-sm text-zinc-400 font-arabic">
              ابدأ محادثة جديدة للتفاعل مع المساعد الذكي
            </p>
          </div>
        </div>
      )}

      {/* Decorative Elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent pointer-events-none" />
    </header>
  );
}
