create table if not exists public.app_state (
  tenant text primary key,
  members jsonb not null default '[]'::jsonb,
  news jsonb not null default '[]'::jsonb,
  courses jsonb not null default '[]'::jsonb,
  course_content jsonb not null default '[]'::jsonb,
  vacancies jsonb not null default '[]'::jsonb,
  candidates jsonb not null default '[]'::jsonb,
  support_threads jsonb not null default '[]'::jsonb,
  profiles jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_state (tenant)
values ('main')
on conflict (tenant) do nothing;
