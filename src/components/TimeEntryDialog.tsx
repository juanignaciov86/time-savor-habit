import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Habit } from '../utils/habitUtils';
import { HabitSession } from '../utils/storageUtils';

interface TimeEntryDialogProps {
  habits: Habit[];
  onSave: (session: Omit<HabitSession, 'id'>) => void;
  trigger?: React.ReactNode;
  defaultValues?: Partial<HabitSession>;
  title?: string;
}

export const TimeEntryDialog: React.FC<TimeEntryDialogProps> = ({
  habits,
  onSave,
  trigger,
  defaultValues,
  title = "Add Time Entry"
}) => {
  const [open, setOpen] = React.useState(defaultValues !== undefined);
  const [selectedHabit, setSelectedHabit] = React.useState(defaultValues?.habitId || "");

  // Update state when defaultValues changes
  React.useEffect(() => {
    if (defaultValues) {
      setOpen(true);
      setSelectedHabit(defaultValues.habitId);
      setHours(Math.floor(defaultValues.duration / 3600));
      setMinutes(Math.floor((defaultValues.duration % 3600) / 60));
      const startDate = new Date(defaultValues.startTime);
      setDate(startDate.toISOString().split('T')[0]);
      setTime(startDate.toTimeString().slice(0, 5));
    }
  }, [defaultValues]);
  const [hours, setHours] = React.useState(
    defaultValues ? Math.floor(defaultValues.duration / 3600) : 0
  );
  const [minutes, setMinutes] = React.useState(
    defaultValues ? Math.floor((defaultValues.duration % 3600) / 60) : 0
  );
  const [date, setDate] = React.useState(
    defaultValues?.startTime
      ? new Date(defaultValues.startTime).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [time, setTime] = React.useState(
    defaultValues?.startTime
      ? new Date(defaultValues.startTime).toTimeString().slice(0, 5)
      : new Date().toTimeString().slice(0, 5)
  );

  const handleSave = () => {
    const startTime = new Date(date + 'T' + time).getTime();
    const duration = (hours * 3600) + (minutes * 60);
    const endTime = startTime + (duration * 1000);

    onSave({
      startTime,
      endTime,
      duration,
      habitId: selectedHabit
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Add Time Manually</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="habit">Habit</Label>
            <Select
              value={selectedHabit}
              onValueChange={setSelectedHabit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a habit" />
              </SelectTrigger>
              <SelectContent>
                {habits.map((habit) => (
                  <SelectItem key={habit.id} value={habit.id}>
                    {habit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Duration</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                  placeholder="Hours"
                />
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                  placeholder="Minutes"
                />
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Date & Time</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
