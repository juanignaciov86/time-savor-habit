
// Storage utilities for habit sessions

import { getHabitById } from './habitUtils';

export interface HabitSession {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  habitId: string;
}

const SESSIONS_STORAGE_KEY = 'time-savor-sessions';

// Get all sessions
export const getSessions = (): HabitSession[] => {
  const data = localStorage.getItem(SESSIONS_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// Get sessions for a specific habit
export const getSessionsByHabit = (habitId: string): HabitSession[] => {
  const sessions = getSessions();
  return sessions.filter(session => session.habitId === habitId);
};

// Save a new session
export const saveSession = (session: HabitSession): void => {
  const sessions = getSessions();
  sessions.push(session);
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
};

// Get daily total time for all habits or a specific habit
export const getDailyTotal = (habitId?: string): number => {
  const sessions = habitId ? getSessionsByHabit(habitId) : getSessions();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return sessions
    .filter(session => {
      const sessionDate = new Date(session.endTime);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    })
    .reduce((total, session) => total + session.duration, 0);
};

// Get weekly stats for all habits or a specific habit
export const getWeeklyStats = (habitId?: string): { date: number, duration: number }[] => {
  const sessions = habitId ? getSessionsByHabit(habitId) : getSessions();
  const today = new Date();
  const dayOfWeek = today.getDay();
  const result = [];
  
  // Create stats for the past 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - (dayOfWeek + i) % 7);
    date.setHours(0, 0, 0, 0);
    
    const dayTotal = sessions
      .filter(session => {
        const sessionDate = new Date(session.endTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === date.getTime();
      })
      .reduce((total, session) => total + session.duration, 0);
    
    result.push({
      date: date.getTime(),
      duration: dayTotal
    });
  }
  
  return result;
};

// Get monthly stats for all habits or a specific habit
export const getMonthlyStats = (habitId?: string): { date: number, duration: number }[] => {
  const sessions = habitId ? getSessionsByHabit(habitId) : getSessions();
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  const result = [];
  
  // Create stats for each day in the current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    
    const dayTotal = sessions
      .filter(session => {
        const sessionDate = new Date(session.endTime);
        return (
          sessionDate.getDate() === day &&
          sessionDate.getMonth() === currentMonth &&
          sessionDate.getFullYear() === currentYear
        );
      })
      .reduce((total, session) => total + session.duration, 0);
    
    result.push({
      date: date.getTime(),
      duration: dayTotal
    });
  }
  
  return result;
};
