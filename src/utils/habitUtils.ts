
// Habit management utilities
import { supabaseClient } from './supabaseClient';

export interface Habit {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: number;
  userId?: string; // For future use with authentication
}

const STORAGE_KEY = 'time-savor-habits';

// Get all habits
export const getHabits = (): Habit[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// Get a single habit by ID
export const getHabitById = (id: string): Habit | undefined => {
  const habits = getHabits();
  return habits.find(habit => habit.id === id);
};

// Add a new habit
export const addHabit = (habit: Omit<Habit, 'id' | 'createdAt'>): Habit => {
  const habits = getHabits();
  const newHabit = {
    ...habit,
    id: Math.random().toString(36).substring(2, 9),
    createdAt: Date.now()
  };
  
  habits.push(newHabit);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  
  return newHabit;
};

// Update an existing habit
export const updateHabit = (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>): Habit | null => {
  const habits = getHabits();
  const habitIndex = habits.findIndex(habit => habit.id === id);
  
  if (habitIndex === -1) return null;
  
  habits[habitIndex] = {
    ...habits[habitIndex],
    ...updates
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  
  return habits[habitIndex];
};

// Delete a habit
export const deleteHabit = (id: string): boolean => {
  const habits = getHabits();
  const filteredHabits = habits.filter(habit => habit.id !== id);
  
  if (filteredHabits.length === habits.length) return false;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHabits));
  
  return true;
};

// Export habits data
export const exportHabits = (): string => {
  const habits = getHabits();
  return JSON.stringify(habits);
};

// Import habits data
export const importHabits = (jsonData: string): boolean => {
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
    
    localStorage.setItem(STORAGE_KEY, jsonData);
    return true;
  } catch (error) {
    console.error('Failed to import habits:', error);
    return false;
  }
};

// For future implementation with Supabase
export const initializeSupabaseSync = async () => {
  // This function will be implemented when connecting to Supabase
  console.log("Supabase sync not yet implemented");
};

