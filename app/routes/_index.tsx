import React from 'react';
import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';

export const meta: MetaFunction = () => {
  return [
    { title: 'YOUSEF SH - تطبيق ذكي للدردشة والبرمجة' },
    { name: 'description', content: 'YOUSEF SH - تطبيق ذكي للدردشة والبرمجة مع دعم كامل للغة العربية' },
    { name: 'keywords', content: 'YOUSEF SH, AI, chatbot, programming, Arabic, ذكي, برمجة, عربي' },
    { name: 'author', content: 'YOUSEF SH' },
    { property: 'og:title', content: 'YOUSEF SH - تطبيق ذكي للدردشة والبرمجة' },
    { property: 'og:description', content: 'تطبيق ذكي للدردشة والبرمجة مع دعم كامل للغة العربية' },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: '/yousefsh-logo.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'YOUSEF SH - تطبيق ذكي للدردشة والبرمجة' },
    { name: 'twitter:description', content: 'تطبيق ذكي للدردشة والبرمجة مع دعم كامل للغة العربية' },
    { name: 'twitter:image', content: '/yousefsh-logo.png' },
  ];
};

export const loader = () => json({});

/**
 * الصفحة الرئيسية لتطبيق YOUSEF SH
 * تطبيق ذكي للدردشة والبرمجة مع دعم كامل للغة العربية
 * 
 * Features:
 * - واجهة داكنة حديثة
 * - دعم كامل للغة العربية
 * - تصميم متجاوب للجوال
 * - أدوات برمجة متقدمة
 * - إدارة النماذج والمفاتيح
 */
export default function Index() {
  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 relative overflow-hidden">
      {/* Background Effects */}
      <BackgroundRays />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-purple-500/5 to-orange-500/5 pointer-events-none" />
      
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="flex-1 relative z-10">
        <ClientOnly 
          fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <div className="w-8 h-8 bg-white rounded-lg" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-white font-arabic">YOUSEF SH</h1>
                  <p className="text-zinc-400 font-arabic">جاري التحميل...</p>
                </div>
              </div>
            </div>
          }
        >
          {() => <Chat />}
        </ClientOnly>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 py-4 px-6 border-t border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="font-arabic">YOUSEF SH</span>
            <span>•</span>
            <span className="font-arabic">تطبيق ذكي للدردشة والبرمجة</span>
          </div>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <span className="font-arabic">الإصدار 1.0.0</span>
            <span>•</span>
            <span className="font-arabic">دعم كامل للعربية</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
