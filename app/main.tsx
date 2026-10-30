import React from 'react';
import { createRoot } from 'react-dom/client';
import Home from './page';
import './globals.css';
import '@fontsource/noto-sans-ethiopic/400.css';
import '@fontsource/noto-sans-ethiopic/700.css';
import './habesha.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>,
);
