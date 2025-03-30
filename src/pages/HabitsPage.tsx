
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash, Edit, Check, X } from 'lucide-react';
import { Habit, getHabits, addHabit, updateHabit, deleteHabit } from '../utils/habitUtils';

const HabitsPage: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#007AFF'
  });
  const { toast } = useToast();

  // Load habits
  useEffect(() => {
    setHabits(getHabits());
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // Update existing habit
      const updatedHabit = updateHabit(editingId, formData);
      if (updatedHabit) {
        setHabits(habits.map(h => h.id === editingId ? updatedHabit : h));
        toast({
          title: "Habit updated",
          description: `${updatedHabit.name} has been updated.`
        });
      }
    } else {
      // Add new habit
      const newHabit = addHabit(formData);
      setHabits([...habits, newHabit]);
      toast({
        title: "Habit added",
        description: `${newHabit.name} has been added.`
      });
    }
    
    resetForm();
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
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      const success = deleteHabit(id);
      if (success) {
        setHabits(habits.filter(h => h.id !== id));
        toast({
          title: "Habit deleted",
          description: "The habit has been removed."
        });
      }
    }
  };

  return (
    <Layout>
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Habits</h1>
        <p className="text-ios-gray">Manage your habits</p>
      </header>

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
              >
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" className="flex items-center">
                <Check className="mr-1 h-4 w-4" />
                {editingId ? "Update" : "Add"} Habit
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <Button
          onClick={() => setShowForm(true)}
          className="mb-6 flex items-center"
        >
          <Plus className="mr-1 h-4 w-4" /> Add New Habit
        </Button>
      )}

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
                >
                  <Edit className="h-4 w-4 text-ios-gray" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(habit.id)}
                >
                  <Trash className="h-4 w-4 text-ios-gray" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
};

export default HabitsPage;
