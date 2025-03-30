
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash, Edit, Check, X, Share, Download } from 'lucide-react';
import { 
  Habit, 
  getHabits, 
  addHabit, 
  updateHabit, 
  deleteHabit,
  exportHabits,
  importHabits
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
  const [importValue, setImportValue] = useState('');
  const [showImport, setShowImport] = useState(false);
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

  // Handle export
  const handleExport = () => {
    const data = exportHabits();
    
    // Create shareable content
    if (navigator.share) {
      navigator.share({
        title: 'Time Savor Habits',
        text: data
      }).catch(error => {
        console.log('Error sharing', error);
        copyToClipboard(data);
      });
    } else {
      copyToClipboard(data);
    }
  };
  
  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Data copied",
        description: "Habit data has been copied to clipboard"
      });
    }, 
    err => {
      console.error('Could not copy text: ', err);
    });
  };

  // Handle import
  const handleImport = () => {
    if (!importValue.trim()) {
      toast({
        title: "Import failed",
        description: "Please paste the habit data first",
        variant: "destructive"
      });
      return;
    }

    const success = importHabits(importValue);
    
    if (success) {
      // Reload habits
      setHabits(getHabits());
      setShowImport(false);
      setImportValue('');
      toast({
        title: "Import successful",
        description: "Your habits have been imported"
      });
    } else {
      toast({
        title: "Import failed",
        description: "Invalid data format",
        variant: "destructive"
      });
    }
  };

  return (
    <Layout>
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Habits</h1>
        <p className="text-ios-gray">Manage your habits</p>
      </header>
      
      {/* Import/Export Buttons */}
      <div className="flex justify-between mb-6">
        <div className="space-x-2">
          <Button 
            onClick={() => setShowForm(true)}
            className="flex items-center"
            variant={showForm ? "secondary" : "default"}
          >
            <Plus className="mr-1 h-4 w-4" /> Add Habit
          </Button>
        </div>
        <div className="space-x-2">
          <Button
            onClick={() => setShowImport(prev => !prev)}
            variant="outline"
            className="flex items-center"
          >
            <Download className="mr-1 h-4 w-4" /> Import
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            className="flex items-center"
          >
            <Share className="mr-1 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Import Form */}
      {showImport && (
        <div className="ios-card mb-6 p-4">
          <form onSubmit={(e) => { e.preventDefault(); handleImport(); }} className="space-y-4">
            <div>
              <Label htmlFor="importData">Paste Habit Data</Label>
              <Textarea
                id="importData"
                value={importValue}
                onChange={(e) => setImportValue(e.target.value)}
                placeholder="Paste the exported habit data here"
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowImport(false); setImportValue(''); }}
                className="flex items-center"
              >
                <X className="mr-1 h-4 w-4" /> Cancel
              </Button>
              <Button type="submit" className="flex items-center">
                <Check className="mr-1 h-4 w-4" /> Import
              </Button>
            </div>
          </form>
        </div>
      )}

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
      ) : null}

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
