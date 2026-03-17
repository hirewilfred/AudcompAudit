-- Create AI Advisor Reports table
create table if not exists public.ai_advisor_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  organization text,
  responses jsonb not null,
  recommendations jsonb,
  roadmap jsonb,
  narrative text,
  roi_parameters jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add new columns if they don't exist (for tables created before this migration was updated)
alter table public.ai_advisor_reports add column if not exists organization text;
alter table public.ai_advisor_reports add column if not exists updated_at timestamp with time zone default now();

-- Make recommendations/roadmap/narrative nullable if they were created as not null
alter table public.ai_advisor_reports alter column recommendations drop not null;
alter table public.ai_advisor_reports alter column roadmap drop not null;
alter table public.ai_advisor_reports alter column narrative drop not null;

-- Add unique constraint on user_id if not exists
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ai_advisor_reports_user_id_key'
    and conrelid = 'public.ai_advisor_reports'::regclass
  ) then
    alter table public.ai_advisor_reports add constraint ai_advisor_reports_user_id_key unique (user_id);
  end if;
end $$;

-- Enable RLS
alter table public.ai_advisor_reports enable row level security;

-- Policies (drop first to allow re-running)
drop policy if exists "Users can view their own reports" on public.ai_advisor_reports;
drop policy if exists "Users can insert their own reports" on public.ai_advisor_reports;
drop policy if exists "Users can update their own reports" on public.ai_advisor_reports;
drop policy if exists "Admins can view all AI advisor reports" on public.ai_advisor_reports;

create policy "Users can view their own reports"
  on public.ai_advisor_reports for select
  using (auth.uid() = user_id);

create policy "Users can insert their own reports"
  on public.ai_advisor_reports for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reports"
  on public.ai_advisor_reports for update
  using (auth.uid() = user_id);

create policy "Admins can view all AI advisor reports"
  on public.ai_advisor_reports for select
  using ( public.is_admin() );

create policy "Admins can update all AI advisor reports"
  on public.ai_advisor_reports for update
  using ( public.is_admin() );

-- Auto-update updated_at
create or replace function public.update_ai_advisor_reports_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger ai_advisor_reports_updated_at
  before update on public.ai_advisor_reports
  for each row execute function public.update_ai_advisor_reports_updated_at();

-- Index for performance
create index if not exists ai_advisor_reports_user_id_idx on public.ai_advisor_reports(user_id);
create index if not exists ai_advisor_reports_org_idx on public.ai_advisor_reports(organization);
