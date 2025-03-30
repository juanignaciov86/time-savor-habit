
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
// Use environment variables when available, otherwise use default values for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Only log an error if we're not using the default values
if (
  (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) && 
  import.meta.env.MODE === 'production'
) {
  console.error('Supabase URL or Anon Key not found in environment variables');
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
