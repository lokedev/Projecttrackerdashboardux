const API_URL = '/api';

export const api = {
    getProjects: async () => {
        const res = await fetch(`${API_URL}/projects`);
        if (!res.ok) throw new Error('Failed to fetch projects');
        return res.json();
    },
    createProject: async (project: { name: string }) => {
        const res = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project),
        });
        if (!res.ok) throw new Error('Failed to create project');
        return res.json();
    },
    getPhases: async () => {
        const res = await fetch(`${API_URL}/phases`);
        if (!res.ok) throw new Error('Failed to fetch phases');
        return res.json();
    },
    createPhase: async (phase: any) => {
        const res = await fetch(`${API_URL}/phases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(phase),
        });
        if (!res.ok) throw new Error('Failed to create phase');
        return res.json();
    },
    updatePhase: async (id: string, phase: any) => {
        const res = await fetch(`${API_URL}/phases/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(phase),
        });
        if (!res.ok) throw new Error('Failed to update phase');
        return res.json();
    },
    deletePhase: async (id: string) => {
        const res = await fetch(`${API_URL}/phases/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete phase');
    },
};
