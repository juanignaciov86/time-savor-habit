// Habit management utilities
import { supabaseClient, isUsingRealSupabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import {
  storeHabits,
  getStoredHabits,
  addPendingAction,
  isOnline,
  registerConnectivityListeners
} from './offlineStorage';

export interface Habit {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: number;
  userId: string; // User ID from Supabase Auth
}

const STORAGE_KEY = 'habits'; // Must match HABITS_KEY in offlineStorage.ts

// Get all habits - sync wrapper for components that can't handle async
export const getHabitsSync = (): Habit[] => {
  try {
    // Use getStoredHabits for consistency
    return getStoredHabits();
  } catch (error) {
    console.error('Failed to get habits from localStorage:', error);
    return [];
  }
};

// Get all habits - async version for database operations
export const getHabits = async (): Promise<Habit[]> => {
  // Always return stored habits first for immediate display
  const storedHabits = getStoredHabits();
  
  try {
    // If offline, return stored habits
    if (!isOnline()) {
      console.log('Offline mode: using stored habits');
      return storedHabits;
    }
    
    // Check if we're authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user?.id) {
      console.log('No authenticated user, using stored habits');
      return storedHabits;
    }

    // Fetch from Supabase
    const { data, error } = await supabaseClient
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    if (!data) {
      console.log('No habits found in Supabase');
      return storedHabits;
    }
    
    // Type cast and validate data
    const habitsData = data.map(item => ({
      id: String(item.id),
      name: String(item.name),
      description: String(item.description || ''),
      color: String(item.color),
      createdAt: Number(item.created_at),
      userId: String(item.user_id)
    }));
    
    // Update stored habits
    storeHabits(habitsData);
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
      createdAt: Number(data.created_at),
      userId: String(data.user_id)
    };
    
    return habit;
  } catch (error) {
    console.error('Failed to get habit by ID:', error);
    // Fallback to localStorage
    const habits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return habits.find((h: Habit) => h.id === id);
  }
};

// Handle offline mode for habit operations
const handleOfflineMode = (habit: Omit<Habit, 'createdAt' | 'userId'> & { id?: string }, type: 'add' | 'update' | 'delete' = 'add'): Habit => {
  console.log('Using offline mode');
  const offlineHabit: Habit = {
    ...habit,
    id: habit.id || uuidv4(),
    createdAt: Date.now(),
    userId: 'offline'
  };
  
  // Get existing habits using the shared function
  const habits = getStoredHabits();
  
  // Update habits array based on operation type
  let updatedHabits: Habit[];
  if (type === 'add') {
    updatedHabits = [...habits, offlineHabit];
  } else if (type === 'update') {
    updatedHabits = habits.map(h => h.id === offlineHabit.id ? offlineHabit : h);
  } else if (type === 'delete') {
    updatedHabits = habits.filter(h => h.id !== offlineHabit.id);
  } else {
    updatedHabits = habits;
  }
  
  // Store updated habits using the shared function
  storeHabits(updatedHabits);
  
  // Add to pending actions for sync
  addPendingAction({
    type,
    data: offlineHabit
  });
  
  return offlineHabit;
};

// Add a new habit
export const addHabit = async (habit: Omit<Habit, 'id' | 'createdAt' | 'userId'>): Promise<Habit> => {
  try {
    console.log('=== Adding New Habit ===');
    
    const usingRealSupabase = await isUsingRealSupabase();
    
    // Handle offline mode
    if (!usingRealSupabase || !supabaseClient) {
      const newId = uuidv4();
      const habitWithId = { ...habit, id: newId } as Omit<Habit, 'createdAt' | 'userId'> & { id: string };
      return handleOfflineMode(habitWithId, 'add');
    }
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user?.id) {
      const newId = uuidv4();
      const habitWithId = { ...habit, id: newId } as Omit<Habit, 'createdAt' | 'userId'> & { id: string };
      return handleOfflineMode(habitWithId, 'add');
    }
    
    const newHabit: Habit = {
      ...habit,
      id: uuidv4(),
      createdAt: Date.now(),
      userId: user.id
    };
    
    // Convert to snake_case for database
    const dbHabit = {
      id: newHabit.id,
      name: newHabit.name,
      description: newHabit.description,
      color: newHabit.color,
      created_at: newHabit.createdAt,
      user_id: user.id
    };
    
    console.log('Adding habit to Supabase:', newHabit);
    
    const { data, error } = await supabaseClient
      .from('habits')
      .insert([dbHabit])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      if (error.message.includes('JWT expired')) {
        console.log('Session expired, using offline mode');
        const newId = uuidv4();
        const habitWithId = { ...habit, id: newId } as Omit<Habit, 'createdAt' | 'userId'> & { id: string };
        return handleOfflineMode(habitWithId, 'add');
      }
      throw error;
    }
    
    if (!data) {
      console.error('No data returned from Supabase insert');
      const newId = uuidv4();
      const habitWithId = { ...habit, id: newId } as Omit<Habit, 'createdAt' | 'userId'> & { id: string };
      return handleOfflineMode(habitWithId, 'add');
    }
    
    // Type cast and validate the returned data
    const insertedHabit: Habit = {
      id: String(data.id),
      name: String(data.name),
      description: String(data.description || ''),
      color: String(data.color),
      createdAt: Number(data.created_at),
      userId: String(data.user_id)
    };
    
    // Update local storage with the latest data
    const localHabits = await getHabits();
    storeHabits([...localHabits, insertedHabit]);
    
    console.log('Successfully added habit:', insertedHabit);
    return insertedHabit;
  } catch (error) {
    console.error('Error adding habit:', error);
    
    // Only use localStorage if we have a network error
    if (error instanceof Error && error.message.includes('network')) {
      console.log('Network error, storing habit offline');
      const newId = uuidv4();
      const habitWithId = { ...habit, id: newId } as Omit<Habit, 'createdAt' | 'userId'> & { id: string };
      return handleOfflineMode(habitWithId, 'add');
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
    if (userError || !user?.id) {
      console.log('No authenticated user, falling back to localStorage');
      const localHabits = getHabitsSync();
      const habitToUpdate = localHabits.find(h => h.id === id);
      if (!habitToUpdate) return null;
      
      const updatedHabit = { ...habitToUpdate, ...updates };
      const updatedHabits = localHabits.map(h => h.id === id ? updatedHabit : h);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHabits));
      return updatedHabit;
    }
    
    // First verify the habit exists and belongs to the user
    const { data: existingHabit, error: fetchError } = await supabaseClient
      .from('habits')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError) throw fetchError;
    if (!existingHabit) return null;
    
    // Update the habit
    // Convert updates to snake_case for database
    const dbUpdates = {
      ...updates
    };

    const { data, error } = await supabaseClient
      .from('habits')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
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
      createdAt: Number(data.created_at),
      userId: String(data.user_id)
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
      const localHabits = getHabitsSync();
      const habitToDelete = localHabits.find(h => h.id === id);
      if (!habitToDelete) return false;
      
      await handleOfflineMode(habitToDelete, 'delete');
      return true;
    }
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user?.id) {
      console.log('No authenticated user, falling back to localStorage');
      const localHabits = getHabitsSync();
      const habitToDelete = localHabits.find(h => h.id === id);
      if (!habitToDelete) return false;
      
      await handleOfflineMode(habitToDelete, 'delete');
      return true;
    }
    
    // First verify the habit exists and belongs to the user
    const { data: existingHabit, error: fetchError } = await supabaseClient
      .from('habits')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError) throw fetchError;
    if (!existingHabit) return false;
    
    // Delete the habit
    const { error } = await supabaseClient
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
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
    
    // Check Supabase connection
    const usingRealSupabase = await isUsingRealSupabase();
    if (!usingRealSupabase || !supabaseClient) {
      console.log('No Supabase connection available, skipping sync');
      return;
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
      .eq('user_id', user.id);
    
    if (fetchError) throw fetchError;
    
    // Get local habits
    const localData = localStorage.getItem(STORAGE_KEY);
    const localHabits = localData ? (JSON.parse(localData) as Habit[]) : [];
    
    console.log('Found habits:', {
      supabase: supabaseHabits?.length || 0,
      local: localHabits.length
    });
    
    // Check if we have Supabase data
    if (supabaseHabits && supabaseHabits.length > 0) {
      console.log('Using Supabase data as source of truth');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(supabaseHabits));
      return;
    }
    
    // Keep using local data if Supabase is empty
    console.log('No Supabase data found, keeping local data');
    
    if (localHabits.length > 0) {
      console.log('Migrating local habits to Supabase');
      // Migrate local habits to Supabase
      const habitsWithUserId = localHabits.map(habit => ({
        ...habit,
        user_id: user.id
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
