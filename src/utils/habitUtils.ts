
// Habit management utilities

export interface Habit {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: number;
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
