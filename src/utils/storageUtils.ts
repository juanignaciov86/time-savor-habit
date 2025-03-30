
export interface HabitSession {
  id: string;
  startTime: number;
  endTime: number;
  duration: number; // in seconds
}

const STORAGE_KEY = 'habit-timer-sessions';

// Save a session to localStorage
export const saveSession = (session: HabitSession): void => {
  const sessions = getSessions();
  sessions.push(session);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

// Get all sessions from localStorage
export const getSessions = (): HabitSession[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// Clear all sessions (for testing)
export const clearSessions = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

// Get daily stats
export const getDailyTotal = (date: Date = new Date()): number => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return getSessions()
    .filter(session => session.startTime >= startOfDay.getTime() && session.startTime <= endOfDay.getTime())
    .reduce((total, session) => total + session.duration, 0);
};

// Get weekly stats
export const getWeeklyStats = (): { date: number, duration: number }[] => {
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(now.getDate() - (day === 0 ? 6 : day - 1)); // Adjust to start on Monday
  startOfWeek.setHours(0, 0, 0, 0);
  
  const weekStats = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    
    const dayTotal = getDailyTotal(date);
    
    weekStats.push({
      date: date.getTime(),
      duration: dayTotal
    });
  }
  
  return weekStats;
};

// Get monthly stats
export const getMonthlyStats = (): { date: number, duration: number }[] => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const monthStats = [];
  
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const dayTotal = getDailyTotal(date);
    
    monthStats.push({
      date: date.getTime(),
      duration: dayTotal
    });
  }
  
  return monthStats;
};
