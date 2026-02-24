-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  organization text,
  has_completed_audit boolean default false,
  last_audit_score integer,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Create audit_responses table
create table audit_responses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  question_id text not null,
  answer jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table audit_responses enable row level security;

create policy "Users can view their own responses"
  on audit_responses for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own responses"
  on audit_responses for insert
  with check ( auth.uid() = user_id );

-- Create audit_scores table
create table audit_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  overall_score integer not null,
  category_scores jsonb not null,
  recommendations text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table audit_scores enable row level security;

create policy "Users can view their own scores"
  on audit_scores for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own scores"
  on audit_scores for insert
  with check ( auth.uid() = user_id );
