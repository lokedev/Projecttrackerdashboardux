import { supabase } from '@/lib/supabase';

// Helper to calculate tasks metrics
// Helper to calculate tasks metrics (Granular: Subtasks count too)
function calculatePhaseMetrics(tasks: any[]) {
    let totalItems = 0;
    let completedItems = 0;

    tasks.forEach(task => {
        // Count the Task itself
        totalItems++;
        if (task.completed) completedItems++;

        // Count Subtasks if they exist
        if (task.subtasks && task.subtasks.length > 0) {
            totalItems += task.subtasks.length;
            completedItems += task.subtasks.filter((st: any) => st.completed).length;
        }
    });

    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    let status = "not-started";
    if (completedItems === totalItems && totalItems > 0) {
        status = "completed";
    } else if (completedItems > 0) {
        status = "in-progress";
    }
    return { progress, status, completedTaskCount: completedItems, taskCount: totalItems }; // Note: specific counts might be misinterpreted if UI expects TASK count only, but for progress bar it is fine.
    // Actually, UI shows "X / Y tasks". If we return item count, it shows "15 / 20 tasks" (items). This is consistent with granular progress.
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

    async getTasks() {
        // Fetch tasks with their subtasks, ordered by position
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select(`
        *,
        subtasks (
          id,
          name,
          completed,
          position
        )
      `)
            .order('position', { ascending: true });

        if (error) throw error;

        // Sort subtasks by position (client-side sort to be safe/easy if distinct order needed)
        // or we can try to order in the query modifier if Supabase supports it well for nested.
        // .order('position', { foreignTable: 'subtasks', ascending: true }) 
        // ^ This sometimes is tricky. Let's sort in JS.
        const sortedTasks = tasks?.map(t => ({
            ...t,
            subtasks: t.subtasks?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0)) || []
        })) || [];

        return sortedTasks;
    },

    async createTask(phase_id: string, name: string) {
        const { data, error } = await supabase
            .from('tasks')
            .insert({ phase_id, name, completed: false, position: 9999 }) // Default to end
            .select()
            .single();
        if (error) throw error;
        return data; // Return the task object
    },

    async updateTask(id: string, updates: any) {
        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Subtasks
    async createSubtask(task_id: string, name: string) {
        const { data, error } = await supabase
            .from('subtasks')
            .insert({ task_id, name, completed: false })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateSubtask(id: string, updates: any) {
        const { data, error } = await supabase
            .from('subtasks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteSubtask(id: string) {
        const { error } = await supabase
            .from('subtasks')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    updateProject: async (id: string, name: string) => {
        const { data, error } = await supabase
            .from('projects')
            .update({ name })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    deleteProject: async (id: string) => {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;
    },

    getPhases: async () => {
        // Fetch all phases with their tasks and subtasks
        const { data: phases, error: phasesError } = await supabase
            .from('phases')
            .select(`
        *,
        tasks (
          *,
          subtasks (*)
        )
      `)
            .order('created_at', { ascending: true });

        if (phasesError) throw phasesError;

        // Transform to match frontend expected structure
        return phases.sort((a, b) => (a.position || 0) - (b.position || 0) || new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map(phase => {
            const tasks = phase.tasks || [];
            const metrics = calculatePhaseMetrics(tasks);
            return {
                ...phase,
                ...metrics,
                // Sort tasks by position, fall back to created_at
                tasks: tasks.sort((a: any, b: any) => {
                    const posA = a.position ?? 9999;
                    const posB = b.position ?? 9999;
                    return posA - posB || new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                }).map((t: any) => ({
                    ...t,
                    // Sort subtasks by position or creation
                    subtasks: t.subtasks?.sort((sa: any, sb: any) => (sa.position || 0) - (sb.position || 0)) || []
                }))
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
            .update({ name: updates.name, status, progress, position: updates.position }) // Update calculated fields too for persistence
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

    deleteTask: async (id: string) => {
        // Manually delete subtasks first to ensure cleanup (in case DB cascade is missing)
        const { error: subError } = await supabase
            .from('subtasks')
            .delete()
            .eq('task_id', id);

        if (subError) console.error("Error deleting subtasks:", subError);

        // Then delete the task
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },
    deletePhase: async (id: string) => {
        const { error } = await supabase.from('phases').delete().eq('id', id);
        if (error) throw error;
    },


};
