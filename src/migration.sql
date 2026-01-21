-- Run this in Supabase SQL Editor
create table if not exists subtasks (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade,
  name text not null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  position integer
);

alter table subtasks enable row level security;

create policy "Enable all access for all users" on subtasks for all using (true) with check (true);
