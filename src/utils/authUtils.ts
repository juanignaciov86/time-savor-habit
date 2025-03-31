
import { supabaseClient } from './supabaseClient';

// Import storage key to ensure consistency
const STORAGE_KEY = 'time-savor-habits';

// Check if user is logged in
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    // First check if we have an auth state in localStorage
    const authState = localStorage.getItem('auth-state');
    if (authState) {
      const { timestamp } = JSON.parse(authState);
      // Consider auth valid if we have a timestamp from the last 30 days
      const isRecent = Date.now() - timestamp < 30 * 24 * 60 * 60 * 1000;
      if (isRecent) {
        console.log('Found valid auth state in localStorage');
        return true;
      }
    }

    // Then check if we have cached habits as a fallback
    const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (habits.length > 0) {
      console.log('Found cached habits, assuming authenticated');
      return true;
    }

    // Only try Supabase if we're online
    if (navigator.onLine) {
      if (!supabaseClient) {
        console.log('No Supabase client available');
        return false;
      }

      const { data: { user }, error } = await supabaseClient.auth.getUser();
      if (error) {
        // If we get a network error, check local data
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
          console.log('Network error while checking auth, using local data');
          return habits.length > 0;
        }
        // Handle missing session error gracefully
        if (error.message?.includes('Auth session missing')) {
          console.log('No auth session found');
        } else {
          console.error('Error checking authentication:', error);
        }
        return false;
      }

      // If we got a valid user, update the auth state
      if (user) {
        localStorage.setItem('auth-state', JSON.stringify({
          timestamp: Date.now(),
          userId: user.id
        }));
        return true;
      }
    } else {
      console.log('Offline mode: using cached auth state');
      return habits.length > 0;
    }

    return false;
  } catch (error) {
    console.error('Error checking authentication:', error);
    // If we have a network error, use local data
    if (error instanceof Error && 
        (error.message.includes('network') || error.message.includes('fetch'))) {
      const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return habits.length > 0;
    }
    return false;
  }
};

// Login function
export const login = async (email: string, password: string): Promise<boolean> => {
  try {
    // Clear any existing data before login
    localStorage.removeItem(STORAGE_KEY);
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error.message);
      return false;
    }

    // Store the auth state in localStorage
    if (data.user) {
      localStorage.setItem('auth-state', JSON.stringify({
        timestamp: Date.now(),
        userId: data.user.id
      }));
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
    // Clear all local data
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('auth-state');
    
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      // If we get a network error, just clear local storage
      if (error.message?.includes('network')) {
        console.log('Network error during logout, cleared local storage');
        return;
      }
      console.error('Logout error:', error.message);
    }
  } catch (error) {
    console.error('Logout error:', error);
    // If we have a network error, just clear local storage
    if (error instanceof Error && error.message.includes('network')) {
      console.log('Network error during logout, cleared local storage');
    }
  }
};
