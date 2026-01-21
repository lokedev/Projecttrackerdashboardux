import { Checkbox } from "@/app/components/ui/checkbox";
import { Calendar, Pencil, Trash2, ArrowRightLeft, Check, X, GripVertical } from "lucide-react";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface Task {
  id: string;
  name: string;
  completed: boolean;
  dueDate?: string;
  phase_id?: string;
  position?: number;
}

interface TaskItemProps {
  task: Task;
  phases: { id: string; name: string }[];
  onToggle: (id: string) => void;
  onEdit: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, targetPhaseId: string) => void;
}

export function TaskItem({ task, phases, onToggle, onEdit, onDelete, onMove }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(task.name);
  const [movePopoverOpen, setMovePopoverOpen] = useState(false);

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-3 py-2 px-3 rounded-lg transition-colors group border border-transparent hover:border-gray-100 ${isDragging ? 'bg-blue-50 border-blue-200 z-50' : 'bg-white hover:bg-gray-50'}`}
    >
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
          <>
            <label
              htmlFor={task.id}
              className={`block text-sm cursor-pointer transition-all ${task.completed
                  ? "line-through text-gray-400"
                  : "text-gray-700"
                }`}
            >
              {task.name}
            </label>
            {task.dueDate && (
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{task.dueDate}</span>
                {task.position !== undefined && <span className="text-[10px] text-gray-300">#{task.position}</span>}
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions (visible on hover) */}
      {!isEditing && (
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-blue-600" onClick={startEdit} title="Edit Task">
            <Pencil className="w-3.5 h-3.5" />
          </Button>

          <Popover open={movePopoverOpen} onOpenChange={setMovePopoverOpen}>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-orange-600" title="Move to another Phase">
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="end">
              <p className="text-xs font-semibold text-gray-500 mb-2 px-2">Move to Phase...</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {phases.filter(p => p.id !== task.phase_id).map(p => (
                  <button
                    key={p.id}
                    onClick={() => { onMove(task.id, p.id); setMovePopoverOpen(false); }}
                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded-md text-gray-700 truncate"
                  >
                    {p.name}
                  </button>
                ))}
                {phases.length <= 1 && (
                  <div className="text-xs text-gray-400 px-2 italic">No other phases available</div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={() => onDelete(task.id)} title="Delete Task">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
