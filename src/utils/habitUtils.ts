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
    console.log('=== Getting Habits ===');
    console.log('Using Supabase:', usingRealSupabase);
    
    if (!usingRealSupabase || !supabaseClient) {
      throw new Error('No Supabase connection available');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw userError;
    
    if (!user?.id) {
      throw new Error('No authenticated user found');
    }
    
    console.log('Fetching habits for user:', user.id);
    const { data, error } = await supabaseClient
      .from('habits')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: true });

    if (error) throw error;
    
    if (!data) {
      console.log('No habits found in Supabase');
      return [];
    }
    
    // Type cast and validate data
    const habitsData = data.map(item => ({
      id: String(item.id),
      name: String(item.name),
      description: String(item.description || ''),
      color: String(item.color),
      createdAt: Number(item.createdAt),
      userId: String(item.userId)
    }));
    
    console.log(`Found ${habitsData.length} habits in Supabase`);
    
    // Store in localStorage for offline access
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habitsData));
    return habitsData;
  } catch (error) {
    console.error('Error fetching habits:', error);
    
    // Only use localStorage if we have a network error
    if (error instanceof Error && error.message.includes('network')) {
      console.log('Network error, using offline data');
      const localData = localStorage.getItem(STORAGE_KEY);
      return localData ? JSON.parse(localData) : [];
    }
    
    throw error;
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
    
    if (!isUsingRealSupabase() || !supabaseClient) {
      throw new Error('No Supabase connection available');
    }
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw userError;
    
    if (!user?.id) {
      throw new Error('No authenticated user found');
    }
    
    const newHabit: Habit = {
      ...habit,
      id: uuidv4(),
      createdAt: Date.now(),
      userId: user.id
    };
    
    console.log('Adding habit to Supabase:', newHabit);
    
    const { data, error } = await supabaseClient
      .from('habits')
      .insert([newHabit])
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('No data returned from Supabase insert');
    
    // Type cast and validate the returned data
    const insertedHabit: Habit = {
      id: String(data.id),
      name: String(data.name),
      description: String(data.description || ''),
      color: String(data.color),
      createdAt: Number(data.createdAt),
      userId: String(data.userId)
    };
    
    // Update local storage with the latest data
    const localHabits = await getHabits();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localHabits));
    
    console.log('Successfully added habit:', insertedHabit);
    return insertedHabit;
  } catch (error) {
    console.error('Error adding habit:', error);
    
    // Only use localStorage if we have a network error
    if (error instanceof Error && error.message.includes('network')) {
      console.log('Network error, storing habit offline');
      const offlineHabit: Habit = {
        ...habit,
        id: uuidv4(),
        createdAt: Date.now(),
        userId: 'offline'
      };
      
      const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      habits.push(offlineHabit);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
      
      return offlineHabit;
    }
    
    throw error;
  }
};

// Update an existing habit
export const updateHabit = async (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'userId'>>): Promise<Habit | null> => {
  try {
    console.log('=== Updating Habit ===');
    
    if (!isUsingRealSupabase() || !supabaseClient) {
      throw new Error('No Supabase connection available');
    }
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw userError;
    
    if (!user?.id) {
      throw new Error('No authenticated user found');
    }
    
    // First verify the habit exists and belongs to the user
    const { data: existingHabit, error: fetchError } = await supabaseClient
      .from('habits')
      .select('*')
      .eq('id', id)
      .eq('userId', user.id)
      .single();
    
    if (fetchError) throw fetchError;
    if (!existingHabit) return null;
    
    // Update the habit
    const { data, error } = await supabaseClient
      .from('habits')
      .update(updates)
      .eq('id', id)
      .eq('userId', user.id)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) return null;
    
    // Type cast and validate the returned data
    const updatedHabit: Habit = {
      id: String(data.id),
      name: String(data.name),
      description: String(data.description || ''),
      color: String(data.color),
      createdAt: Number(data.createdAt),
      userId: String(data.userId)
    };
    
    // Update local storage with the latest data
    const localHabits = await getHabits();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localHabits));
    
    console.log('Successfully updated habit:', updatedHabit);
    return updatedHabit;
  } catch (error) {
    console.error('Error updating habit:', error);
    
    // Only use localStorage if we have a network error
    if (error instanceof Error && error.message.includes('network')) {
      console.log('Network error, updating habit offline');
      const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const habitIndex = habits.findIndex((h: Habit) => h.id === id);
      
      if (habitIndex === -1) return null;
      
      const updatedHabit = {
        ...habits[habitIndex],
        ...updates
      };
      
      habits[habitIndex] = updatedHabit;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
      return updatedHabit;
    }
    
    throw error;
  }
};

// Delete a habit
export const deleteHabit = async (id: string): Promise<boolean> => {
  try {
    console.log('=== Deleting Habit ===');
    
    if (!isUsingRealSupabase() || !supabaseClient) {
      throw new Error('No Supabase connection available');
    }
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw userError;
    
    if (!user?.id) {
      throw new Error('No authenticated user found');
    }
    
    // First verify the habit exists and belongs to the user
    const { data: existingHabit, error: fetchError } = await supabaseClient
      .from('habits')
      .select('*')
      .eq('id', id)
      .eq('userId', user.id)
      .single();
    
    if (fetchError) throw fetchError;
    if (!existingHabit) return false;
    
    // Delete the habit
    const { error } = await supabaseClient
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('userId', user.id);
    
    if (error) throw error;
    
    // Update local storage with the latest data
    const localHabits = await getHabits();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localHabits));
    
    console.log('Successfully deleted habit:', id);
    return true;
  } catch (error) {
    console.error('Error deleting habit:', error);
    
    // Only use localStorage if we have a network error
    if (error instanceof Error && error.message.includes('network')) {
      console.log('Network error, deleting habit offline');
      const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const filteredHabits = habits.filter((h: Habit) => h.id !== id);
      
      if (filteredHabits.length === habits.length) return false;
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHabits));
      return true;
    }
    
    throw error;
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
