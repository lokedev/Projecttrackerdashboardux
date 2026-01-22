import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Check, Pencil } from "lucide-react";

export type PhaseStatus = "not-started" | "in-progress" | "completed";

export interface Phase {
  id: string;
  name: string;
  progress: number;
  status: PhaseStatus;
  taskCount: number;
  completedTaskCount: number;
}

interface PhaseCardProps {
  phase: Phase;
  onClick: () => void;
  onNameChange: (id: string, name: string) => void;
}

const statusConfig = {
  "not-started": { label: "Not Started", className: "bg-gray-100 text-gray-700" },
  "in-progress": { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700" },
};

export function PhaseCard({ phase, onClick, onNameChange, listeners }: PhaseCardProps & { listeners?: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(phase.name);

  const handleSaveName = () => {
    if (editName.trim()) {
      onNameChange(phase.id, editName.trim());
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setEditName(phase.name);
      setIsEditing(false);
    }
  };

  const statusInfo = statusConfig[phase.status];

  // Progress Background Style
  const progressStyle = {
    background: `linear-gradient(to right, #eff6ff ${phase.progress}%, white ${phase.progress}%)`,
    // Alternative: if you want a subtle fill:
    // background: `linear-gradient(to right, rgba(59, 130, 246, 0.1) ${phase.progress}%, white ${phase.progress}%)`
  };

  return (
    <Card
      className="p-4 hover:shadow-md transition-all cursor-pointer border border-gray-200 min-w-[220px] max-w-[220px] flex-shrink-0 relative overflow-hidden group select-none"
      style={progressStyle}
      onClick={(e) => {
        if (!isEditing) {
          onClick();
        }
      }}
      {...listeners} // Apply drag start listeners to the card itself if undesired, usually handle should be separate but user asked to drag phases. 
    // BETTER: Drag handle or whole card? Usually drag handle is safer for "Editable".
    // Let's assume whole card dragging relies on listeners passed from parent, but we might conflict with click. 
    // Actually, for dnd-kit sortable, we usually attach listeners to a handle or the root. 
    // If we attach to root, we need to prevent drag on input.
    >
      <div className="space-y-3 relative z-10">
        {/* Phase Name & Edit */}
        <div className="flex items-start justify-between gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on input
                className="h-7 text-sm px-1"
                autoFocus
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveName();
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Check className="w-3 h-3 text-green-600" />
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-gray-900 flex-1 leading-tight break-words">
                {phase.name}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-1 hover:bg-gray-100/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="w-3 h-3 text-gray-400" />
              </button>
            </>
          )}
        </div>

        {/* Status Badge & Metrics */}
        <div className="flex items-center justify-between">
          <Badge className={`${statusInfo.className} rounded-full px-2 py-0 text-[10px] uppercase tracking-wide border-0`}>
            {statusInfo.label}
          </Badge>
          <span className="text-xs font-bold text-gray-600">
            {phase.progress}%
          </span>
        </div>

        <div className="text-[10px] text-gray-400 font-medium">
          {phase.completedTaskCount} / {phase.taskCount} tasks
        </div>
      </div>

      {/* Bottom Progress Bar (10% height, dark color) */}
      <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-gray-100">
        <div
          className="h-full bg-slate-800 transition-all duration-500 ease-out"
          style={{ width: `${phase.progress}%` }}
        />
      </div>
    </Card>
  );
}
