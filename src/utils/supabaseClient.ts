
import { createClient } from '@supabase/supabase-js';

// Get values from environment variables
const supabaseUrlEnv = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKeyEnv = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log the environment variable values for debugging
console.log('=== Supabase Configuration ===');

// Validate URL format
if (!supabaseUrlEnv) {
  throw new Error('VITE_SUPABASE_URL is not defined in environment variables');
} else if (!supabaseUrlEnv.startsWith('https://')) {
  throw new Error('VITE_SUPABASE_URL must start with https://');
}
console.log('Supabase URL:', supabaseUrlEnv);

// Validate Anon Key
if (!supabaseAnonKeyEnv) {
  throw new Error('VITE_SUPABASE_ANON_KEY is not defined in environment variables');
} else if (!supabaseAnonKeyEnv.startsWith('eyJ')) {
  throw new Error('VITE_SUPABASE_ANON_KEY appears to be invalid (should start with eyJ)');
}
console.log('Supabase Anon Key:', 'Present (hidden)');

// Create the Supabase client
let supabaseClientInstance;
try {
  supabaseClientInstance = createClient(supabaseUrlEnv, supabaseAnonKeyEnv, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  });
  
  console.log('Supabase client created successfully');
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  throw new Error(`Failed to initialize Supabase client: ${error.message}`);
}

// Export the client instance
export const supabaseClient = supabaseClientInstance;

// Helper to check if we're connected to Supabase
export const isUsingRealSupabase = async () => {
  if (!supabaseClient || !supabaseUrlEnv || !supabaseAnonKeyEnv) {
    console.log('No Supabase configuration available');
    return false;
  }

  try {
    // Test the connection by getting the current user
    const { error } = await supabaseClient.auth.getSession();
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
};
