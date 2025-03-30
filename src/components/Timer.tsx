
import React, { useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { formatTime } from '../utils/timeUtils';
import { Button } from '@/components/ui/button';

interface TimerProps {
  onSessionComplete: (duration: number) => void;
}

const Timer: React.FC<TimerProps> = ({ onSessionComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

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
    if (!isRunning) {
      // Starting the timer
      setStartTime(Date.now());
      setIsRunning(true);
    } else {
      // Stopping the timer
      setIsRunning(false);
      const sessionDuration = seconds;
      
      // Only record if we've tracked some time
      if (sessionDuration > 0) {
        onSessionComplete(sessionDuration);
        setSeconds(0); // Reset timer after recording
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="ios-card w-full p-6 flex flex-col items-center">
        <h2 className="text-2xl font-semibold mb-2">Focus Time</h2>
        <div className="text-6xl font-extralight my-8">{formatTime(seconds)}</div>
        
        <Button 
          onClick={toggleTimer}
          className={`rounded-full h-16 w-16 flex items-center justify-center transition-colors
            ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-ios-blue hover:bg-blue-700'}`}
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
        {isRunning 
          ? "Focus on your habit. Tap to stop when you're done." 
          : "Tap the button to start tracking your habit time."
        }
      </p>
    </div>
  );
};

export default Timer;
