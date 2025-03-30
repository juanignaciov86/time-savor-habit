
import React from 'react';
import Layout from '../components/Layout';
import Timer from '../components/Timer';
import { HabitSession, saveSession } from '../utils/storageUtils';
import { useToast } from '@/components/ui/use-toast';

const Index: React.FC = () => {
  const { toast } = useToast();

  const handleSessionComplete = (duration: number) => {
    // Create and save the session
    const endTime = Date.now();
    const startTime = endTime - (duration * 1000);
    
    const session: HabitSession = {
      id: `session-${Date.now()}`,
      startTime,
      endTime,
      duration,
    };
    
    saveSession(session);
    
    // Show toast notification
    toast({
      title: "Session recorded",
      description: `You focused for ${Math.floor(duration / 60)} minutes and ${duration % 60} seconds`,
    });
  };

  return (
    <Layout>
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Time Savor</h1>
        <p className="text-ios-gray">Track your habit time</p>
      </header>
      
      <Timer onSessionComplete={handleSessionComplete} />
    </Layout>
  );
};

export default Index;
