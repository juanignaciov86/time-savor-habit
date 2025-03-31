
import { createClient } from '@supabase/supabase-js';

// Default placeholder values for development/demo - only used if env vars are missing
const DEFAULT_SUPABASE_URL = 'https://xyzcompany.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Get values from environment variables
const supabaseUrlEnv = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKeyEnv = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Log the environment variable values for debugging
console.log('Supabase URL from env:', supabaseUrlEnv ? 'Found' : 'Not found');
console.log('Supabase Anon Key from env:', supabaseAnonKeyEnv ? 'Found' : 'Not found');

// Determine if we're using real credentials or fallback to defaults
const useRealCredentials = Boolean(supabaseUrlEnv && supabaseUrlEnv.trim() !== '' && 
                                  supabaseAnonKeyEnv && supabaseAnonKeyEnv.trim() !== '');

// Set final values - only create client if we have real credentials
let supabaseClientInstance = null;

if (useRealCredentials) {
  try {
    console.log('Creating Supabase client with real credentials');
    
    supabaseClientInstance = createClient(supabaseUrlEnv, supabaseAnonKeyEnv, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    console.log('Supabase client created successfully');
  } catch (error) {
    console.error('Error initializing Supabase client with real credentials:', error);
    supabaseClientInstance = null;
  }
} else {
  console.warn('No valid Supabase credentials found in environment variables.');
  
  // For development purposes only, can create with default/dummy values
  // Uncomment the below code if you want to create a client with default values
  // try {
  //   console.log('Creating Supabase client with default credentials (for development only)');
  //   supabaseClientInstance = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);
  // } catch (error) {
  //   console.error('Error initializing Supabase client with default credentials:', error);
  //   supabaseClientInstance = null;
  // }
}

// Export the client instance (might be null if initialization failed)
export const supabaseClient = supabaseClientInstance;

// Add a helper to check if we're connected to a real Supabase instance
export const isUsingRealSupabase = () => {
  return (
    supabaseClient !== null &&
    useRealCredentials
  );
};
