-- ConnectWise production hardening:
--   1. Enable RLS on all cw_* tables (staff/admin read; writes via service role only)
--   2. Add missing indexes (company, assigned_resource, board FK)
--   3. Retention helper for cw_sync_runs

-- ---- Indexes -----------------------------------------------------------
create index if not exists cw_tickets_company_idx
    on public.cw_tickets(company_id);

create index if not exists cw_tickets_assigned_resource_idx
    on public.cw_tickets(assigned_resource);

create index if not exists cw_tickets_date_closed_idx
    on public.cw_tickets(date_closed desc nulls last);

create index if not exists cw_monitored_boards_monitor_today_idx
    on public.cw_monitored_boards(board_id) where monitor_today = true;

create index if not exists cw_monitored_boards_monitor_sla_idx
    on public.cw_monitored_boards(board_id) where monitor_sla = true;

create index if not exists cw_monitored_boards_monitor_pc_idx
    on public.cw_monitored_boards(board_id) where monitor_pending_closure = true;

-- ---- RLS ---------------------------------------------------------------
-- Staff/admin can read CW data via the API. Writes happen from server
-- routes that use the user's session (after authorizeSync) or the service
-- role key — RLS still applies to anon/authenticated users.

alter table public.cw_locations          enable row level security;
alter table public.cw_departments        enable row level security;
alter table public.cw_monitored_boards   enable row level security;
alter table public.cw_board_preferences  enable row level security;
alter table public.cw_tickets            enable row level security;
alter table public.cw_sync_runs          enable row level security;

-- Helper: staff predicate. Reused across policies.
create or replace function public.is_staff_or_admin() returns boolean
    language sql stable security definer set search_path = public as $$
    select coalesce(
        (select is_admin or is_staff
         from public.profiles
         where id = auth.uid()),
        false
    );
$$;

-- Read policies (staff + admin)
drop policy if exists cw_locations_staff_read         on public.cw_locations;
drop policy if exists cw_departments_staff_read       on public.cw_departments;
drop policy if exists cw_monitored_boards_staff_read  on public.cw_monitored_boards;
drop policy if exists cw_board_prefs_staff_read       on public.cw_board_preferences;
drop policy if exists cw_tickets_staff_read           on public.cw_tickets;
drop policy if exists cw_sync_runs_staff_read         on public.cw_sync_runs;

create policy cw_locations_staff_read        on public.cw_locations         for select using (public.is_staff_or_admin());
create policy cw_departments_staff_read      on public.cw_departments       for select using (public.is_staff_or_admin());
create policy cw_monitored_boards_staff_read on public.cw_monitored_boards  for select using (public.is_staff_or_admin());
create policy cw_board_prefs_staff_read      on public.cw_board_preferences for select using (public.is_staff_or_admin());
create policy cw_tickets_staff_read          on public.cw_tickets           for select using (public.is_staff_or_admin());
create policy cw_sync_runs_staff_read        on public.cw_sync_runs         for select using (public.is_staff_or_admin());

-- Staff can toggle their monitored boards from the UI.
drop policy if exists cw_monitored_boards_staff_update on public.cw_monitored_boards;
create policy cw_monitored_boards_staff_update on public.cw_monitored_boards
    for update using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

-- Per-user board preferences are owned by the creating user.
drop policy if exists cw_board_prefs_owner_rw on public.cw_board_preferences;
create policy cw_board_prefs_owner_rw on public.cw_board_preferences
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Note: bulk upserts into cw_tickets / cw_*_runs run on the server with the
-- user's session. They are gated by authorizeSync() (which already requires
-- staff/admin or the cron secret). If you later move sync to a background
-- worker using the service-role key, RLS is bypassed automatically.

-- ---- Retention helper --------------------------------------------------
-- Trims cw_sync_runs to keep the latest 1000 rows per scope.
create or replace function public.cw_prune_sync_runs(keep_per_scope int default 1000)
    returns int language plpgsql security definer set search_path = public as $$
declare
    deleted int := 0;
begin
    with ranked as (
        select id, row_number() over (partition by scope order by started_at desc) as rn
        from public.cw_sync_runs
    ),
    victims as (
        delete from public.cw_sync_runs
        where id in (select id from ranked where rn > keep_per_scope)
        returning 1
    )
    select count(*) into deleted from victims;
    return deleted;
end;
$$;
