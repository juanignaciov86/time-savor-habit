
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeSupabaseSync } from './utils/habitUtils';

// Initialize Supabase connection and sync data
// Using a try-catch to prevent app from crashing if Supabase initialization fails
try {
  initializeSupabaseSync().catch(error => {
    console.error('Failed to initialize Supabase:', error);
  });
} catch (error) {
  console.error('Error during Supabase initialization:', error);
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(<App />);

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}
