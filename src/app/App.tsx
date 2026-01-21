import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { PhaseCard, Phase, PhaseStatus } from "@/app/components/PhaseCard";
import { PhaseDetails } from "@/app/components/PhaseDetails";
import { AddProjectDialog } from "@/app/components/AddProjectDialog";
import { AddPhaseDialog } from "@/app/components/AddPhaseDialog";
import { Task } from "@/app/components/TaskItem";
import { Button } from "@/app/components/ui/button";
import { Plus, ChevronRight, FolderKanban, ChevronsUpDown, Check } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/app/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover"
import { cn } from "@/lib/utils"

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
  const [openProjectSelect, setOpenProjectSelect] = useState(false);

  // Modern Gradient Background
  const gradientBg = "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-purple-900 to-slate-900";

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
      setProjects([...projects, newProject]);
      setCurrentProjectId(newProject.id); // Always switch to new project
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
    <div className={`min-h-screen ${gradientBg} text-white`}>
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                  <FolderKanban className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Project Tracker
                  </h1>
                  <p className="text-xs text-blue-200/80 font-medium">
                    Dashboard & Analytics
                  </p>
                </div>
              </div>

              {/* Project Selector */}
              <div className="h-8 w-px bg-white/10 mx-2" />

              <Popover open={openProjectSelect} onOpenChange={setOpenProjectSelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openProjectSelect}
                    className="w-[250px] justify-between bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
                  >
                    {currentProject?.name || "Select project..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0 bg-slate-900 border-slate-700">
                  <Command>
                    <CommandInput placeholder="Search project..." className="text-white" />
                    <CommandEmpty>No project found.</CommandEmpty>
                    <CommandGroup>
                      {projects.map((project) => (
                        <CommandItem
                          key={project.id}
                          value={project.name}
                          onSelect={() => {
                            setCurrentProjectId(project.id)
                            setOpenProjectSelect(false)
                          }}
                          className="text-white aria-selected:bg-white/10"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              currentProjectId === project.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {project.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Button
              onClick={() => setAddProjectDialogOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-lg shadow-blue-500/25"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white/90">
                {currentProject ? `${currentProject.name} Phases` : 'Select a Project'}
              </h2>
              <Button
                variant="secondary"
                onClick={() => setAddPhaseDialogOpen(true)}
                disabled={!currentProject}
                className="bg-white/10 hover:bg-white/20 text-white border-0"
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
            <div className="text-center py-24 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4 ring-1 ring-white/20">
                <FolderKanban className="w-8 h-8 text-white/40" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No phases yet
              </h3>
              <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                Get started by adding phases to track your project progress efficiently.
              </p>
              <Button onClick={() => setAddPhaseDialogOpen(true)} variant="secondary">
                <Plus className="w-4 h-4 mr-2" />
                Add First Phase
              </Button>
            </div>
          )}
        </div>
      </main >

      {/* Dialogs */}
      < AddProjectDialog
        open={addProjectDialogOpen}
        onClose={() => setAddProjectDialogOpen(false)
        }
        onAdd={handleAddProject}
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
