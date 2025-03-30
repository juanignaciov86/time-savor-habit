
import React, { useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { formatTime } from '../utils/timeUtils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getHabits, Habit } from '../utils/habitUtils';

interface TimerProps {
  onSessionComplete: (duration: number, habitId: string) => void;
}

const Timer: React.FC<TimerProps> = ({ onSessionComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);

  // Load habits on component mount
  useEffect(() => {
    const loadedHabits = getHabits();
    setHabits(loadedHabits);
    
    // Select first habit by default if available
    if (loadedHabits.length > 0 && !selectedHabit) {
      setSelectedHabit(loadedHabits[0].id);
    }
  }, []);

  // Effect for the timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const toggleTimer = () => {
    if (!selectedHabit) {
      // Cannot start timer without selecting a habit
      return;
    }
    
    if (!isRunning) {
      // Starting the timer
      setStartTime(Date.now());
      setIsRunning(true);
    } else {
      // Stopping the timer
      setIsRunning(false);
      const sessionDuration = seconds;
      
      // Only record if we've tracked some time and a habit is selected
      if (sessionDuration > 0 && selectedHabit) {
        onSessionComplete(sessionDuration, selectedHabit);
        setSeconds(0); // Reset timer after recording
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="ios-card w-full p-6 flex flex-col items-center">
        <h2 className="text-2xl font-semibold mb-4">Focus Time</h2>
        
        <div className="w-full mb-6">
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
        
        <div className="text-6xl font-extralight my-8">{formatTime(seconds)}</div>
        
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
