import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { PhaseCard, Phase, PhaseStatus } from "@/app/components/PhaseCard";
import { PhaseExpandedView } from "@/app/components/PhaseExpandedView";
import { AddProjectDialog } from "@/app/components/AddProjectDialog";
import { AddPhaseDialog } from "@/app/components/AddPhaseDialog";
import { Task } from "@/app/components/TaskItem";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Progress } from "@/app/components/ui/progress";
import { Plus, ChevronRight, FolderKanban, Pencil, Check, X, Building2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
}

interface PhaseWithTasks extends Phase {
  project_id?: string; // Add project_id to interface
  tasks: Task[];
}

export default function App() {
  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [phases, setPhases] = useState<PhaseWithTasks[]>([]);

  // UI State
  const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);
  const [addPhaseDialogOpen, setAddPhaseDialogOpen] = useState(false);
  const [targetProjectIdForPhase, setTargetProjectIdForPhase] = useState<string | null>(null);

  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState("");

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, phasesData] = await Promise.all([
          api.getProjects(),
          api.getPhases(),
        ]);
        setProjects(projectsData);
        setPhases(phasesData);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    loadData();
  }, []);

  // Background Style (Sketch + Gradient)
  // Simulating the "pencil sketch" texture with CSS patterns if image is not available
  const sketchTexture = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;

  // Handlers
  const handleAddProject = async (projectName: string) => {
    try {
      const newProject = await api.createProject({ name: projectName });
      setProjects([...projects, newProject]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProjectName = async (projectId: string) => {
    if (!editProjectName.trim()) return;

    // Optimistic
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name: editProjectName } : p));
    setEditingProjectId(null);

    try {
      await api.updateProject(projectId, editProjectName);
    } catch (e) {
      console.error(e);
    }
  };

  const startEditingProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditProjectName(project.name);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? All phases and tasks will be permanently removed.")) return;

    // Optimistic Update
    setProjects(prev => prev.filter(p => p.id !== projectId));

    try {
      await api.deleteProject(projectId);
    } catch (e) {
      console.error("Failed to delete project:", e);
      // Ideally revert state here if strict, but for MVP simpler to just log
    }
  };

  const handleOpenAddPhase = (projectId: string) => {
    setTargetProjectIdForPhase(projectId);
    setAddPhaseDialogOpen(true);
  };

  const handleAddPhase = async (phaseName: string) => {
    if (!targetProjectIdForPhase) return;

    const projectId = targetProjectIdForPhase;
    // Optimistic
    const tempId = `temp-${Date.now()}`;
    const newPhase = {
      name: phaseName,
      project_id: projectId,
      progress: 0,
      status: "not-started" as PhaseStatus,
      taskCount: 0,
      completedTaskCount: 0,
      tasks: [],
    };

    setPhases([...phases, { ...newPhase, id: tempId } as any]);

    try {
      const savedPhase = await api.createPhase({ ...newPhase, project_id: projectId });
      setPhases(prev => prev.map(p => p.id === tempId ? savedPhase : p));
    } catch (e) {
      console.error(e);
      setPhases(prev => prev.filter(p => p.id !== tempId));
    }
  };

  // ... (Other phase handlers same as before: handlePhaseNameChange, handleToggleTask, handleAddTask, handleDeletePhase)
  // Copied for brevity, relying on previous implementation logic but adapted for simpler state
  const handlePhaseNameChange = async (phaseId: string, newName: string) => {
    setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, name: newName } : p));
    await api.updatePhase(phaseId, { name: newName });
  };

  const calculateMetrics = (tasks: Task[]) => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    return {
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      status: (completed === total && total > 0) ? 'completed' : (completed > 0 ? 'in-progress' : 'not-started') as PhaseStatus,
      taskCount: total,
      completedTaskCount: completed
    };
  };

  // Force refresh helper
  const refreshData = async () => {
    const [projectsData, phasesData] = await Promise.all([
      api.getProjects(),
      api.getPhases(),
    ]);
    setProjects(projectsData);
    setPhases(phasesData);
  };

  const handleToggleTask = async (taskId: string) => {
    if (!selectedPhaseId) return;

    // Optimistic Update
    const phase = phases.find(p => p.id === selectedPhaseId);
    if (!phase) return;
    const task = phase.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompletedStatus = !task.completed;
    // Local update for snapiness
    setPhases(prev => prev.map(p => {
      if (p.id === selectedPhaseId) {
        const updatedTasks = p.tasks.map(t => t.id === taskId ? { ...t, completed: newCompletedStatus } : t);
        const metrics = calculateMetrics(updatedTasks);
        return { ...p, tasks: updatedTasks, ...metrics };
      }
      return p;
    }));

    try {
      await api.updateTask(taskId, { completed: newCompletedStatus });
      // We do NOT wait for full refresh on toggle to keep it fast, 
      // but we assume success. If it fails, the next reload fixes it.
      // We SHOULD update the phase status though.
      const updatedPhase = phases.find(p => p.id === selectedPhaseId);
      if (updatedPhase) {
        // Recalc metrics based on the change
        const updatedTasks = updatedPhase.tasks.map(t => t.id === taskId ? { ...t, completed: newCompletedStatus } : t);
        const metrics = calculateMetrics(updatedTasks);
        await api.updatePhase(selectedPhaseId, {
          progress: metrics.progress,
          status: metrics.status
        });
      }
    } catch (e) {
      console.error("Failed to toggle task:", e);
      alert("Failed to save task update. Please check your connection.");
      refreshData(); // Revert on error
    }
  };

  const handleAddTask = async (name: string, due?: string) => {
    if (!selectedPhaseId) return;

    try {
      // Create in backend FIRST to ensure data integrity
      await api.createTask(selectedPhaseId, name, due);
      // Then refresh everything to get the fresh ID and state
      await refreshData();
    } catch (e) {
      console.error("Failed to create task:", e);
      alert("Failed to create task. Please try again.");
    }
  };

  const handleDeletePhase = async () => {
    if (!selectedPhaseId) return;
    const id = selectedPhaseId;
    if (!confirm("Delete this phase?")) return;

    try {
      await api.deletePhase(id);
      setSelectedPhaseId(null);
      await refreshData();
    } catch (e) {
      console.error(e);
      alert("Failed to delete phase");
    }
  };

  const selectedPhase = phases.find(p => p.id === selectedPhaseId) || null;

  // Project Progress Calculation
  const getProjectProgress = (projectId: string) => {
    const projectPhases = phases.filter(p => p.project_id === projectId);
    if (projectPhases.length === 0) return 0;
    const totalProgress = projectPhases.reduce((acc, p) => acc + p.progress, 0);
    return Math.round(totalProgress / projectPhases.length);
  };

  // @ts-ignore
  const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toLocaleString();

  return (
    <div className="min-h-screen text-slate-900 bg-[#f4f4f5] relative font-sans">
      {/* Texture Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 z-0 mix-blend-multiply"
        style={{ backgroundImage: sketchTexture }}
      />

      {/* Header */}
      <header className="relative z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded-lg shadow-sm">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Project Tracker</h1>
              <p className="text-xs text-gray-500 font-medium">Dashboard</p>
            </div>
          </div>
          <Button onClick={() => setAddProjectDialogOpen(true)} className="bg-black hover:bg-gray-800 text-white shadow-md">
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-12">
        {projects.length === 0 ? (
          <div className="text-center py-32 opacity-50">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-400">No projects found</h3>
            <p className="text-sm text-gray-400 mt-2">Create a new project to get started</p>
          </div>
        ) : (
          projects.map(project => {
            const projectPhases = phases.filter(p => p.project_id === project.id);
            const progress = getProjectProgress(project.id);
            const isSelectedPhaseInThisProject = selectedPhase?.project_id === project.id;

            return (
              <section key={project.id} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Project Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200/60">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      {editingProjectId === project.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editProjectName}
                            onChange={(e) => setEditProjectName(e.target.value)}
                            className="h-9 w-64 text-lg font-bold bg-white"
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleUpdateProjectName(project.id)}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-9 w-9 text-red-400 hover:text-red-500 hover:bg-red-50" onClick={() => setEditingProjectId(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{project.name}</h2>
                          <div className="flex items-center gap-1">
                            <button onClick={() => startEditingProject(project)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-blue-600 transition-colors" title="Rename Project">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteProject(project.id)} className="p-2 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500 transition-colors" title="Delete Project">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-4 max-w-md group">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gray-900 to-gray-700 transition-all duration-1000 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600 tabular-nums">{progress}% Complete</span>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => handleOpenAddPhase(project.id)} className="bg-white hover:bg-gray-50 border-gray-200">
                    <Plus className="w-4 h-4 mr-2" /> Add Phase
                  </Button>
                </div>

                {/* Phases Horizontal Scroll */}
                <div className="relative">
                  <div className="flex items-center gap-4 overflow-x-auto pb-6 scrollbar-hide">
                    {projectPhases.length === 0 ? (
                      <div className="w-full py-12 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 bg-white/50">
                        <p className="text-sm font-medium">No phases in this project</p>
                        <Button variant="link" onClick={() => handleOpenAddPhase(project.id)} className="text-blue-600">Add one now</Button>
                      </div>
                    ) : (
                      <>
                        {projectPhases.map(phase => (
                          <div key={phase.id} className="flex items-center gap-4 flex-shrink-0">
                            <PhaseCard
                              phase={phase}
                              onClick={() => setSelectedPhaseId(selectedPhaseId === phase.id ? null : phase.id)} // Toggle selection
                              onNameChange={handlePhaseNameChange}
                            />
                            <ChevronRight className="w-6 h-6 text-gray-300" />
                          </div>
                        ))}
                        <button
                          onClick={() => handleOpenAddPhase(project.id)}
                          className="min-w-[280px] h-[200px] flex-shrink-0 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-600 group bg-white/50"
                        >
                          <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Add Phase</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded Phase View - Inline (Netflix Style) */}
                {isSelectedPhaseInThisProject && selectedPhase && (
                  <PhaseExpandedView
                    phase={selectedPhase}
                    tasks={selectedPhase.tasks}
                    onClose={() => setSelectedPhaseId(null)}
                    onToggleTask={handleToggleTask}
                    onAddTask={handleAddTask}
                    onDeletePhase={handleDeletePhase}
                  />
                )}
              </section>
            );
          })
        )}
      </main>

      {/* Footer with Image */}
      <footer className="relative w-full mt-24">
        {/* Background Image Container */}
        <div className="w-full h-[400px] md:h-[500px] relative overflow-hidden">
          <div
            className="absolute inset-0 bg-contain bg-bottom bg-no-repeat opacity-90"
            style={{ backgroundImage: `url('/bg-footer.jpg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-[#f4f4f5]" />
        </div>

        {/* Text Content */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-xs text-gray-500 font-medium bg-white/80 py-1 px-3 rounded-full inline-block backdrop-blur-sm shadow-sm">
            Deployed: {buildTime}
          </p>
        </div>
      </footer>

      {/* Dialogs */}
      <AddProjectDialog open={addProjectDialogOpen} onClose={() => setAddProjectDialogOpen(false)} onAdd={handleAddProject} />
      <AddPhaseDialog open={addPhaseDialogOpen} onClose={() => setAddPhaseDialogOpen(false)} onAdd={handleAddPhase} />
    </div>
  );
}
