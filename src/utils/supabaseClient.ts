
import { createClient } from '@supabase/supabase-js';

// Default placeholder values for development/demo - only used if env vars are missing
const DEFAULT_SUPABASE_URL = 'https://xyzcompany.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Get values from environment variables
const supabaseUrlEnv = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKeyEnv = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log the environment variable values for debugging
console.log('Supabase URL from env:', supabaseUrlEnv ? 'Found' : 'Not found');
console.log('Supabase Anon Key from env:', supabaseAnonKeyEnv ? 'Found' : 'Not found');

// Set final values - using real or fallback values
const supabaseUrl = supabaseUrlEnv || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = supabaseAnonKeyEnv || DEFAULT_SUPABASE_KEY;

// Create a singleton for the Supabase client
let supabaseClientInstance = null;

try {
  console.log('Creating Supabase client with URL:', supabaseUrl ? (supabaseUrl.substring(0, 15) + '...') : 'undefined');
  
  if (supabaseUrl && supabaseAnonKey) {
    supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    console.log('Supabase client created successfully');
  } else {
    console.error('Supabase URL or Anon Key not found in environment variables');
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
    supabaseClient !== null &&
    supabaseUrlEnv !== undefined &&
    supabaseAnonKeyEnv !== undefined
  );
};
