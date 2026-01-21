import { Checkbox } from "@/app/components/ui/checkbox";
import { Calendar, Pencil, Trash2, Check, X, GripVertical, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface Subtask {
  id: string;
  name: string;
  completed: boolean;
  position?: number;
}

export interface Task {
  id: string;
  name: string;
  completed: boolean;
  dueDate?: string;
  phase_id?: string;
  position?: number;
  subtasks?: Subtask[];
}

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (id: string, newName: string) => void;
  onDelete: (id: string) => void;

  // Subtask Handlers
  onAddSubtask: (taskId: string, name: string) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
}

export function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(task.name);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const startEdit = () => {
    setEditedName(task.name);
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (editedName.trim()) {
      onEdit(task.id, editedName.trim());
      setIsEditing(false);
    }
  };

  const cancelEdit = () => {
    setEditedName(task.name);
    setIsEditing(false);
  };

  const handleAddSubtaskSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newSubtaskName.trim()) {
      onAddSubtask(task.id, newSubtaskName.trim());
      setNewSubtaskName("");
      setIsAddingSubtask(false);
      setIsExpanded(true); // Ensure expanded to see new item
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col rounded-lg transition-all border border-transparent hover:border-gray-200 ${isDragging ? 'bg-blue-50 border-blue-200 z-50' : 'bg-white/80 hover:bg-white'}`}
    >
      <div className="flex items-start gap-3 py-2 px-3 group">
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="mt-1.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500">
          <GripVertical className="w-4 h-4" />
        </div>

        <Checkbox
          id={task.id}
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          className="mt-1"
        />

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); else if (e.key === 'Escape') cancelEdit(); }}
              />
              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={saveEdit}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={cancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <label
                  htmlFor={task.id}
                  className={`block text-sm cursor-pointer transition-all ${task.completed
                      ? "line-through text-gray-400"
                      : "text-gray-700 font-medium"
                    }`}
                >
                  {task.name}
                </label>
                {/* Expand Toggle */}
                {(task.subtasks && task.subtasks.length > 0 || isAddingSubtask) && (
                  <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-400 hover:text-blue-600">
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {task.dueDate && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{task.dueDate}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions (visible on hover) */}
        {!isEditing && (
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-blue-600" onClick={() => setIsAddingSubtask(true)} title="Add Subtask">
              <Plus className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-blue-600" onClick={startEdit} title="Edit Task">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={() => onDelete(task.id)} title="Delete Task">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Subtasks List */}
      {(isExpanded || isAddingSubtask) && (
        <div className="pl-12 pr-4 pb-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
          {task.subtasks?.map(subtask => (
            <div key={subtask.id} className="flex items-center gap-2 group/sub">
              <Checkbox
                id={subtask.id}
                checked={subtask.completed}
                onCheckedChange={() => onToggleSubtask(subtask.id)}
                className="h-3.5 w-3.5 border-gray-300 data-[state=checked]:bg-gray-400 data-[state=checked]:border-gray-400"
              />
              <span className={`text-xs ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>{subtask.name}</span>
              <button
                onClick={() => onDeleteSubtask(subtask.id)}
                className="ml-auto opacity-0 group-hover/sub:opacity-100 text-gray-300 hover:text-red-400 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Add Subtask Input */}
          {isAddingSubtask && (
            <form onSubmit={handleAddSubtaskSubmit} className="flex items-center gap-2 mt-2">
              <Input
                value={newSubtaskName}
                onChange={e => setNewSubtaskName(e.target.value)}
                placeholder="Subtask name..."
                className="h-7 text-xs bg-gray-50/50"
                autoFocus
                onBlur={() => !newSubtaskName && setIsAddingSubtask(false)}
              />
              <Button type="submit" size="sm" variant="ghost" className="h-7 px-2 text-xs">Add</Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
