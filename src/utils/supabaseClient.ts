
import { createClient } from '@supabase/supabase-js';

// Default placeholder values for development/demo
const DEFAULT_SUPABASE_URL = 'https://xyzcompany.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Get values from environment variables with fallbacks to empty strings
const supabaseUrlEnv = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKeyEnv = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Determine if we're using real credentials or fallback to defaults
const useDefaultCredentials = !supabaseUrlEnv || !supabaseAnonKeyEnv;

// Set final values - only use defaults if environment variables are not available
const supabaseUrl = useDefaultCredentials ? DEFAULT_SUPABASE_URL : supabaseUrlEnv;
const supabaseAnonKey = useDefaultCredentials ? DEFAULT_SUPABASE_KEY : supabaseAnonKeyEnv;

// Log a warning if we're using the default values in production
if (useDefaultCredentials && import.meta.env.MODE === 'production') {
  console.warn('Using default Supabase credentials in production. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

// Create a singleton for the Supabase client
let supabaseClientInstance = null;

try {
  // Double check we have valid string values before creating the client
  if (typeof supabaseUrl === 'string' && 
      supabaseUrl.trim() !== '' && 
      typeof supabaseAnonKey === 'string' && 
      supabaseAnonKey.trim() !== '') {
    
    console.log('Creating Supabase client with URL:', supabaseUrl.substring(0, 15) + '...');
    
    supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    console.log('Supabase client created successfully');
  } else {
    console.error('Invalid Supabase URL or Anon Key, cannot create client');
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  supabaseClientInstance = null;
}

// Export the client instance (might be null if initialization failed)
export const supabaseClient = supabaseClientInstance;

// Add a helper to check if we're connected to a real Supabase instance
export const isUsingRealSupabase = () => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl !== '' &&
    supabaseUrl !== DEFAULT_SUPABASE_URL &&
    supabaseClient !== null
  );
};
