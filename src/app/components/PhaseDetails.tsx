import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/app/components/ui/sheet";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { TaskItem, Task } from "@/app/components/TaskItem";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Phase } from "@/app/components/PhaseCard";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";

interface PhaseDetailsProps {
  open: boolean;
  onClose: () => void;
  phase: Phase | null;
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (taskName: string, dueDate?: string) => void;
  onDeletePhase: () => void;
}

const statusConfig = {
  "not-started": { label: "Not Started", className: "bg-gray-100 text-gray-700" },
  "in-progress": { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700" },
};

export function PhaseDetails({
  open,
  onClose,
  phase,
  tasks,
  onToggleTask,
  onAddTask,
  onDeletePhase,
}: PhaseDetailsProps) {
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");

  const handleAddTask = () => {
    if (newTaskName.trim()) {
      onAddTask(newTaskName.trim(), newTaskDate || undefined);
      setNewTaskName("");
      setNewTaskDate("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
  };

  if (!phase) return null;

  const statusInfo = statusConfig[phase.status];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[500px] w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">{phase.name}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Phase Overview */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <Badge className={`${statusInfo.className} rounded-full px-3 py-0.5 text-xs`}>
                {statusInfo.label}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="text-2xl font-bold text-gray-900">
                  {phase.progress}%
                </span>
              </div>
              <Progress value={phase.progress} className="h-2" />
              <p className="text-xs text-gray-500 text-right">
                {phase.completedTaskCount} of {phase.taskCount} tasks completed
              </p>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Tasks</h3>

            {/* Task List */}
            <div className="space-y-1">
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No tasks yet. Add your first task below!
                </p>
              ) : (
                tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={onToggleTask}
                  />
                ))
              )}
            </div>

            {/* Add Task Form */}
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <label className="text-sm font-medium text-gray-700">
                Add New Task
              </label>
              <Input
                placeholder="Task name"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Input
                type="date"
                placeholder="Due date (optional)"
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                onClick={handleAddTask}
                className="w-full"
                disabled={!newTaskName.trim()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>

          {/* Delete Phase */}
          <div className="pt-6 border-t border-gray-200">
            <Button
              variant="destructive"
              onClick={onDeletePhase}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Phase
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
