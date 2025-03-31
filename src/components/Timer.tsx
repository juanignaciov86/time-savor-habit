
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
  const [isRunning, setIsRunning] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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

  // Effect for the timer using performance.now()
  useEffect(() => {
    let animationFrameId: number;

    const updateTimer = () => {
      if (!isRunning || !startTimeRef.current) return;

      const now = performance.now();
      if (!lastTickRef.current) lastTickRef.current = now;

      // Update every second
      if (now - lastTickRef.current >= 1000) {
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);
        lastTickRef.current = now;
      }

      animationFrameId = requestAnimationFrame(updateTimer);
    };

    if (isRunning) {
      if (!startTimeRef.current) {
        startTimeRef.current = performance.now();
      }
      updateTimer();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRunning]);

  const toggleTimer = () => {
    if (!selectedHabit) return;

    if (!isRunning) {
      // Starting the timer
      startTimeRef.current = performance.now();
      lastTickRef.current = null;
      setIsRunning(true);
    } else {
      // Stopping the timer
      setIsRunning(false);
      if (elapsedSeconds > 0 && selectedHabit) {
        const endTime = Date.now();
        const startTime = endTime - (elapsedSeconds * 1000);
        onSessionComplete(elapsedSeconds, selectedHabit);
        setElapsedSeconds(0);
        startTimeRef.current = null;
        lastTickRef.current = null;
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
