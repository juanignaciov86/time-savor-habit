
import { supabaseClient } from './supabaseClient';

// Check if user is logged in
export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return !!user;
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
