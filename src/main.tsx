
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { supabaseClient } from './utils/supabaseClient';

console.log('Starting application...');

// Initialize Supabase and sync data before rendering
const initializeApp = async () => {
  try {
    if (!supabaseClient) {
      throw new Error('Supabase client could not be initialized');
    }

    console.log('Supabase client initialized successfully');
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError) throw authError;

    if (user) {
      console.log('User is authenticated:', user.id);
      // Import and run sync
      const { initializeSupabaseSync } = await import('./utils/habitUtils');
      await initializeSupabaseSync();
      console.log('Supabase sync completed');
    } else {
      console.log('No authenticated user');
    }
  } catch (error) {
    console.error('Error during initialization:', error);
  }

  // Render the app regardless of initialization result
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Failed to find the root element');

  console.log('Rendering React app...');
  createRoot(rootElement).render(<App />);
};

// Start initialization
initializeApp();

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
