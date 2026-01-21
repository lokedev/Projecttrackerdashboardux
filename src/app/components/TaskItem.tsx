import { Checkbox } from "@/app/components/ui/checkbox";
import { Calendar } from "lucide-react";

export interface Task {
  id: string;
  name: string;
  completed: boolean;
  dueDate?: string;
}

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
}

export function TaskItem({ task, onToggle }: TaskItemProps) {
  return (
    <div className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors group">
      <Checkbox
        id={task.id}
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <label
          htmlFor={task.id}
          className={`block text-sm cursor-pointer transition-all ${
            task.completed
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
          </div>
        )}
      </div>
    </div>
  );
}
