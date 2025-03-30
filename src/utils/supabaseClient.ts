
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
// Use environment variables when available, otherwise use default values that will work
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Log a warning if we're using the default values in production
if (
  (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) && 
  import.meta.env.MODE === 'production'
) {
  console.warn('Using default Supabase credentials. For production use, please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

// Create a Supabase client with default offline capabilities
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Add a helper to check if we're connected to a real Supabase instance
export const isUsingRealSupabase = (): boolean => {
  return (
    import.meta.env.VITE_SUPABASE_URL !== undefined && 
    import.meta.env.VITE_SUPABASE_URL !== '' &&
    import.meta.env.VITE_SUPABASE_URL !== 'https://xyzcompany.supabase.co'
  );
};
