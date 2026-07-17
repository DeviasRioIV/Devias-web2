-- contacts table for the website contact form.
--
-- The endpoint (/api/contact) writes with the publishable key (the `anon`
-- role), so RLS applies. We allow INSERT for `anon` but grant NO read access,
-- so submissions can be created but never read back through the public API.

create table if not exists public.contacts (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  email         text not null,
  phone_country text not null,
  phone         text not null,
  company       text,
  signals       integer[] not null default '{}'
);

alter table public.contacts enable row level security;

-- Allow anonymous inserts (publishable key => `anon` role).
-- No SELECT/UPDATE/DELETE policy on purpose => rows can't be read/changed
-- through the public API.
create policy "Allow anonymous inserts"
  on public.contacts
  for insert
  to anon
  with check (true);

-- Ensure the anon role can reach the table (needed when new tables aren't
-- auto-exposed to the Data API). INSERT only — never grant SELECT here.
grant insert on table public.contacts to anon;

-- Helps a future admin panel list newest-first.
create index if not exists contacts_created_at_idx
  on public.contacts (created_at desc);
