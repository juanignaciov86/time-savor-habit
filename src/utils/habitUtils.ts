
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
    // Check if we're using a real Supabase instance
    if (!isUsingRealSupabase()) {
      console.log('Using localStorage fallback for habits (no Supabase URL configured)');
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    }

    const user = await supabaseClient.auth.getUser();
    const userId = user.data.user?.id;
    
    if (!userId) {
      // Fallback to localStorage if not authenticated
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    }

    const { data, error } = await supabaseClient
      .from('habits')
      .select('*')
      .eq('userId', userId);

    if (error) {
      console.error('Error fetching habits:', error);
      // Fallback to localStorage
      const localData = localStorage.getItem(STORAGE_KEY);
      return localData ? JSON.parse(localData) : [];
    }

    // Also store in localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data || []));
    return data || [];
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
    if (!isUsingRealSupabase()) {
      // Fallback to localStorage
      const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return habits.find((h: Habit) => h.id === id);
    }
    
    const { data, error } = await supabaseClient
      .from('habits')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching habit:', error);
      // Fallback to localStorage
      const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return habits.find((h: Habit) => h.id === id);
    }
    
    return data;
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
    const newHabit = {
      ...habit,
      id: uuidv4(),
      createdAt: Date.now(),
      userId: 'anonymous'
    };
    
    if (isUsingRealSupabase()) {
      const user = supabaseClient.auth.getUser();
      const userId = (await user).data.user?.id;
      
      if (userId) {
        newHabit.userId = userId;
        
        const { data, error } = await supabaseClient
          .from('habits')
          .insert([newHabit])
          .select();
        
        if (error) {
          console.error('Error adding habit:', error);
        } else if (data) {
          // Store in localStorage as backup
          const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
          habits.push(data[0]);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
          return data[0];
        }
      }
    }
    
    // Fallback to localStorage
    const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    habits.push(newHabit);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    
    return newHabit;
  } catch (error) {
    console.error('Failed to add habit:', error);
    
    // Fallback to localStorage
    const newHabit = {
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
    if (!isUsingRealSupabase()) {
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
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
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
    
    return data;
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

// Export habits data
export const exportHabits = async (): Promise<string> => {
  const habits = await getHabits();
  return JSON.stringify(habits);
};

// Import habits data
export const importHabits = async (jsonData: string): Promise<boolean> => {
  try {
    const habits = JSON.parse(jsonData) as Habit[];
    
    // Validate imported data
    const isValidData = Array.isArray(habits) && 
      habits.every(habit => 
        typeof habit.id === 'string' && 
        typeof habit.name === 'string' &&
        typeof habit.color === 'string' &&
        typeof habit.createdAt === 'number'
      );
    
    if (!isValidData) {
      return false;
    }
    
    const user = supabaseClient.auth.getUser();
    const userId = (await user).data.user?.id;
    
    if (!userId) {
      // Fallback to localStorage
      localStorage.setItem(STORAGE_KEY, jsonData);
      return true;
    }
    
    // Update userId for all habits
    const habitsWithUserId = habits.map(h => ({
      ...h,
      userId
    }));
    
    // Insert into Supabase (upsert to handle existing records)
    const { error } = await supabaseClient
      .from('habits')
      .upsert(habitsWithUserId, { onConflict: 'id' });
    
    if (error) {
      console.error('Error importing habits to Supabase:', error);
      // Fallback to localStorage
      localStorage.setItem(STORAGE_KEY, jsonData);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to import habits:', error);
    return false;
  }
};

// Initialize Supabase table if it doesn't exist
export const initializeSupabaseSync = async () => {
  try {
    // Skip sync if not using real Supabase
    if (!isUsingRealSupabase()) {
      console.log('Skipping Supabase sync (using demo/local mode)');
      return;
    }
    
    // Check if the user is authenticated
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (user) {
      console.log('User is authenticated, syncing data');
      
      // Check if we have local data to migrate
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        const localHabits = JSON.parse(localData) as Habit[];
        
        if (localHabits.length > 0) {
          // Update all local habits with the user's ID
          const habitsWithUserId = localHabits.map(habit => ({
            ...habit,
            userId: user.id
          }));
          
          // Insert into Supabase
          const { error } = await supabaseClient
            .from('habits')
            .upsert(habitsWithUserId, { onConflict: 'id' });
            
          if (!error) {
            console.log('Local habits migrated to Supabase');
            // Clear local storage after successful migration
            // Don't clear yet, keep as backup
            // localStorage.removeItem(STORAGE_KEY);
          } else {
            console.error('Failed to migrate local habits:', error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Supabase sync error:', error);
  }
};
