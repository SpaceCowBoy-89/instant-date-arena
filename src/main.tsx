import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Capacitor } from '@capacitor/core';

// Apply platform-specific body classes for mobile optimization
if (Capacitor.isNativePlatform()) {
  document.body.classList.add('capacitor-native');
  document.body.classList.add(`capacitor-${Capacitor.getPlatform()}`);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
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