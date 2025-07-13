import { useStore } from '@nanostores/react';
import type { LinksFunction } from '@remix-run/cloudflare';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';
import tailwindReset from '@unocss/reset/tailwind-compat.css?url';
import { themeStore } from './lib/stores/theme';
import { stripIndents } from './utils/stripIndent';
import { createHead } from 'remix-island';
import { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ClientOnly } from 'remix-utils/client-only';

import reactToastifyStyles from 'react-toastify/dist/ReactToastify.css?url';
import globalStyles from './styles/index.scss?url';
import xtermStyles from '@xterm/xterm/css/xterm.css?url';

import 'virtual:uno.css';

export const links: LinksFunction = () => [
  {
    rel: 'icon',
    href: '/yousefsh-logo.png',
    type: 'image/png',
  },
  { rel: 'stylesheet', href: reactToastifyStyles },
  { rel: 'stylesheet', href: tailwindReset },
  { rel: 'stylesheet', href: globalStyles },
  { rel: 'stylesheet', href: xtermStyles },
  {
    rel: 'preconnect',
    href: 'https://fonts.googleapis.com',
  },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Cairo:wght@300;400;500;600;700;800;900&display=swap',
  },
];

const inlineThemeCode = stripIndents`
  setYousefSHTheme();

  function setYousefSHTheme() {
    // Force dark theme for unified YOUSEF SH design
    const html = document.querySelector('html');
    const body = document.body;
    
    if (html) {
      html.setAttribute('data-theme', 'dark');
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    }
    
    if (body) {
      body.classList.add('dark');
    }
    
    // Set custom CSS variables for YOUSEF SH branding
    document.documentElement.style.setProperty('--app-brand-color', '#10b981');
    document.documentElement.style.setProperty('--app-accent-color', '#8b5cf6');
    document.documentElement.style.setProperty('--app-gradient-start', '#1f1b2e');
    document.documentElement.style.setProperty('--app-gradient-end', '#151321');
  }
`;

export const Head = createHead(() => (
  <>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#1f1b2e" />
    <meta name="description" content="YOUSEF SH - تطبيق ذكي للدردشة والبرمجة" />
    <meta name="application-name" content="YOUSEF SH" />
    <meta name="apple-mobile-web-app-title" content="YOUSEF SH" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <Meta />
    <Links />
    <script dangerouslySetInnerHTML={{ __html: inlineThemeCode }} />
  </>
));

export function Layout({ children }: { children: React.ReactNode }) {
  const _theme = useStore(themeStore);

  useEffect(() => {
    // Force dark theme for unified YOUSEF SH design
    const html = document.querySelector('html');
    const body = document.body;
    
    if (html) {
      html.setAttribute('data-theme', 'dark');
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    }
    
    if (body) {
      body.classList.add('dark');
    }
  }, [_theme]);

  return (
    <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white min-h-screen font-sans antialiased">
      <ClientOnly>
        {() => (
          <DndProvider backend={HTML5Backend}>
            {children}
          </DndProvider>
        )}
      </ClientOnly>
      <ScrollRestoration />
      <Scripts />
    </div>
  );
}

import { logStore } from './lib/stores/logs';

export default function App() {
  const _theme = useStore(themeStore);

  useEffect(() => {
    logStore.logSystem('YOUSEF SH Application initialized', {
      theme: 'dark',
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      appVersion: '1.0.0',
    });
  }, []);

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
