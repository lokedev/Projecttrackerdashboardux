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

export function PhaseCard({ phase, onClick, onNameChange }: PhaseCardProps) {
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

  return (
    <Card
      className="p-5 hover:shadow-lg transition-all cursor-pointer border border-gray-200 bg-white min-w-[280px] flex-shrink-0"
      onClick={(e) => {
        if (!isEditing) {
          onClick();
        }
      }}
    >
      <div className="space-y-4">
        {/* Phase Name */}
        <div className="flex items-center justify-between gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="h-8 text-base"
                autoFocus
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveName();
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Check className="w-4 h-4 text-green-600" />
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900 flex-1">
                {phase.name}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-1.5 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="w-4 h-4 text-gray-500" />
              </button>
            </>
          )}
        </div>

        {/* Status Badge */}
        <Badge className={`${statusInfo.className} rounded-full px-3 py-0.5 text-xs`}>
          {statusInfo.label}
        </Badge>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={phase.progress} className="h-2" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-2xl font-bold text-gray-900">
              {phase.progress}%
            </span>
            <span className="text-gray-500">
              {phase.completedTaskCount} / {phase.taskCount} tasks
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
