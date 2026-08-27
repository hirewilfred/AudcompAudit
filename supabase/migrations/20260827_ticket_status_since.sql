-- Track when a ticket last changed status.
--
-- ConnectWise exposes no status-change timestamp: the ticket record carries
-- dateEntered, lastUpdated, dateResponded and dateResolved, but nothing for
-- "when did status become X". Time-in-status therefore has to be observed and
-- recorded on our side, which is what this trigger does.

alter table public.cw_tickets add column if not exists status_since timestamptz;

create index if not exists cw_tickets_status_since_idx
    on public.cw_tickets(status_since desc nulls last);

-- The syncs bulk-upsert (INSERT ... ON CONFLICT DO UPDATE) and never send a
-- status_since value, so on the UPDATE path NEW.status_since arrives NULL.
-- The final branch carrying OLD.status_since forward is what stops every sync
-- from resetting the clock on every ticket.
create or replace function public.cw_stamp_status_since() returns trigger
    language plpgsql as $$
begin
    if tg_op = 'INSERT' then
        new.status_since := coalesce(new.status_since, new.last_updated, now());
    elsif new.status_name is distinct from old.status_name then
        new.status_since := now();
    else
        -- Keep the recorded transition time. The coalesce chain matters: a bare
        -- `old.status_since` would clobber the backfill below (that UPDATE does
        -- not change status_name, so it lands here) and would leave any row
        -- whose value is still null with no way to ever acquire one.
        new.status_since := coalesce(old.status_since, new.status_since, new.last_updated, now());
    end if;
    return new;
end;
$$;

drop trigger if exists cw_tickets_status_since on public.cw_tickets;
create trigger cw_tickets_status_since
    before insert or update on public.cw_tickets
    for each row execute function public.cw_stamp_status_since();

-- Seed existing rows. These are ESTIMATES: last_updated moves on any change
-- (note added, time logged), not only on status transitions. Only transitions
-- observed after this migration ships are accurate, so treat time-in-status
-- figures as unreliable for the first few days.
update public.cw_tickets
set status_since = last_updated
where status_since is null;
