// Habit management utilities
import { supabaseClient, isUsingRealSupabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface Habit {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: number;
  userId: string; // User ID from Supabase Auth
}

const STORAGE_KEY = 'time-savor-habits'; // Kept for fallback

// Get all habits - sync wrapper for components that can't handle async
export const getHabitsSync = (): Habit[] => {
  try {
    // Return from localStorage as fallback
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get habits from localStorage:', error);
    return [];
  }
};

// Get all habits - async version for database operations
export const getHabits = async (): Promise<Habit[]> => {
  try {
    // Debug logs
    const usingRealSupabase = isUsingRealSupabase();
    console.log('=== Habit Storage Debug ===');
    console.log('isUsingRealSupabase:', usingRealSupabase);
    console.log('supabaseClient exists:', !!supabaseClient);
    console.log('supabaseClient:', supabaseClient);
    
    // Check if we're using a real Supabase instance
    if (!usingRealSupabase || !supabaseClient) {
      console.log('Using localStorage fallback for habits because:', {
        usingRealSupabase,
        hasSupabaseClient: !!supabaseClient
      });
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    console.log('Auth state:', { user, userError });
    const userId = user?.id;
    
    if (!userId) {
      console.log('No authenticated user found, falling back to localStorage');
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    }
    
    console.log('Found authenticated user:', userId);

    console.log('Fetching habits from Supabase for user:', userId);
    const { data, error } = await supabaseClient
      .from('habits')
      .select('*')
      .eq('userId', userId);

    if (error) {
      console.error('Error fetching habits from Supabase:', error);
      console.log('Falling back to localStorage due to Supabase error');
      const localData = localStorage.getItem(STORAGE_KEY);
      return localData ? JSON.parse(localData) : [];
    }
    
    console.log('Successfully fetched habits from Supabase:', data);

    // Proper type casting with type safety
    const habitsData = data ? data.map(item => ({
      id: String(item.id),
      name: String(item.name),
      description: String(item.description || ''),
      color: String(item.color),
      createdAt: Number(item.createdAt),
      userId: String(item.userId)
    })) : [];
    
    // Also store in localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habitsData));
    return habitsData;
  } catch (error) {
    console.error('Failed to get habits:', error);
    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
};

// Get a single habit by ID
export const getHabitById = async (id: string): Promise<Habit | undefined> => {
  try {
    if (!isUsingRealSupabase() || !supabaseClient) {
      // Fallback to localStorage
      const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return habits.find((h: Habit) => h.id === id);
    }
    
    const { data, error } = await supabaseClient
      .from('habits')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error('Error fetching habit:', error);
      // Fallback to localStorage
      const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return habits.find((h: Habit) => h.id === id);
    }
    
    // Proper type casting
    const habit: Habit = {
      id: String(data.id),
      name: String(data.name),
      description: String(data.description || ''),
      color: String(data.color),
      createdAt: Number(data.createdAt),
      userId: String(data.userId)
    };
    
    return habit;
  } catch (error) {
    console.error('Failed to get habit by ID:', error);
    // Fallback to localStorage
    const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return habits.find((h: Habit) => h.id === id);
  }
};

// Add a new habit
export const addHabit = async (habit: Omit<Habit, 'id' | 'createdAt' | 'userId'>): Promise<Habit> => {
  try {
    console.log('=== Adding New Habit ===');
    console.log('Initial habit data:', habit);
    
    // Check Supabase connection
    const usingRealSupabase = isUsingRealSupabase();
    console.log('Using Supabase:', usingRealSupabase);
    
    if (!usingRealSupabase || !supabaseClient) {
      console.log('No Supabase connection, using localStorage only');
      const newHabit: Habit = {
        ...habit,
        id: uuidv4(),
        createdAt: Date.now(),
        userId: 'anonymous'
      };
      
      const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      habits.push(newHabit);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
      return newHabit;
    }
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    console.log('Auth state:', { user, userError });
    
    if (!user?.id) {
      throw new Error('No authenticated user found');
    }
    
    const newHabit: Habit = {
      ...habit,
      id: uuidv4(),
      createdAt: Date.now(),
      userId: user.id
    };
    
    console.log('Inserting habit into Supabase:', newHabit);
    
    const { data, error } = await supabaseClient
      .from('habits')
      .insert([newHabit])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error adding habit:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('No data returned from Supabase insert');
    }
    
    console.log('Successfully added habit to Supabase:', data);
    
    // Type cast the returned data
    const insertedHabit: Habit = {
      id: String(data.id),
      name: String(data.name),
      description: String(data.description || ''),
      color: String(data.color),
      createdAt: Number(data.createdAt),
      userId: String(data.userId)
    };
    
    return insertedHabit;
  } catch (error) {
    console.error('Failed to add habit:', error);
    
    // Fallback to localStorage
    const newHabit: Habit = {
      ...habit,
      id: uuidv4(),
      createdAt: Date.now(),
      userId: 'anonymous'
    };
    
    const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    habits.push(newHabit);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    
    return newHabit;
  }
};

// Update an existing habit
export const updateHabit = async (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'userId'>>): Promise<Habit | null> => {
  try {
    if (!isUsingRealSupabase() || !supabaseClient) {
      // Fallback to localStorage
      const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const habitIndex = habits.findIndex((h: Habit) => h.id === id);
      
      if (habitIndex === -1) return null;
      
      habits[habitIndex] = {
        ...habits[habitIndex],
        ...updates
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
      return habits[habitIndex];
    }
    
    const { data, error } = await supabaseClient
      .from('habits')
      .update(updates as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error updating habit:', error);
      // Fallback to localStorage
      const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const habitIndex = habits.findIndex((h: Habit) => h.id === id);
      
      if (habitIndex === -1) return null;
      
      habits[habitIndex] = {
        ...habits[habitIndex],
        ...updates
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
      return habits[habitIndex];
    }
    
    // Proper type casting
    const updatedHabit: Habit = {
      id: String(data.id),
      name: String(data.name),
      description: String(data.description || ''),
      color: String(data.color),
      createdAt: Number(data.createdAt),
      userId: String(data.userId)
    };
    
    return updatedHabit;
  } catch (error) {
    console.error('Failed to update habit:', error);
    
    // Fallback to localStorage
    const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const habitIndex = habits.findIndex((h: Habit) => h.id === id);
    
    if (habitIndex === -1) return null;
    
    habits[habitIndex] = {
      ...habits[habitIndex],
      ...updates
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    return habits[habitIndex];
  }
};

// Delete a habit
export const deleteHabit = async (id: string): Promise<boolean> => {
  try {
    if (!isUsingRealSupabase() || !supabaseClient) {
      // Fallback to localStorage
      const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const filteredHabits = habits.filter((h: Habit) => h.id !== id);
      
      if (filteredHabits.length === habits.length) return false;
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHabits));
      return true;
    }

    const { error } = await supabaseClient
      .from('habits')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting habit:', error);
      // Fallback to localStorage
      const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const filteredHabits = habits.filter((h: Habit) => h.id !== id);
      
      if (filteredHabits.length === habits.length) return false;
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHabits));
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete habit:', error);
    
    // Fallback to localStorage
    const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const filteredHabits = habits.filter((h: Habit) => h.id !== id);
    
    if (filteredHabits.length === habits.length) return false;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHabits));
    return true;
  }
};

// Initialize Supabase table if it doesn't exist
export const initializeSupabaseSync = async () => {
  try {
    console.log('=== Starting Supabase Sync ===');
    
    // Verify Supabase connection
    if (!isUsingRealSupabase() || !supabaseClient) {
      throw new Error('No valid Supabase connection available');
    }
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw userError;
    
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    console.log('Authenticated user:', user.id);
    
    // First, fetch all habits from Supabase
    const { data: supabaseHabits, error: fetchError } = await supabaseClient
      .from('habits')
      .select('*')
      .eq('userId', user.id);
    
    if (fetchError) throw fetchError;
    
    // Get local habits
    const localData = localStorage.getItem(STORAGE_KEY);
    const localHabits = localData ? (JSON.parse(localData) as Habit[]) : [];
    
    console.log('Found habits:', {
      supabase: supabaseHabits?.length || 0,
      local: localHabits.length
    });
    
    if (supabaseHabits && supabaseHabits.length > 0) {
      // If we have Supabase data, it's the source of truth
      console.log('Using Supabase as source of truth');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(supabaseHabits));
      return;
    }
    
    if (localHabits.length > 0) {
      console.log('Migrating local habits to Supabase');
      // Migrate local habits to Supabase
      const habitsWithUserId = localHabits.map(habit => ({
        ...habit,
        userId: user.id
      }));
      
      const { error: upsertError } = await supabaseClient
        .from('habits')
        .upsert(habitsWithUserId)
        .select();
      
      if (upsertError) throw upsertError;
      
      console.log('Successfully migrated local habits to Supabase');
    }
  } catch (error) {
    console.error('Failed to initialize Supabase sync:', error);
    throw error; // Re-throw to handle in the calling code
  }
};
