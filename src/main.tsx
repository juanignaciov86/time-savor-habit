
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeSupabaseSync } from './utils/habitUtils';
import { supabaseClient } from './utils/supabaseClient';

// Check if Supabase client initialized correctly
if (!supabaseClient) {
  console.log('No Supabase client available. The app will use localStorage for data storage.');
} else {
  console.log('Supabase client initialized successfully.');
}

// Initialize Supabase connection and sync data only if client exists
// Using a try-catch to prevent app from crashing if Supabase initialization fails
if (supabaseClient) {
  try {
    initializeSupabaseSync().catch(error => {
      console.error('Failed to initialize Supabase:', error);
    });
  } catch (error) {
    console.error('Error during Supabase initialization:', error);
  }
} else {
  console.log('Skipping Supabase initialization due to missing client.');
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
