-- Run this in Supabase SQL Editor
alter table phases add column if not exists position integer;

-- Optional: Initialize existing phases with a default position based on creation order
with indexed_phases as (
  select id, row_number() over (partition by project_id order by created_at) as proper_order
  from phases
)
update phases
set position = indexed_phases.proper_order
from indexed_phases
where phases.id = indexed_phases.id;
