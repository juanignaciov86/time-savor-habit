
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { supabaseClient } from './utils/supabaseClient';

// Log and check Supabase client initialization status
if (supabaseClient === null) {
  console.log('Supabase client could not be initialized. The app will use localStorage for data storage.');
} else {
  console.log('Supabase client initialized successfully.');
  
  // Import and initialize sync function only if client exists
  import('./utils/habitUtils').then(({ initializeSupabaseSync }) => {
    initializeSupabaseSync().catch(error => {
      console.error('Failed to initialize Supabase sync:', error);
    });
  }).catch(error => {
    console.error('Error importing habitUtils:', error);
  });
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
