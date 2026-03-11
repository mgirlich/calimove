-- Restrict static catalog tables to authenticated users only.
-- Previously granted to anon + authenticated; revoke anon access.
-- Enable RLS + add authenticated-only SELECT policies.

revoke select on calimove.exercises from anon;
revoke select on calimove.flows from anon;
revoke select on calimove.flow_exercises from anon;
revoke select on calimove.workouts from anon;

alter table calimove.exercises enable row level security;
alter table calimove.flows enable row level security;
alter table calimove.flow_exercises enable row level security;
alter table calimove.workouts enable row level security;

create policy "authenticated read access"
  on calimove.exercises for select
  to authenticated
  using (true);

create policy "authenticated read access"
  on calimove.flows for select
  to authenticated
  using (true);

create policy "authenticated read access"
  on calimove.flow_exercises for select
  to authenticated
  using (true);

create policy "authenticated read access"
  on calimove.workouts for select
  to authenticated
  using (true);
