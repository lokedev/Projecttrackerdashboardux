-- Create Projects Table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Phases Table
CREATE TABLE phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE, -- Optional but good for future
  name TEXT NOT NULL,
  status TEXT DEFAULT 'not-started',
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Tasks Table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID REFERENCES phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  due_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable RLS for MVP (Allows public read/write - use with caution in production)
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE phases DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Insert Seed Data
WITH p AS (
  INSERT INTO projects (name) VALUES ('Website Redesign') RETURNING id
),
ph1 AS (
  INSERT INTO phases (project_id, name, status, progress) 
  SELECT id, 'Discovery & Research', 'in-progress', 75 FROM p RETURNING id
),
ph2 AS (
  INSERT INTO phases (project_id, name, status, progress) 
  SELECT id, 'Design & Prototyping', 'in-progress', 33 FROM p RETURNING id
),
ph3 AS (
  INSERT INTO phases (project_id, name, status, progress) 
  SELECT id, 'Development', 'not-started', 0 FROM p RETURNING id
)
INSERT INTO tasks (phase_id, name, completed, due_date)
SELECT id, 'Conduct user interviews', true, NULL FROM ph1
UNION ALL
SELECT id, 'Analyze competitor websites', true, NULL FROM ph1
UNION ALL
SELECT id, 'Create user personas', true, NULL FROM ph1
UNION ALL
SELECT id, 'Define project scope', false, '2026-01-25' FROM ph1
UNION ALL
SELECT id, 'Create wireframes', true, NULL FROM ph2
UNION ALL
SELECT id, 'Design mockups', true, NULL FROM ph2;

-- Create Subtasks Table
CREATE TABLE subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  position INTEGER
);

ALTER TABLE subtasks DISABLE ROW LEVEL SECURITY;

