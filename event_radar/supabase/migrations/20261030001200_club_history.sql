alter table public.events
  drop constraint if exists events_status_check;

alter table public.events
  add constraint events_status_check
  check (status in ('published', 'waiting', 'rejected', 'archived', 'replaced'));

alter table public.events
  add column replaced_by uuid,
  add column updates_id uuid;

drop policy if exists "authenticated can review events" on public.events;

create policy "authenticated can review events"
  on public.events
  for update
  to authenticated
  using (true)
  with check (status in ('published', 'waiting', 'rejected', 'replaced'));
