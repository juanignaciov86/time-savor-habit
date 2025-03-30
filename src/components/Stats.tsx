
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  getWeeklyStats, 
  getMonthlyStats, 
  getDailyTotal 
} from '../utils/storageUtils';
import { formatDuration, formatDate } from '../utils/timeUtils';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';

const Stats: React.FC = () => {
  const [dailyTotal, setDailyTotal] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState<{ date: number, duration: number }[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<{ date: number, duration: number }[]>([]);
  
  useEffect(() => {
    // Fetch stats
    setDailyTotal(getDailyTotal());
    setWeeklyStats(getWeeklyStats());
    setMonthlyStats(getMonthlyStats());
  }, []);

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
                  tickFormatter={(tick) => {
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
                  tickFormatter={(tick) => {
                    const date = new Date(tick);
                    return date.getDate();
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
