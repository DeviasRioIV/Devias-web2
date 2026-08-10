-- The form now sends the "señales" as their own text instead of the index of
-- the option in the translation file, so the labels survive any reordering or
-- rewording of the list. Existing rows only hold indexes, which we keep as
-- their string form (there's no reliable way to map them back to a label).

alter table public.contacts
  alter column signals drop default,
  alter column signals type text[] using signals::text[],
  alter column signals set default '{}';
