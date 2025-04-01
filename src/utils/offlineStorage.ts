import { Habit } from './habitUtils';

interface SyncManager {
  register(tag: string): Promise<void>;
}

const HABITS_KEY = 'habits';
const PENDING_ACTIONS_KEY = 'pendingActions';

export interface PendingAction {
  id: string;
  type: 'add' | 'update' | 'delete';
  data: Habit;
  timestamp: number;
}

// Store habits in local storage
export const storeHabits = (habits: Habit[]) => {
  try {
    const existingHabits = getStoredHabits();
    // Merge with existing habits, preferring new ones
    const mergedHabits = habits.map(habit => {
      const existing = existingHabits.find(h => h.id === habit.id);
      return existing ? { ...existing, ...habit } : habit;
    });
    
    // Add any existing habits not in the new list
    existingHabits.forEach(habit => {
      if (!mergedHabits.some(h => h.id === habit.id)) {
        mergedHabits.push(habit);
      }
    });
    
    localStorage.setItem(HABITS_KEY, JSON.stringify(mergedHabits));
  } catch (error) {
    console.error('Failed to store habits:', error);
  }
};

// Get habits from local storage
export const getStoredHabits = (): Habit[] => {
  const stored = localStorage.getItem(HABITS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Add a pending action
export const addPendingAction = (action: Omit<PendingAction, 'id' | 'timestamp'>) => {
  const pendingActions = getPendingActions();
  const newAction: PendingAction = {
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  
  pendingActions.push(newAction);
  localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pendingActions));
  
  // Request sync if possible
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      if ('sync' in registration && registration.sync) {
        (registration.sync as SyncManager).register('sync-habits');
      }
    });
  }
};

// Get all pending actions
export const getPendingActions = (): PendingAction[] => {
  const stored = localStorage.getItem(PENDING_ACTIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Clear pending actions
export const clearPendingActions = () => {
  localStorage.removeItem(PENDING_ACTIONS_KEY);
};

// Check online status
export const isOnline = () => {
  // Check both navigator.onLine and try a fetch to verify real connectivity
  if (!navigator.onLine) return false;
  
  // Return true for now, but start a background check
  setTimeout(async () => {
    try {
      const response = await fetch('/ping');
      const isReallyOnline = response.ok;
      if (!isReallyOnline) {
        window.dispatchEvent(new Event('offline'));
      }
    } catch (error) {
      // If fetch fails, we're offline
      window.dispatchEvent(new Event('offline'));
    }
  }, 0);
  
  return true;
};

// Register online/offline event listeners
export const registerConnectivityListeners = (callbacks: {
  onOnline?: () => void;
  onOffline?: () => void;
}) => {
  window.addEventListener('online', async () => {
    // Get pending actions first
    const pendingActions = getPendingActions();
    
    // Check for Supabase client and authentication
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if ('sync' in registration && registration.sync) {
          (registration.sync as SyncManager).register('sync-habits');
        }
      });
    }
    
    // Call the provided callback
    callbacks.onOnline?.();
  });
  
  window.addEventListener('offline', () => {
    callbacks.onOffline?.();
  });
  
  return () => {
    window.removeEventListener('online', callbacks.onOnline!);
    window.removeEventListener('offline', callbacks.onOffline!);
  };
};
