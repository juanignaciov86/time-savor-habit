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
    if (!isUsingRealSupabase() || !supabaseClient) {
      console.log('Using localStorage fallback for habits (no Supabase URL configured)');
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    }

    const { data: user } = await supabaseClient.auth.getUser();
    const userId = user?.id;
    
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
    const newHabit: Habit = {
      ...habit,
      id: uuidv4(),
      createdAt: Date.now(),
      userId: 'anonymous'
    };
    
    if (isUsingRealSupabase() && supabaseClient) {
      const { data: userData } = await supabaseClient.auth.getUser();
      const userId = userData?.user?.id;
      
      if (userId) {
        newHabit.userId = userId;
        
        // Explicitly convert Habit to Record<string, unknown>
        const habitRecord: Record<string, unknown> = {
          id: newHabit.id,
          name: newHabit.name,
          description: newHabit.description,
          color: newHabit.color,
          createdAt: newHabit.createdAt,
          userId: newHabit.userId
        };
        
        const { data, error } = await supabaseClient
          .from('habits')
          .insert([habitRecord])
          .select();
        
        if (error) {
          console.error('Error adding habit:', error);
        } else if (data && data.length > 0) {
          // Store in localStorage as backup
          const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
          
          // Proper type casting
          const insertedHabit: Habit = {
            id: String(data[0].id),
            name: String(data[0].name),
            description: String(data[0].description || ''),
            color: String(data[0].color),
            createdAt: Number(data[0].createdAt),
            userId: String(data[0].userId)
          };
          
          habits.push(insertedHabit);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
          return insertedHabit;
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
    // Skip sync if not using real Supabase or if client is null
    if (!isUsingRealSupabase() || !supabaseClient) {
      console.log('Skipping Supabase sync (using demo/local mode)');
      return;
    }
    
    // Check if the user is authenticated
    const { data } = await supabaseClient.auth.getUser();
    const user = data?.user;
    
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
          
          // Convert habits to Record<string, unknown>[] for proper typing
          const habitsRecords: Record<string, unknown>[] = habitsWithUserId.map(habit => ({
            id: habit.id,
            name: habit.name,
            description: habit.description,
            color: habit.color,
            createdAt: habit.createdAt,
            userId: habit.userId
          }));
          
          // Insert into Supabase
          const { error } = await supabaseClient
            .from('habits')
            .upsert(habitsRecords, { onConflict: 'id' });
            
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
