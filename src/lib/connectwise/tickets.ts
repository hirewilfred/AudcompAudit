import { cwFetchAll, cwConditions, cwDate } from './client';

export interface CwTicket {
    id: number;
    summary?: string;
    status?: { id: number; name: string };
    board?: { id: number; name: string };
    priority?: { id: number; name: string; sort?: number };
    company?: { id: number; name: string };
    contact?: { id: number; name: string };
    contactName?: string;
    resources?: string;
    owner?: { identifier: string; name: string };
    sla?: { id: number; name: string };
    slaStatus?: string;
    respondedSkippedMinutes?: number;
    respondedMinutes?: number;
    resolutionMinutes?: number;
    minutesWaiting?: number;
    minutesBeforeWaiting?: number;
    requiredDate?: string;
    dateNextAction?: string;
    actualHours?: number;
    closedFlag?: boolean;
    closedDate?: string;
    _info?: { dateEntered?: string; lastUpdated?: string };
}

export interface TicketRow {
    id: number;
    summary: string | null;
    status_name: string | null;
    status_id: number | null;
    board_id: number | null;
    board_name: string | null;
    priority_id: number | null;
    priority_name: string | null;
    priority_sort: number | null;
    company_id: number | null;
    company_name: string | null;
    contact_id: number | null;
    contact_name: string | null;
    resources: string | null;
    assigned_resource: string | null;
    date_entered: string | null;
    date_closed: string | null;
    last_updated: string | null;
    required_date: string | null;
    date_next_action: string | null;
    actual_hours: number | null;
    age_days: number | null;
    sla_status: string | null;
    sla_respond_minutes: number | null;
    sla_resolve_minutes: number | null;
    sla_resolution_minutes: number | null;
    minutes_until_breach: number | null;
    raw: CwTicket;
    synced_at: string;
}

export function ticketToRow(t: CwTicket): TicketRow {
    const dateEntered = t._info?.dateEntered ?? null;
    const ageDays = dateEntered
        ? +((Date.now() - new Date(dateEntered).getTime()) / 86_400_000).toFixed(1)
        : null;
    return {
        id: t.id,
        summary: t.summary ?? null,
        status_name: t.status?.name ?? null,
        status_id: t.status?.id ?? null,
        board_id: t.board?.id ?? null,
        board_name: t.board?.name ?? null,
        priority_id: t.priority?.id ?? null,
        priority_name: t.priority?.name ?? null,
        priority_sort: t.priority?.sort ?? null,
        company_id: t.company?.id ?? null,
        company_name: t.company?.name ?? null,
        contact_id: t.contact?.id ?? null,
        contact_name: t.contact?.name ?? t.contactName ?? null,
        resources: t.resources ?? null,
        assigned_resource: t.owner?.name ?? t.resources ?? null,
        date_entered: dateEntered,
        date_closed: t.closedDate ?? null,
        last_updated: t._info?.lastUpdated ?? null,
        required_date: t.requiredDate ?? null,
        date_next_action: t.dateNextAction ?? null,
        actual_hours: t.actualHours ?? null,
        age_days: ageDays,
        sla_status: t.slaStatus ?? null,
        sla_respond_minutes: t.respondedMinutes ?? null,
        sla_resolve_minutes: t.resolutionMinutes ?? null,
        sla_resolution_minutes: t.resolutionMinutes ?? null,
        minutes_until_breach: null,
        raw: t,
        synced_at: new Date().toISOString(),
    };
}

interface FetchOpts {
    boardIds: number[];
    conditions?: string[];
    pageSize?: number;
}

export async function fetchTickets({ boardIds, conditions = [], pageSize = 1000 }: FetchOpts) {
    if (!boardIds.length) return [];
    const boardClause = `board/id in (${boardIds.join(',')})`;
    const fullConditions = cwConditions([boardClause, ...conditions]);
    return cwFetchAll<CwTicket>(
        '/service/tickets',
        { conditions: fullConditions, orderBy: '_info/dateEntered desc' },
        pageSize,
    );
}

export function startOfTodayUtc() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return cwDate(d);
}
