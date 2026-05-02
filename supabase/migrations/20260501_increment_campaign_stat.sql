-- Atomic counter bump used by the Instantly webhook receiver.
-- Allows: stats_contacted, stats_replied, stats_booked, stats_researched.

create or replace function public.increment_campaign_stat(
    p_campaign_id uuid,
    p_field text
) returns void
language plpgsql
security definer
as $$
begin
    if p_field not in ('stats_contacted','stats_replied','stats_booked','stats_researched') then
        raise exception 'invalid stat field: %', p_field;
    end if;

    execute format(
        'update public.outreach_campaigns set %I = coalesce(%I, 0) + 1 where id = $1',
        p_field, p_field
    ) using p_campaign_id;
end;
$$;

revoke all on function public.increment_campaign_stat(uuid, text) from public, anon, authenticated;
