import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { PhaseCard, Phase, PhaseStatus } from "@/app/components/PhaseCard";
import { PhaseDetails } from "@/app/components/PhaseDetails";
import { AddProjectDialog } from "@/app/components/AddProjectDialog";
import { AddPhaseDialog } from "@/app/components/AddPhaseDialog";
import { Task } from "@/app/components/TaskItem";
import { Button } from "@/app/components/ui/button";
import { Plus, ChevronRight, FolderKanban } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface PhaseWithTasks extends Phase {
  tasks: Task[];
}

export default function App() {
  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string>("1");

  // Phases and tasks state
  const [phases, setPhases] = useState<PhaseWithTasks[]>([]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, phasesData] = await Promise.all([
          api.getProjects(),
          api.getPhases(),
        ]);
        setProjects(projectsData);
        if (projectsData.length > 0 && currentProjectId === "1") {
          setCurrentProjectId(projectsData[0].id);
        }
        setPhases(phasesData);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    loadData();
  }, []);

  // Dialog states
  const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);
  const [addPhaseDialogOpen, setAddPhaseDialogOpen] = useState(false);

  // Phase details state
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [phaseDetailsOpen, setPhaseDetailsOpen] = useState(false);

  // Get current project
  const currentProject = projects.find((p) => p.id === currentProjectId);

  // Calculate phase progress and status
  const calculatePhaseMetrics = (tasks: Task[]) => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    let status: PhaseStatus = "not-started";
    if (completedTasks === totalTasks && totalTasks > 0) {
      status = "completed";
    } else if (completedTasks > 0) {
      status = "in-progress";
    }

    return { progress, status, completedTasks, totalTasks };
  };

  // Update phase metrics
  const updatePhaseMetrics = (phaseId: string) => {
    setPhases((prevPhases) =>
      prevPhases.map((phase) => {
        if (phase.id === phaseId) {
          const metrics = calculatePhaseMetrics(phase.tasks);
          return {
            ...phase,
            progress: metrics.progress,
            status: metrics.status,
            taskCount: metrics.totalTasks,
            completedTaskCount: metrics.completedTasks,
          };
        }
        return phase;
      })
    );
  };

  // Handlers
  const handleAddProject = async (projectName: string) => {
    try {
      const newProject = await api.createProject({
        name: projectName
      });
      setProjects([...projects, newProject]);
      if (currentProjectId === "1") setCurrentProjectId(newProject.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPhase = async (phaseName: string) => {
    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const newPhase = {
      name: phaseName,
      progress: 0,
      status: "not-started" as PhaseStatus,
      taskCount: 0,
      completedTaskCount: 0,
      tasks: [],
    };

    setPhases([...phases, { ...newPhase, id: tempId } as any]);

    try {
      const savedPhase = await api.createPhase(newPhase);
      // Replace temp phase with real one
      setPhases(prev => prev.map(p => p.id === tempId ? savedPhase : p));
    } catch (e) {
      console.error(e);
      // Revert on error
      setPhases(prev => prev.filter(p => p.id !== tempId));
    }
  };

  const handlePhaseNameChange = async (phaseId: string, newName: string) => {
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;

    // Optimistic update
    setPhases((prevPhases) =>
      prevPhases.map((p) =>
        p.id === phaseId ? { ...p, name: newName } : p
      )
    );

    try {
      await api.updatePhase(phaseId, { name: newName });
    } catch (e) {
      console.error(e);
      // Revert if needed, simply reloading for now simpler
    }
  };

  const handlePhaseClick = (phaseId: string) => {
    setSelectedPhaseId(phaseId);
    setPhaseDetailsOpen(true);
  };

  const handleToggleTask = async (taskId: string) => {
    if (!selectedPhaseId) return;

    const phase = phases.find(p => p.id === selectedPhaseId);
    if (!phase) return;

    const updatedTasks = phase.tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const metrics = calculatePhaseMetrics(updatedTasks);

    const updatedPhase = {
      ...phase,
      tasks: updatedTasks,
      progress: metrics.progress,
      status: metrics.status,
      taskCount: metrics.totalTasks,
      completedTaskCount: metrics.completedTasks
    };

    // Optimistic update
    setPhases(prev => prev.map(p => p.id === selectedPhaseId ? updatedPhase : p));

    try {
      await api.updatePhase(selectedPhaseId, updatedPhase);
    } catch (e) { console.error(e); }
  };

  const handleAddTask = async (taskName: string, dueDate?: string) => {
    if (!selectedPhaseId) return;

    const phase = phases.find(p => p.id === selectedPhaseId);
    if (!phase) return;

    const tempTaskId = `temp-task-${Date.now()}`;
    const newTask: Task = {
      id: tempTaskId,
      name: taskName,
      completed: false,
      dueDate, // Pass through, API service handles casing mapping if needed
    };

    // UI Update - add task locally first
    const updatedTasks = [...phase.tasks, newTask];
    const metrics = calculatePhaseMetrics(updatedTasks);
    // ... update logic common to toggle

    const updatedPhase = {
      ...phase,
      tasks: updatedTasks,
      ...metrics
    };

    setPhases((prev) => prev.map(p => p.id === selectedPhaseId ? updatedPhase : p));

    try {
      // Sync entire phase state including new task
      await api.updatePhase(selectedPhaseId, updatedPhase);
      // Ideally we should reload the phase to get the real Task ID back
      // But for plain MVP, simply reloading payload works or accepting eventual consistency
      const freshPhases = await api.getPhases();
      setPhases(freshPhases);
    } catch (e) { console.error(e); }
  };

  const handleDeletePhase = async () => {
    if (!selectedPhaseId) return;

    const idToDelete = selectedPhaseId;
    setPhases((prevPhases) => prevPhases.filter((phase) => phase.id !== idToDelete));
    setPhaseDetailsOpen(false);
    setSelectedPhaseId(null);

    try {
      await api.deletePhase(idToDelete);
    } catch (e) { console.error(e); }
  };

  const selectedPhase = phases.find((p) => p.id === selectedPhaseId) || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <FolderKanban className="w-6 h-6 text-white" />
              </div>
              <div>
                {currentProject?.name || "RBH tracker"}
              </h1>
              <p className="text-sm text-gray-500">
                Track your project phases and tasks
              </p>
            </div>
          </div>
          <Button onClick={() => setAddProjectDialogOpen(true)} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Add Project
          </Button>
        </div>
    </div>
      </header >

    {/* Main Content */ }
    < main className = "max-w-7xl mx-auto px-6 py-8" >
      <div className="space-y-6">
        {/* Phases Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Project Phases
            </h2>
            <Button
              variant="outline"
              onClick={() => setAddPhaseDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Phase
            </Button>
          </div>

          {/* Phase Flow */}
          <div className="relative">
            <div className="flex items-center gap-4 overflow-x-auto pb-4 group">
              {phases.map((phase, index) => (
                <div key={phase.id} className="flex items-center gap-4 group">
                  <PhaseCard
                    phase={phase}
                    onClick={() => handlePhaseClick(phase.id)}
                    onNameChange={handlePhaseNameChange}
                  />
                  {index < phases.length - 1 && (
                    <ChevronRight className="w-6 h-6 text-gray-300 flex-shrink-0" />
                  )}
                </div>
              ))}

              {/* Add Phase Card */}
              <button
                onClick={() => setAddPhaseDialogOpen(true)}
                className="min-w-[280px] h-[200px] flex-shrink-0 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-600 group"
              >
                <Plus className="w-8 h-8" />
                <span className="font-medium">Add New Phase</span>
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {phases.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FolderKanban className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No phases yet
            </h3>
            <p className="text-gray-500 mb-6">
              Get started by adding your first project phase
            </p>
            <Button onClick={() => setAddPhaseDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Phase
            </Button>
          </div>
        )}
      </div>
      </main >

    {/* Dialogs */ }
    < AddProjectDialog
  open = { addProjectDialogOpen }
  onClose = {() => setAddProjectDialogOpen(false)
}
onAdd = { handleAddProject }
  />

      <AddPhaseDialog
        open={addPhaseDialogOpen}
        onClose={() => setAddPhaseDialogOpen(false)}
        onAdd={handleAddPhase}
      />

      <PhaseDetails
        open={phaseDetailsOpen}
        onClose={() => setPhaseDetailsOpen(false)}
        phase={selectedPhase}
        tasks={selectedPhase?.tasks || []}
        onToggleTask={handleToggleTask}
        onAddTask={handleAddTask}
        onDeletePhase={handleDeletePhase}
      />
    </div >
  );
}
