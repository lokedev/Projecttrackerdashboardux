import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { TaskItem, Task } from "@/app/components/TaskItem";
import { Plus, Trash2, ChevronUp } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Phase } from "@/app/components/PhaseCard";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface PhaseExpandedViewProps {
    phase: Phase;
    projectPhases: Phase[];
    tasks: Task[];
    onClose: () => void;
    onToggleTask: (taskId: string) => void;
    onAddTask: (taskName: string, dueDate?: string) => void;
    onDeletePhase: () => void;
    onEditTask: (taskId: string, newName: string) => void;
    onDeleteTask: (taskId: string) => void;
    onMoveTask: (taskId: string, targetPhaseId: string) => void;
    onAddSubtask: (taskId: string, name: string) => void;
    onToggleSubtask: (subtaskId: string, taskId: string) => void;
    onDeleteSubtask: (subtaskId: string, taskId: string) => void;
}

const statusConfig = {
    "not-started": { label: "Not Started", className: "bg-gray-100 text-gray-700" },
    "in-progress": { label: "In Progress", className: "bg-blue-100 text-blue-700" },
    completed: { label: "Completed", className: "bg-green-100 text-green-700" },
};

export function PhaseExpandedView({
    phase,
    projectPhases,
    tasks,
    onClose,
    onToggleTask,
    onAddTask,
    onDeletePhase,
    onEditTask,
    onDeleteTask,
    onMoveTask,
    onAddSubtask,
    onToggleSubtask,
    onDeleteSubtask,
}: PhaseExpandedViewProps) {
    const [newTaskName, setNewTaskName] = useState("");
    const [newTaskDate, setNewTaskDate] = useState("");
    const viewRef = useRef<HTMLDivElement>(null);

    // Scroll to this view when it opens
    useEffect(() => {
        if (viewRef.current) {
            viewRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [phase.id]);

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

    const statusInfo = statusConfig[phase.status] || statusConfig["not-started"];

    return (
        <div ref={viewRef} className="w-full mt-6 mb-8 border border-blue-200 rounded-xl bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{phase.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">Phase Details & Tasks</p>
                </div>
                <Button variant="outline" size="sm" onClick={onClose} className="text-gray-500 hover:text-gray-900">
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Collapse
                </Button>
            </div>

            <div className="p-6 space-y-8">
                {/* Progress Summary */}
                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-gray-500 block">Status</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Current Phase</span>
                                <Badge className={`${statusInfo.className} rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold border-0`}>
                                    {statusInfo.label}
                                </Badge>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-blue-600 tabular-nums">{phase.progress}%</span>
                            <span className="text-xs text-blue-400 font-medium block uppercase tracking-wide">Progress</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Progress value={phase.progress} className="h-3 bg-blue-100" indicatorClassName="bg-gray-900" />
                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                            <span>{phase.completedTaskCount} tasks completed</span>
                            <span>{phase.taskCount} total</span>
                        </div>
                    </div>
                </div>

                {/* Tasks Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 text-lg">Tasks</h3>
                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-md text-gray-600">{tasks.length} tasks</span>
                    </div>

                    <div className="grid gap-2">
                        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                            {tasks.length === 0 ? (
                                <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                                    <p className="text-sm text-gray-500">No tasks defined yet.</p>
                                </div>
                            ) : (
                                tasks.map((task) => (
                                    <TaskItem
                                        key={task.id}
                                        task={{ ...task, phase_id: phase.id }} // Ensure phase_id is passed
                                        onToggle={onToggleTask}
                                        onEdit={onEditTask}
                                        onDelete={onDeleteTask}
                                        onAddSubtask={onAddSubtask}
                                        onToggleSubtask={(sid) => onToggleSubtask(sid, task.id)}
                                        onDeleteSubtask={(sid) => onDeleteSubtask(sid, task.id)}
                                    />
                                ))
                            )}
                        </SortableContext>
                    </div>

                    {/* Quick Add Task */}
                    <div className="flex items-center gap-2 pt-2">
                        <Input
                            placeholder="Add a new task..."
                            value={newTaskName}
                            onChange={(e) => setNewTaskName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="bg-gray-50 border-transparent focus:bg-white transition-colors"
                        />
                        {newTaskName && (
                            <Input
                                type="date"
                                value={newTaskDate}
                                onChange={(e) => setNewTaskDate(e.target.value)}
                                className="w-40 bg-gray-50 border-transparent focus:bg-white"
                            />
                        )}
                        <Button onClick={handleAddTask} disabled={!newTaskName.trim()} size="icon" className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onDeletePhase}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Phase
                    </Button>
                </div>
            </div>
        </div>
    );
}
