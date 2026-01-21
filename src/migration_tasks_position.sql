-- Run this in Supabase SQL Editor
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position INTEGER;

-- Optional: Initialize existing tasks with a default position (e.g., ordered by creation)
WITH ordered_tasks AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY phase_id ORDER BY created_at) as new_pos
  FROM tasks
)
UPDATE tasks
SET position = ordered_tasks.new_pos
FROM ordered_tasks
WHERE tasks.id = ordered_tasks.id;

-- Also ensure subtasks has position (it was in the previous migration, but good to be safe)
-- ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS position INTEGER;
