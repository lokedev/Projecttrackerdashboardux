import { supabase } from '@/lib/supabase';

// Helper to calculate tasks metrics
function calculatePhaseMetrics(tasks: any[]) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    let status = "not-started";
    if (completedTasks === totalTasks && totalTasks > 0) {
        status = "completed";
    } else if (completedTasks > 0) {
        status = "in-progress";
    }
    return { progress, status, completedTaskCount: completedTasks, taskCount: totalTasks };
}

export const api = {
    getProjects: async () => {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    createProject: async (project: { name: string }) => {
        const { data, error } = await supabase
            .from('projects')
            .insert([project])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    getPhases: async () => {
        // Join phases and tasks
        const { data: phases, error: phasesError } = await supabase
            .from('phases')
            .select(`
        *,
        tasks (*)
      `)
            .order('created_at', { ascending: true });

        if (phasesError) throw phasesError;

        // Transform to match frontend expected structure (calculate usage metrics if needed)
        return phases.map(phase => {
            const tasks = phase.tasks || [];
            const metrics = calculatePhaseMetrics(tasks);
            return {
                ...phase,
                ...metrics, // ensure metrics are fresh
                tasks: tasks.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            };
        });
    },

    createPhase: async (phase: any) => {
        // Only insert the phase fields, not the calculated ones or tasks array
        const { tasks, taskCount, completedTaskCount, progress, status, ...dbPhase } = phase;

        // Default to first project if not specified (simplification for MVP)
        if (!dbPhase.project_id) {
            const { data: projects } = await supabase.from('projects').select('id').limit(1);
            if (projects && projects.length > 0) dbPhase.project_id = projects[0].id;
        }

        const { data, error } = await supabase
            .from('phases')
            .insert([dbPhase])
            .select()
            .single();

        if (error) throw error;
        return { ...data, tasks: [], taskCount: 0, completedTaskCount: 0, progress: 0 };
    },

    updatePhase: async (id: string, phase: any) => {
        // Separate tasks from phase data to handle updates
        const { tasks, taskCount, completedTaskCount, progress, status, project_id, created_at, ...updates } = phase;

        // Update Phase metadata
        const { error: phaseError } = await supabase
            .from('phases')
            .update({ name: updates.name, status, progress }) // Update calculated fields too for persistence
            .eq('id', id);

        if (phaseError) throw phaseError;

        // Handle Task Syncing (Upsert is easiest for MVP)
        if (tasks && tasks.length > 0) {
            console.log('Syncing tasks for phase:', id, tasks);
            const tasksToUpsert = tasks.map((t: any) => ({
                id: (t.id && t.id.includes('task-')) ? undefined : t.id, // Only use undefined if it's a temp ID
                phase_id: id,
                name: t.name,
                completed: t.completed,
                due_date: t.dueDate || t.due_date // handle casing
            }));

            const { error: taskError } = await supabase
                .from('tasks')
                .upsert(tasksToUpsert);

            if (taskError) console.error('Task sync error:', taskError);

            // Handle deletions? For MVP, we ignored deletions in the update loop
        }

        return phase;
    },

    deletePhase: async (id: string) => {
        const { error } = await supabase.from('phases').delete().eq('id', id);
        if (error) throw error;
    },
};
