
import React, { useState, useEffect } from 'react';
import { getSessions, HabitSession, updateSession, deleteSession } from '../utils/storageUtils';
import { formatDate, formatTime12Hour, formatDuration } from '../utils/timeUtils';
import { TimeEntryDialog } from './TimeEntryDialog';
import { getHabits, Habit } from '../utils/habitUtils';
import { Button } from './ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const History: React.FC = () => {
  const [sessions, setSessions] = useState<HabitSession[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [editingSession, setEditingSession] = useState<HabitSession | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get sessions and sort by most recent first
    const allSessions = getSessions().sort((a, b) => b.startTime - a.startTime);
    setSessions(allSessions);

    // Load habits
    getHabits().then(setHabits).catch(console.error);
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
                  <div className="flex items-center gap-2">
                    <div className="text-ios-blue font-medium">
                      {formatDuration(session.duration)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingSession(session)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (deleteSession(session.id)) {
                          setSessions(prev => prev.filter(s => s.id !== session.id));
                          toast({
                            title: "Session deleted",
                            description: "The session has been deleted successfully"
                          });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
      <TimeEntryDialog
        habits={habits}
        defaultValues={editingSession || undefined}
        title="Edit Time Entry"
        onSave={(updates) => {
          if (editingSession) {
            const updated = updateSession(editingSession.id, updates);
            if (updated) {
              setSessions(prev =>
                prev.map(s => s.id === editingSession.id ? updated : s)
                   .sort((a, b) => b.startTime - a.startTime)
              );
              setEditingSession(null);
              toast({
                title: "Session updated",
                description: "The session has been updated successfully"
              });
            }
          }
        }}
        trigger={<div style={{ display: 'none' }} />}
      />
      
    </div>
  );
};

export default History;
