// Polyfill for require (needed for some legacy dependencies)
if (typeof window !== 'undefined' && !window.require) {
  (window as any).require = (module: string) => {
    throw new Error(`Module "${module}" not available in browser environment`);
  };
}

import React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Capacitor } from '@capacitor/core';

// Apply platform-specific body classes for mobile optimization
if (Capacitor.isNativePlatform()) {
  document.body.classList.add('capacitor-native');
  document.body.classList.add(`capacitor-${Capacitor.getPlatform()}`);
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.MODE === 'production') {  // Register only in production
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(
      (registration) => console.log('Service worker registered:', registration),
      (error) => console.error('Service worker registration failed:', error)
    );
  });
}