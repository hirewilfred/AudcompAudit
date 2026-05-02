-- Per-expert LinkedIn / content queue used by the content-poster agent.

create table if not exists public.expert_posts (
    id uuid primary key default gen_random_uuid(),
    expert_id uuid not null references public.experts(id) on delete cascade,
    platform text not null check (platform in ('linkedin','x','instagram','facebook')) default 'linkedin',
    body text not null,
    media_urls text[] default '{}',
    hashtags text[] default '{}',
    status text not null check (status in (
        'draft','pending_review','approved','scheduled','posted','failed','declined'
    )) default 'pending_review',
    scheduled_for timestamptz,
    posted_at timestamptz,
    posted_url text,
    phantombuster_container_id text,
    error text,
    created_by_agent text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists expert_posts_expert_id_idx on public.expert_posts(expert_id);
create index if not exists expert_posts_status_idx on public.expert_posts(status);
create index if not exists expert_posts_scheduled_for_idx on public.expert_posts(scheduled_for);

create or replace function public.expert_posts_set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_expert_posts_updated_at on public.expert_posts;
create trigger set_expert_posts_updated_at
    before update on public.expert_posts
    for each row execute function public.expert_posts_set_updated_at();

alter table public.expert_posts enable row level security;

drop policy if exists expert_posts_admin_all on public.expert_posts;
create policy expert_posts_admin_all on public.expert_posts
    for all using (
        exists (select 1 from public.profiles
                where id = auth.uid() and is_admin = true)
    );
