create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lesson text not null,
  active boolean not null default true,
  created_by text not null default '',
  from_post uuid,
  constraint lessons_lesson_length check (char_length(btrim(lesson)) between 5 and 300)
);

alter table public.lessons enable row level security;

revoke all on table public.lessons from public, anon, authenticated;

create policy "authenticated can read lessons"
  on public.lessons
  for select
  to authenticated
  using (true);

create policy "authenticated can create lessons"
  on public.lessons
  for insert
  to authenticated
  with check (created_by = coalesce((select auth.jwt() ->> 'email'), ''));

create policy "authenticated can update lessons"
  on public.lessons
  for update
  to authenticated
  using (true)
  with check (true);

grant select
on table public.lessons
to authenticated;

grant insert (lesson, created_by, from_post)
on table public.lessons
to authenticated;

grant update (active)
on table public.lessons
to authenticated;

grant select, insert, update, delete
on table public.lessons
to service_role;

alter table public.events
  add column lessons_used text[] not null default '{}';
