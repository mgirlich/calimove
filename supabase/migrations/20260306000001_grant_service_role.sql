-- Grant full table access to service_role on the calimove schema.
-- service_role bypasses RLS but still needs PostgreSQL-level privileges
-- on custom schemas. This is required for the seed script to insert data.
grant all on all tables in schema calimove to service_role;
