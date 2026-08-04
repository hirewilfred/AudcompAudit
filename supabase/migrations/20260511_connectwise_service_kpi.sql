-- ConnectWise Service KPI integration

create table if not exists cw_locations (
    id          int primary key,
    name        text not null,
    raw         jsonb,
    synced_at   timestamptz not null default now()
);

create table if not exists cw_departments (
    id              int primary key,
    name            text not null,
    location_id     int references cw_locations(id),
    raw             jsonb,
    synced_at       timestamptz not null default now()
);

create table if not exists cw_monitored_boards (
    board_id                int primary key,
    board_name              text not null,
    location_id             int,
    location_name           text,
    department_id           int,
    department_name         text,
    monitor_today           boolean not null default false,
    monitor_pending_closure boolean not null default false,
    monitor_sla             boolean not null default false,
    enabled                 boolean not null default true,
    raw                     jsonb,
    synced_at               timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

create table if not exists cw_board_preferences (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid,
    name            text not null,
    location_ids    int[] not null default '{}',
    department_ids  int[] not null default '{}',
    board_ids       int[] not null default '{}',
    is_default      boolean not null default false,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create table if not exists cw_tickets (
    id                      int primary key,
    summary                 text,
    status_name             text,
    status_id               int,
    board_id                int,
    board_name              text,
    priority_id             int,
    priority_name           text,
    priority_sort           int,
    company_id              int,
    company_name            text,
    contact_id              int,
    contact_name            text,
    resources               text,
    assigned_resource       text,
    date_entered            timestamptz,
    date_closed             timestamptz,
    last_updated            timestamptz,
    required_date           timestamptz,
    date_next_action        timestamptz,
    actual_hours            numeric,
    age_days                numeric,
    sla_status              text,
    sla_respond_minutes     int,
    sla_resolve_minutes     int,
    sla_resolution_minutes  int,
    minutes_until_breach    int,
    raw                     jsonb,
    synced_at               timestamptz not null default now()
);

create index if not exists cw_tickets_date_entered_idx on cw_tickets(date_entered desc);
create index if not exists cw_tickets_status_idx       on cw_tickets(status_name);
create index if not exists cw_tickets_board_idx        on cw_tickets(board_id);
create index if not exists cw_tickets_breach_idx       on cw_tickets(minutes_until_breach);

create table if not exists cw_sync_runs (
    id              uuid primary key default gen_random_uuid(),
    scope           text not null,
    started_at      timestamptz not null default now(),
    finished_at     timestamptz,
    record_count    int,
    success         boolean,
    error_message   text,
    meta            jsonb
);

create index if not exists cw_sync_runs_scope_idx on cw_sync_runs(scope, started_at desc);
