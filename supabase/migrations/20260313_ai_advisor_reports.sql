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

-- Enable RLS
alter table public.ai_advisor_reports enable row level security;

-- Policies
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
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

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
