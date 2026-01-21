import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Helper to read DB
async function readDb() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, return default structure
        return { projects: [], phases: [] };
    }
}

// Helper to write DB
async function writeDb(data) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// Projects Routes
app.get('/api/projects', async (req, res) => {
    const db = await readDb();
    res.json(db.projects);
});

app.post('/api/projects', async (req, res) => {
    const db = await readDb();
    const newProject = req.body;
    if (!newProject.id) newProject.id = `project-${Date.now()}`;
    db.projects.push(newProject);
    await writeDb(db);
    res.status(201).json(newProject);
});

// Phases Routes
app.get('/api/phases', async (req, res) => {
    const db = await readDb();
    res.json(db.phases);
});

app.post('/api/phases', async (req, res) => {
    const db = await readDb();
    const newPhase = req.body;
    if (!newPhase.id) newPhase.id = `phase-${Date.now()}`;
    // Ensure defaults
    if (!newPhase.tasks) newPhase.tasks = [];
    db.phases.push(newPhase);
    await writeDb(db);
    res.status(201).json(newPhase);
});

// Update Phase (general update or task update)
// Simplest approach: Client sends updated phase object
app.put('/api/phases/:id', async (req, res) => {
    const db = await readDb();
    const { id } = req.params;
    const updatedPhaseData = req.body;

    const index = db.phases.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'Phase not found' });

    // Merge updates
    db.phases[index] = { ...db.phases[index], ...updatedPhaseData };
    await writeDb(db);
    res.json(db.phases[index]);
});

app.delete('/api/phases/:id', async (req, res) => {
    const db = await readDb();
    const { id } = req.params;
    db.phases = db.phases.filter(p => p.id !== id);
    await writeDb(db);
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
