
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  getWeeklyStats, 
  getMonthlyStats, 
  getDailyTotal 
} from '../utils/storageUtils';
import { formatDuration, formatDate } from '../utils/timeUtils';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { getHabits, getHabitsSync, Habit } from '../utils/habitUtils';

const Stats: React.FC = () => {
  const [dailyTotal, setDailyTotal] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState<{ date: number, duration: number }[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<{ date: number, duration: number }[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch available habits synchronously first
    const initialHabits = getHabitsSync();
    setHabits(initialHabits);
    
    // Then get from database asynchronously
    getHabits().then(dbHabits => {
      setHabits(dbHabits);
    }).catch(error => {
      console.error("Error loading habits:", error);
    });
    
    // Load stats for all habits initially
    updateStats(null);
  }, []);

  // Update stats when selected habit changes
  const updateStats = (habitId: string | null) => {
    setSelectedHabit(habitId);
    setDailyTotal(getDailyTotal(habitId || undefined));
    setWeeklyStats(getWeeklyStats(habitId || undefined));
    setMonthlyStats(getMonthlyStats(habitId || undefined));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="ios-card p-2 text-xs">
          <p className="font-medium">{formatDate(label)}</p>
          <p className="text-ios-blue">{formatDuration(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="ios-card p-4">
        <Select
          value={selectedHabit || "all-habits"}
          onValueChange={(value) => updateStats(value === "all-habits" ? null : value)}
        >
          <SelectTrigger className="w-full mb-3">
            <SelectValue placeholder="All Habits" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-habits">All Habits</SelectItem>
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

      <div className="ios-card p-6">
        <h2 className="text-xl font-semibold mb-4">Today's Focus Time</h2>
        <p className="text-4xl font-light text-center">{formatDuration(dailyTotal)}</p>
      </div>
      
      <div className="ios-card p-4">
        <Tabs defaultValue="weekly">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly" className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="date"
                  tickFormatter={(tick: any) => {
                    const date = new Date(tick);
                    return date.toLocaleDateString('en-US', { weekday: 'short' });
                  }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="duration" fill="#007AFF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="monthly" className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="date"
                  tickFormatter={(tick: any) => {
                    const date = new Date(tick);
                    return date.getDate().toString();
                  }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="duration" fill="#007AFF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Stats;
