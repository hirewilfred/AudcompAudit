-- ============================================================================
-- Outreach OS — Slice 1
-- Per-expert campaigns, integrations vault, landing-page lead capture,
-- round-robin expert assignment.
-- ============================================================================

create extension if not exists pgcrypto;

-- ── 1. Extend outreach_campaigns ────────────────────────────────────────────
alter table public.outreach_campaigns
    add column if not exists expert_id uuid references public.experts(id) on delete set null,
    add column if not exists channel text check (channel in ('email','linkedin','content','multi')) default 'multi',
    add column if not exists landing_page_slug text,
    add column if not exists instantly_campaign_id text,
    add column if not exists phantombuster_campaign_id text,
    add column if not exists daily_send_cap int default 30;

create index if not exists outreach_campaigns_expert_id_idx
    on public.outreach_campaigns(expert_id);

-- ── 2. Extend outreach_leads ────────────────────────────────────────────────
alter table public.outreach_leads
    add column if not exists expert_id uuid references public.experts(id) on delete set null,
    add column if not exists linkedin_url text,
    add column if not exists apollo_id text,
    add column if not exists source text check (source in ('apify','apollo','landing_page','manual','audit')) default 'manual',
    add column if not exists landing_page_slug text,
    add column if not exists audit_user_id uuid references public.profiles(id) on delete set null,
    add column if not exists last_message_at timestamptz,
    add column if not exists replied_at timestamptz,
    add column if not exists booked_at timestamptz,
    add column if not exists approval_status text
        check (approval_status in ('pending_review','approved','sent','declined'))
        default 'pending_review';

create index if not exists outreach_leads_expert_id_idx
    on public.outreach_leads(expert_id);
create index if not exists outreach_leads_approval_status_idx
    on public.outreach_leads(approval_status);

-- ── 3. integrations vault (encrypted API keys) ──────────────────────────────
create table if not exists public.integrations (
    id uuid primary key default gen_random_uuid(),
    provider text not null check (provider in (
        'apify', 'apollo', 'instantly', 'phantombuster', 'resend',
        'linkedin_oauth', 'gmail_oauth'
    )),
    label text not null,
    scope text not null check (scope in ('global','per_expert')) default 'global',
    expert_id uuid references public.experts(id) on delete cascade,
    encrypted_key bytea not null,
    last4 text not null,
    is_active boolean not null default true,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz default now(),
    rotated_at timestamptz default now(),
    last_test_at timestamptz,
    last_test_ok boolean,
    last_test_error text,
    constraint integrations_per_expert_check
        check ((scope = 'global' and expert_id is null)
            or (scope = 'per_expert' and expert_id is not null))
);

create unique index if not exists integrations_global_provider_label_uniq
    on public.integrations(provider, label) where scope = 'global';
create unique index if not exists integrations_expert_provider_uniq
    on public.integrations(provider, expert_id) where scope = 'per_expert';

alter table public.integrations enable row level security;

drop policy if exists integrations_admin_all on public.integrations;
create policy integrations_admin_all on public.integrations
    for all using (
        exists (select 1 from public.profiles
                where id = auth.uid() and is_admin = true)
    );

-- ── 4. landing_page_submissions ────────────────────────────────────────────
create table if not exists public.landing_page_submissions (
    id uuid primary key default gen_random_uuid(),
    landing_page_slug text not null,
    email text not null,
    full_name text,
    organization text,
    phone text,
    referrer text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_term text,
    utm_content text,
    assigned_expert_id uuid references public.experts(id) on delete set null,
    audit_user_id uuid references public.profiles(id) on delete set null,
    captured_at timestamptz default now()
);

create index if not exists landing_page_submissions_slug_idx
    on public.landing_page_submissions(landing_page_slug);
create index if not exists landing_page_submissions_expert_idx
    on public.landing_page_submissions(assigned_expert_id);
create index if not exists landing_page_submissions_email_idx
    on public.landing_page_submissions(email);

alter table public.landing_page_submissions enable row level security;

drop policy if exists landing_page_submissions_admin_read on public.landing_page_submissions;
create policy landing_page_submissions_admin_read on public.landing_page_submissions
    for select using (
        exists (select 1 from public.profiles
                where id = auth.uid() and is_admin = true)
    );

-- ── 5. Round-robin expert assignment cursor ─────────────────────────────────
create table if not exists public.outreach_assignment_cursor (
    id int primary key default 1,
    last_expert_id uuid references public.experts(id) on delete set null,
    updated_at timestamptz default now(),
    constraint outreach_assignment_cursor_singleton check (id = 1)
);
insert into public.outreach_assignment_cursor (id) values (1)
    on conflict (id) do nothing;

create or replace function public.pick_next_expert()
returns uuid
language plpgsql
as $$
declare
    next_id uuid;
    last_id uuid;
begin
    select last_expert_id into last_id from public.outreach_assignment_cursor where id = 1;

    -- Pick the next expert ordered by id, wrapping around.
    select e.id into next_id
    from public.experts e
    where (last_id is null or e.id > last_id)
    order by e.id asc
    limit 1;

    if next_id is null then
        select e.id into next_id from public.experts e order by e.id asc limit 1;
    end if;

    update public.outreach_assignment_cursor
    set last_expert_id = next_id, updated_at = now()
    where id = 1;

    return next_id;
end;
$$;

-- ── 6. marketing_agent_runs (port from ClarityWorks) ────────────────────────
create table if not exists public.marketing_agent_runs (
    id uuid primary key default gen_random_uuid(),
    mission_id uuid not null,
    parent_run_id uuid references public.marketing_agent_runs(id) on delete set null,
    agent_name text not null,
    status text not null check (status in ('queued','running','succeeded','failed')) default 'queued',
    goal text,
    task text,
    input jsonb,
    output jsonb,
    affected_table text,
    affected_count int,
    error text,
    started_at timestamptz default now(),
    completed_at timestamptz
);

create index if not exists marketing_agent_runs_mission_idx
    on public.marketing_agent_runs(mission_id);
create index if not exists marketing_agent_runs_status_idx
    on public.marketing_agent_runs(status);
create index if not exists marketing_agent_runs_started_at_idx
    on public.marketing_agent_runs(started_at desc);

-- ── 7. Encryption RPCs used by lib/outreach/integrations.ts ─────────────────
create or replace function public.exec_encrypt(payload text, master text)
returns bytea
language sql
security definer
as $$
    select pgp_sym_encrypt(payload, master);
$$;

create or replace function public.integration_decrypt_key(
    p_provider text,
    p_expert_id uuid,
    p_label text,
    p_master text
) returns text
language plpgsql
security definer
as $$
declare
    enc bytea;
begin
    select encrypted_key into enc
    from public.integrations
    where provider = p_provider
      and is_active = true
      and (
          (p_expert_id is not null and scope = 'per_expert' and expert_id = p_expert_id)
          or (p_expert_id is null and scope = 'global'
              and (p_label is null or label = p_label))
      )
    order by rotated_at desc
    limit 1;

    if enc is null then
        return null;
    end if;

    return pgp_sym_decrypt(enc, p_master);
end;
$$;

revoke all on function public.exec_encrypt(text, text) from public, anon, authenticated;
revoke all on function public.integration_decrypt_key(text, uuid, text, text) from public, anon, authenticated;

alter table public.marketing_agent_runs enable row level security;

drop policy if exists marketing_agent_runs_admin_all on public.marketing_agent_runs;
create policy marketing_agent_runs_admin_all on public.marketing_agent_runs
    for all using (
        exists (select 1 from public.profiles
                where id = auth.uid() and is_admin = true)
    );
