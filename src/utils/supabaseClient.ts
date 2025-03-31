
import { createClient } from '@supabase/supabase-js';

// Get values from environment variables
const supabaseUrlEnv = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKeyEnv = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log the environment variable values for debugging
console.log('=== Supabase Configuration ===');
console.log('Supabase URL:', supabaseUrlEnv || 'Not found');
console.log('Supabase Anon Key:', supabaseAnonKeyEnv ? 'Present (hidden)' : 'Not found');

// Create a singleton for the Supabase client
let supabaseClientInstance = null;

try {
  if (!supabaseUrlEnv || !supabaseAnonKeyEnv) {
    throw new Error('Missing required Supabase configuration');
  }

  supabaseClientInstance = createClient(supabaseUrlEnv, supabaseAnonKeyEnv, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage, // Explicitly use localStorage for session
    },
  });

  console.log('Supabase client created successfully');
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  supabaseClientInstance = null;
}

// Export the client instance
export const supabaseClient = supabaseClientInstance;

// Helper to check if we're connected to Supabase
export const isUsingRealSupabase = () => {
  if (!supabaseClient) {
    console.log('No Supabase client available');
    return false;
  }

  if (!supabaseUrlEnv || !supabaseAnonKeyEnv) {
    console.log('Missing Supabase configuration');
    return false;
  }

  return true;
};
