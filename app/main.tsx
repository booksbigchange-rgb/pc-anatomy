import React from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import Home from './page';
import { I18nProvider } from '@/lib/i18n/provider';
import './globals.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <Home />
      <Analytics />
    </I18nProvider>
  </React.StrictMode>,
);
