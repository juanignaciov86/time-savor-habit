
import { supabaseClient } from './supabaseClient';

// Check if user is logged in
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    if (!supabaseClient) {
      console.log('No Supabase client available, assuming not authenticated');
      return false;
    }

    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) {
      // Handle missing session error gracefully
      if (error.message?.includes('Auth session missing')) {
        console.log('No auth session found (user not logged in)');
      } else {
        console.error('Error checking authentication:', error);
      }
      return false;
    }

    return !!user;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Login function
export const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error.message);
      return false;
    }

    return !!data.user;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
};

// Logout function
export const logout = async (): Promise<void> => {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
};
