
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabaseClient } from '../utils/supabaseClient';
import { Plus, Trash, Edit, Check, X, Loader2 } from 'lucide-react';
import { 
  Habit, 
  getHabits, 
  addHabit, 
  updateHabit, 
  deleteHabit,
  initializeSupabaseSync
} from '../utils/habitUtils';

const HabitsPage: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#007AFF'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load habits and initialize sync
  useEffect(() => {
    const loadHabits = async () => {
      try {
        setIsLoading(true);
        // Initialize Supabase sync
        await initializeSupabaseSync();
        
        // Load habits from Supabase
        const habitsList = await getHabits();
        setHabits(habitsList);
      } catch (error) {
        console.error('Error loading habits:', error);
        toast({
          title: "Error",
          description: "Failed to load habits. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadHabits();
    
    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN') {
          // Reload habits after sign-in
          const habitsList = await getHabits();
          setHabits(habitsList);
        }
      }
    );
    
    // Cleanup subscription
    return () => {
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
    setIsLoading(true);
    
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
      setIsLoading(false);
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
    if (window.confirm('Are you sure you want to delete this habit?')) {
      setIsLoading(true);
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
        setIsLoading(false);
      }
    }
  };

  return (
    <Layout>
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Habits</h1>
        <p className="text-ios-gray">Manage your habits</p>
      </header>
      
      {/* Add Button */}
      <div className="mb-6">
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center"
          variant={showForm ? "secondary" : "default"}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />} Add Habit
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                  disabled={isLoading}
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
                disabled={isLoading}
              >
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex items-center"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                {editingId ? "Update" : "Add"} Habit
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Loading State */}
      {isLoading && habits.length === 0 && (
        <div className="ios-card p-6 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading habits...</span>
        </div>
      )}

      {/* Habits List */}
      {!isLoading && (
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
                    disabled={isLoading}
                  >
                    <Edit className="h-4 w-4 text-ios-gray" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(habit.id)}
                    disabled={isLoading}
                  >
                    <Trash className="h-4 w-4 text-ios-gray" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Layout>
  );
};

export default HabitsPage;
