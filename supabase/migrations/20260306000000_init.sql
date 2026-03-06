-- Migration: initial calimove schema
--
-- IMPORTANT: After applying this migration, expose the schema via:
--   Supabase dashboard → Settings → API → Extra Search Path
--   Add "calimove" to the list.
--
-- Apply via:
--   supabase db push          (requires CLI + linked project)
--   or paste into the Supabase SQL Editor

create schema if not exists calimove;

grant usage on schema calimove to anon, authenticated, service_role;

-- ==============================================================
-- Static tables — public read, no RLS needed
-- Data is scraped once and never changes.
-- ==============================================================

create table calimove.exercises (
  exercise_id    integer primary key,
  lecture_id     integer unique not null,
  name           text    unique not null,
  mod_lecture_id integer unique           -- null when no modifications video exists
);

create table calimove.flows (
  flow_id integer primary key,
  level   integer not null,
  name    text    not null  -- 'A' | 'B' | 'C' | 'D'
);

-- Ordered exercises within a flow
create table calimove.flow_exercises (
  flow_id     integer not null references calimove.flows(flow_id),
  exercise_id integer not null references calimove.exercises(exercise_id),
  position    integer not null,
  primary key (flow_id, exercise_id)
);

-- skip=1 rows from SQLite are filtered out at seed time and never inserted.
-- durations: one active duration per exercise in the flow, in seconds.
create table calimove.workouts (
  workout_id integer   primary key,
  lecture_id integer   unique not null,
  flow_id    integer   references calimove.flows(flow_id),
  n_sets     integer   not null,
  n_reps     integer   not null,
  durations  integer[] not null
);

grant select on calimove.exercises      to anon, authenticated;
grant select on calimove.flows          to anon, authenticated;
grant select on calimove.flow_exercises to anon, authenticated;
grant select on calimove.workouts       to anon, authenticated;

-- service_role bypasses RLS but still needs explicit privileges on custom schemas
grant all on all tables in schema calimove to service_role;

-- ==============================================================
-- Executions — per-user, RLS protected
-- ==============================================================

-- flow_id is denormalised here so that history is preserved even when
-- workout_id is null. This handles the 3 old executions that referenced
-- skip=1 workouts in SQLite which are not seeded into Supabase.
create table calimove.executions (
  execution_id uuid        primary key default gen_random_uuid(),
  workout_id   integer     references calimove.workouts(workout_id),  -- nullable
  flow_id      integer     not null references calimove.flows(flow_id),
  user_id      uuid        not null references auth.users(id),
  finished_at  timestamptz not null default now()
);

alter table calimove.executions enable row level security;

grant select, insert on calimove.executions to authenticated;

create policy "users can read own executions"
  on calimove.executions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users can insert own executions"
  on calimove.executions
  for insert
  to authenticated
  with check (auth.uid() = user_id);
