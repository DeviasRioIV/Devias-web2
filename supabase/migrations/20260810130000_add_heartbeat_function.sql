-- Keep-alive probe for the free-tier Supabase project.
--
-- Free projects pause after 7 days without activity, and a paused project means
-- the next contact form submission is lost. A Vercel cron calls /api/health
-- once a day, which calls this function: a real query against Postgres that
-- reads no table, so it needs no access to `contacts`.

create or replace function public.heartbeat()
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$
  select now();
$$;

-- The publishable key runs as `anon`, which is what /api/health uses.
grant execute on function public.heartbeat() to anon;
