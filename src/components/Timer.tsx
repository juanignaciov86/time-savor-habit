
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Plus } from 'lucide-react';
import { formatTime } from '../utils/timeUtils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getHabits, getHabitsSync, Habit } from '../utils/habitUtils';
import { TimeEntryDialog } from './TimeEntryDialog';

interface TimerProps {
  onSessionComplete: (duration: number, habitId: string) => void;
}

const Timer: React.FC<TimerProps> = ({ onSessionComplete }) => {
  // Initialize state from localStorage if available
  const storedState = localStorage.getItem('timer_state');
  const initialState = storedState ? JSON.parse(storedState) : null;
  
  const [isRunning, setIsRunning] = useState(initialState?.isRunning || false);
  const [selectedHabit, setSelectedHabit] = useState<string | null>(initialState?.selectedHabit || null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const startTimeRef = useRef<number | null>(initialState?.startTime || null);
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    if (initialState?.isRunning && initialState?.startTime) {
      return Math.floor((Date.now() - initialState.startTime) / 1000);
    }
    return 0;
  });

  // Load habits on component mount
  useEffect(() => {
    // Initial load with sync function to avoid delays
    const initialHabits = getHabitsSync();
    setHabits(initialHabits);
    
    // Select first habit by default if available
    if (initialHabits.length > 0 && !selectedHabit) {
      setSelectedHabit(initialHabits[0].id);
    }
    
    // Then load from database asynchronously
    getHabits().then(dbHabits => {
      setHabits(dbHabits);
      // If we didn't have any habits initially but got some from the db, select the first one
      if (dbHabits.length > 0 && !selectedHabit) {
        setSelectedHabit(dbHabits[0].id);
      }
    }).catch(error => {
      console.error("Error loading habits:", error);
    });
  }, []);



  // Update elapsed time
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const updateTimer = () => {
      if (!isRunning || !startTimeRef.current) return;
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);
    };

    if (isRunning && startTimeRef.current) {
      // Update immediately
      updateTimer();
      // Then set up interval
      intervalId = setInterval(updateTimer, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning]);

  // Save timer state to localStorage
  useEffect(() => {
    if (isRunning && startTimeRef.current) {
      const timerState = {
        isRunning,
        selectedHabit,
        startTime: startTimeRef.current
      };
      localStorage.setItem('timer_state', JSON.stringify(timerState));
    }
  }, [isRunning, selectedHabit]);



  const toggleTimer = () => {
    if (!selectedHabit) return;

    if (!isRunning) {
      // Starting the timer
      const now = Date.now();
      startTimeRef.current = now;
      setIsRunning(true);
      // Save initial state
      const timerState = {
        isRunning: true,
        selectedHabit,
        startTime: now
      };
      localStorage.setItem('timer_state', JSON.stringify(timerState));
    } else {
      // Stopping the timer
      setIsRunning(false);
      if (elapsedSeconds > 0 && selectedHabit) {
        onSessionComplete(elapsedSeconds, selectedHabit);
        setElapsedSeconds(0);
        startTimeRef.current = null;
        localStorage.removeItem('timer_state');
      }
    }
  };

  const handleManualEntry = (session: { startTime: number; endTime: number; duration: number; habitId: string }) => {
    onSessionComplete(session.duration, session.habitId);
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="ios-card w-full p-6 flex flex-col items-center">
        <h2 className="text-2xl font-semibold mb-4">Focus Time</h2>
        
        <div className="w-full mb-6">
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Select
                disabled={isRunning}
                value={selectedHabit || ""}
                onValueChange={(value) => setSelectedHabit(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a habit to track" />
                </SelectTrigger>
                <SelectContent>
                  {habits.map((habit) => (
                    <SelectItem key={habit.id} value={habit.id}>
                      <div className="flex items-center">
                        <span 
                      className="h-3 w-3 rounded-full mr-2" 
                      style={{ backgroundColor: habit.color }}
                    ></span>
                    {habit.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </div>
        </div>
        
        <div className="text-6xl font-extralight my-8">{formatTime(elapsedSeconds)}</div>

        <div className="flex gap-2 mb-4 w-full justify-center">
          <TimeEntryDialog
            habits={habits}
            onSave={handleManualEntry}
            trigger={<Button variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>}
          />
        </div>
        
        <Button 
          onClick={toggleTimer}
          disabled={!selectedHabit}
          className={`rounded-full h-16 w-16 flex items-center justify-center transition-colors
            ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-ios-blue hover:bg-blue-700'}
            ${!selectedHabit ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={isRunning ? "Stop Timer" : "Start Timer"}
        >
          {isRunning ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8 ml-1" />
          )}
        </Button>
      </div>
      
      <p className="text-ios-gray text-sm text-center">
        {!selectedHabit 
          ? "Select a habit to begin tracking time"
          : isRunning 
            ? "Focus on your habit. Tap to stop when you're done." 
            : "Tap the button to start tracking your habit time."
        }
      </p>
    </div>
  );
};

export default Timer;
