
import React, { useState, useEffect } from 'react';
import { getSessions, HabitSession } from '../utils/storageUtils';
import { formatDate, formatTime12Hour, formatDuration } from '../utils/timeUtils';

const History: React.FC = () => {
  const [sessions, setSessions] = useState<HabitSession[]>([]);

  useEffect(() => {
    // Get sessions and sort by most recent first
    const allSessions = getSessions().sort((a, b) => b.startTime - a.startTime);
    setSessions(allSessions);
  }, []);

  // Group sessions by date
  const groupedSessions = sessions.reduce((groups, session) => {
    const date = new Date(session.startTime).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {} as Record<string, HabitSession[]>);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">History</h2>
      
      {Object.keys(groupedSessions).length === 0 ? (
        <div className="ios-card p-6 text-center">
          <p className="text-ios-gray">No history recorded yet. Start tracking your habit!</p>
        </div>
      ) : (
        Object.entries(groupedSessions).map(([date, daySessions]) => (
          <div key={date} className="ios-card overflow-hidden">
            <div className="bg-ios-lightgray/30 px-4 py-2 font-medium">
              {formatDate(new Date(date).getTime())}
            </div>
            <div>
              {daySessions.map((session) => (
                <div 
                  key={session.id}
                  className="px-4 py-3 border-b last:border-b-0 border-ios-lightgray/50 flex justify-between items-center"
                >
                  <div>
                    <div className="text-sm">{formatTime12Hour(session.startTime)}</div>
                    <div className="text-xs text-ios-gray">Duration: {formatDuration(session.duration)}</div>
                  </div>
                  <div className="text-ios-blue font-medium">
                    {formatDuration(session.duration)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default History;
