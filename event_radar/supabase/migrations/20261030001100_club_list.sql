create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null unique,
  nicknames text not null default '',
  usual_place_code text not null default '',
  usual_place_detail text not null default '',
  active boolean not null default true,
  note text not null default ''
);

alter table public.clubs enable row level security;

revoke all on table public.clubs from public, anon, authenticated;

create policy "anon and authenticated can read active clubs"
  on public.clubs
  for select
  to anon, authenticated
  using (active = true);

grant select (id, name, nicknames, active)
on table public.clubs
to anon, authenticated;

grant select, insert, update, delete
on table public.clubs
to service_role;

insert into public.clubs (
  name,
  nicknames,
  usual_place_code,
  usual_place_detail,
  active,
  note
)
values
  ('Board Game Guild', 'BGG, board game club', 'UU', 'Room 220', true, ''),
  ('Mustang Pitch Society', 'MPS, pitch society', 'UU-PLAZA', '', true, ''),
  ('Women in Finance Circle', 'WIFC, women in finance', 'BUSINESS', '', true, ''),
  ('Sustainability Crew', 'sustainability club, SC', 'DEXTER-LAWN', '', true, ''),
  ('Accounting Society', 'accounting club, AS', 'BUSINESS', 'Room 212', true, ''),
  ('Cal Poly Ski & Snowboard Club', 'ski club, ski and snowboard', 'REC-CENTER', '', true, '')
on conflict (name) do nothing;

alter table public.events
  add column agent_notes text[] not null default '{}';
