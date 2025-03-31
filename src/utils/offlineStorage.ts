import { Habit } from './habitUtils';

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
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
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
  if ('serviceWorker' in navigator && 'sync' in registration) {
    registration.sync.register('sync-habits');
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
export const isOnline = () => navigator.onLine;

// Register online/offline event listeners
export const registerConnectivityListeners = (callbacks: {
  onOnline?: () => void;
  onOffline?: () => void;
}) => {
  window.addEventListener('online', () => {
    callbacks.onOnline?.();
    if ('serviceWorker' in navigator && 'sync' in registration) {
      registration.sync.register('sync-habits');
    }
  });
  
  window.addEventListener('offline', () => {
    callbacks.onOffline?.();
  });
  
  return () => {
    window.removeEventListener('online', callbacks.onOnline!);
    window.removeEventListener('offline', callbacks.onOffline!);
  };
};
