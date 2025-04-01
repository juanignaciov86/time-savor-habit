import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabaseClient } from '../utils/supabaseClient';
import { Plus, Trash, Edit, Check, X, Wifi, WifiOff } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Habit, 
  getHabits, 
  addHabit, 
  updateHabit, 
  deleteHabit,
  initializeSupabaseSync
} from '../utils/habitUtils';
import { getStoredHabits, registerConnectivityListeners, isOnline } from '../utils/offlineStorage';

const HabitsPage: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>(getStoredHabits());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#007AFF'
  });
  const [isOnlineState, setIsOnlineState] = useState(isOnline());
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Load habits and initialize sync
  useEffect(() => {
    const loadHabits = async () => {
      try {
        setIsSyncing(true);
        
        // Always start with stored habits for immediate display
        const storedHabits = getStoredHabits();
        setHabits(storedHabits);
        
        // If we're offline, just use stored habits
        if (!isOnline()) {
          console.log('Offline mode: using stored habits');
          return;
        }
        
        // Try to sync with Supabase
        try {
          await initializeSupabaseSync();
          const habitsList = await getHabits();
          setHabits(habitsList);
          toast({
            title: "Sync Complete",
            description: "Your habits have been synchronized with the server",
            variant: "default"
          });
        } catch (error) {
          if (!error.message.includes('network')) {
            toast({
              title: "Sync Error",
              description: "Using cached data. Changes will sync when back online.",
              variant: "default"
            });
          }
        }
      } catch (error) {
        console.error('Error loading habits:', error);
      } finally {
        setIsSyncing(false);
      }
    };
    
    // Set up online/offline listeners
    const cleanup = registerConnectivityListeners({
      onOnline: () => {
        setIsOnlineState(true);
        loadHabits(); // Sync when coming back online
        toast({
          title: "Back Online",
          description: "Syncing your changes..."
        });
      },
      onOffline: () => {
        setIsOnlineState(false);
        toast({
          title: "Offline Mode",
          description: "Changes will be saved locally and synced when back online."
        });
      }
    });

    // Initial load - always load, even if offline
    loadHabits();
    
    // Check initial online status
    setIsOnlineState(isOnline());
    
    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        await loadHabits();
      }
    });

    return () => {
      cleanup();
      subscription.unsubscribe();
    };
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#007AFF' });
    setEditingId(null);
    setShowForm(false);
  };

  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    
    try {
      if (editingId) {
        // Update existing habit
        const updatedHabit = await updateHabit(editingId, formData);
        if (updatedHabit) {
          setHabits(habits.map(h => h.id === editingId ? updatedHabit : h));
          toast({
            title: "Habit updated",
            description: `${updatedHabit.name} has been updated.`
          });
        }
      } else {
        // Add new habit
        const newHabit = await addHabit(formData);
        setHabits([...habits, newHabit]);
        toast({
          title: "Habit added",
          description: `${newHabit.name} has been added.`
        });
      }
    } catch (error) {
      console.error("Error saving habit:", error);
      toast({
        title: "Error",
        description: "Failed to save habit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
      resetForm();
    }
  };

  // Handle edit
  const handleEdit = (habit: Habit) => {
    setFormData({
      name: habit.name,
      description: habit.description,
      color: habit.color
    });
    setEditingId(habit.id);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    setIsSyncing(true);
    try {
      const success = await deleteHabit(id);
      if (success) {
        setHabits(habits.filter(h => h.id !== id));
        toast({
          title: "Habit deleted",
          description: "The habit has been removed."
        });
      }
    } catch (error) {
      console.error("Error deleting habit:", error);
      toast({
        title: "Error",
        description: "Failed to delete habit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Layout>
      <header className="mb-6 flex items-center gap-4">
        <img src="/logo.svg" alt="Time Savor Logo" className="w-12 h-12" />
        <div>
          <h1 className="text-3xl font-bold">Habits</h1>
          <p className="text-ios-gray">Manage your habits</p>
        </div>
      </header>
      
      {/* Add Button */}
      <div className="mb-6">
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center"
          variant={showForm ? "secondary" : "default"}
          disabled={isSyncing}
        >
          <Plus className="mr-1 h-4 w-4" /> Add Habit
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm ? (
        <div className="ios-card mb-6 p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Habit Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Reading"
                required
                disabled={isSyncing}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add some details about this habit"
                rows={3}
                disabled={isSyncing}
              />
            </div>
            
            <div>
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="color"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-12 h-10 p-1"
                  disabled={isSyncing}
                />
                <span className="text-ios-gray text-sm">
                  Choose a color for this habit
                </span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="flex items-center"
                disabled={isSyncing}
              >
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex items-center"
                disabled={isSyncing}
              >
                <Check className="mr-1 h-4 w-4" />
                {editingId ? "Update" : "Add"} Habit
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Connection Status */}
      <div className={`flex items-center justify-end mb-2 text-sm ${isOnlineState ? 'text-green-600' : 'text-orange-500'}`}>
        {isOnlineState ? (
          <div className="flex items-center gap-1">
            <Wifi className="h-4 w-4" />
            {isSyncing ? 'Syncing...' : 'Online'}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <WifiOff className="h-4 w-4" />
            Offline
          </div>
        )}
      </div>

      {/* Habits List */}
      <div className="space-y-4">
        {habits.length === 0 ? (
          <div className="ios-card p-6 text-center">
            <p className="text-ios-gray">No habits added yet. Create your first habit!</p>
          </div>
        ) : (
          habits.map(habit => (
            <div 
              key={habit.id} 
              className="ios-card p-4 flex justify-between items-center"
              style={{ borderLeft: `4px solid ${habit.color}` }}
            >
              <div>
                <h3 className="font-medium">{habit.name}</h3>
                {habit.description && (
                  <p className="text-sm text-ios-gray">{habit.description}</p>
                )}
              </div>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(habit)}
                  disabled={isSyncing}
                >
                  <Edit className="h-4 w-4 text-ios-gray" />
                </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isSyncing}
                      >
                        <Trash className="h-4 w-4 text-ios-gray" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Habit</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{habit.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(habit.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
    </Layout>
  );
};

export default HabitsPage;
