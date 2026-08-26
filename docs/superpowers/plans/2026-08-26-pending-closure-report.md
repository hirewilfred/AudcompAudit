# Pending Closure Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Pending Closure Report — a per-resource live view of the pending-closure queue separating real work from white noise, with effort distribution, editable daily notes, and resource grouping.

**Architecture:** A new `cw_time_entries` sync scope makes "no time entries" computable, which is the white-noise rule. Report figures derive live per request from pure functions in `src/lib/connectwise/kpi.ts`; no stored aggregates. Two small config tables (`cw_resource_groups`, `cw_resource_notes`) hold the human-supplied grouping and commentary that ConnectWise cannot provide.

**Tech Stack:** Next.js 16 (App Router, `runtime = 'nodejs'`), TypeScript, Supabase (Postgres + RLS), Tailwind, lucide-react icons, ConnectWise Manage REST v3.0.

**Spec:** `docs/superpowers/specs/2026-08-26-pending-closure-report-design.md`

## Global Constraints

- **White noise** = ticket has **zero** rows in `cw_time_entries`. Never `actual_hours = 0` or `IS NULL`.
- **Hours** = `SUM(cw_time_entries.actual_hours)` for the ticket, **not** `cw_tickets.actual_hours`.
- **Resource identity** = `cw_tickets.owner_identifier` (CW owner identifier, e.g. `agarrido`). Never `assigned_resource`.
- **Resource-owned** = `owner_identifier IS NOT NULL`. Unassigned tickets are excluded from this report.
- **Board scope** = board has any of `monitor_today`, `monitor_pending_closure`, `monitor_sla` set true.
- **Pending statuses** come from `CW_PENDING_CLOSURE_STATUSES` (comma-separated, default `Pending Closure`). Never hardcode the literal.
- **All sync/report writes** use `createAdminClient()` from `@/lib/supabase/admin` (service role). User-initiated writes (notes, groups) use `createClient()` from `@/lib/supabase/server` so RLS and `auth.uid()` apply.
- **Every API route** starts with `export const runtime = 'nodejs';`.
- **Percentages** round to one decimal.
- **No test runner exists in this project.** Do not write pytest/vitest/jest files. Verification is `npx tsc --noEmit`, `npx eslint <changed files>`, and SQL/HTTP checks specified per task.

---

### Task 1: Schema migration

**Files:**
- Create: `supabase/migrations/20260826_pending_closure_report.sql`

**Interfaces:**
- Produces: tables `cw_time_entries`, `cw_resource_groups`, `cw_resource_notes`; column `cw_tickets.owner_identifier`.

- [ ] **Step 1: Write the migration**

```sql
-- Pending Closure Report: time entries, resource groups, daily notes.

alter table public.cw_tickets add column if not exists owner_identifier text;
create index if not exists cw_tickets_owner_identifier_idx
    on public.cw_tickets(owner_identifier);

create table if not exists public.cw_time_entries (
    id                 int primary key,
    ticket_id          int,
    member_identifier  text,
    member_name        text,
    actual_hours       numeric,
    time_start         timestamptz,
    work_type          text,
    raw                jsonb,
    synced_at          timestamptz not null default now()
);
create index if not exists cw_time_entries_ticket_idx  on public.cw_time_entries(ticket_id);
create index if not exists cw_time_entries_member_idx  on public.cw_time_entries(member_identifier);
create index if not exists cw_time_entries_start_idx   on public.cw_time_entries(time_start desc);

create table if not exists public.cw_resource_groups (
    resource_identifier text primary key,
    display_name        text,
    group_name          text not null default 'Ungrouped',
    sort_order          int  not null default 0,
    active              boolean not null default true,
    updated_at          timestamptz not null default now()
);

create table if not exists public.cw_resource_notes (
    id                  uuid primary key default gen_random_uuid(),
    report_date         date not null,
    resource_identifier text not null,
    note                text not null default '',
    updated_by          uuid,
    updated_at          timestamptz not null default now(),
    unique (report_date, resource_identifier)
);
create index if not exists cw_resource_notes_date_idx on public.cw_resource_notes(report_date);

alter table public.cw_time_entries   enable row level security;
alter table public.cw_resource_groups enable row level security;
alter table public.cw_resource_notes  enable row level security;

-- Read: staff/admin, matching the cw_* pattern.
drop policy if exists cw_time_entries_staff_read   on public.cw_time_entries;
drop policy if exists cw_resource_groups_staff_read on public.cw_resource_groups;
drop policy if exists cw_resource_notes_staff_read  on public.cw_resource_notes;

create policy cw_time_entries_staff_read    on public.cw_time_entries    for select using (public.is_staff_or_admin());
create policy cw_resource_groups_staff_read on public.cw_resource_groups for select using (public.is_staff_or_admin());
create policy cw_resource_notes_staff_read  on public.cw_resource_notes  for select using (public.is_staff_or_admin());

-- Groups and notes are edited from the UI by a logged-in staff user, so unlike
-- the sync-written tables these need INSERT/UPDATE policies.
drop policy if exists cw_resource_groups_staff_write on public.cw_resource_groups;
create policy cw_resource_groups_staff_write on public.cw_resource_groups
    for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

drop policy if exists cw_resource_notes_staff_write on public.cw_resource_notes;
create policy cw_resource_notes_staff_write on public.cw_resource_notes
    for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

-- cw_time_entries is sync-written via the service role: no INSERT policy, by design.
```

- [ ] **Step 2: Apply it**

Apply via the Supabase SQL editor or MCP `apply_migration`. Every statement is `if not exists` / `drop policy if exists`, so re-running is safe.

- [ ] **Step 3: Verify objects exist**

```sql
select c.relname, c.relrowsecurity,
       (select count(*) from pg_policy p where p.polrelid=c.oid) as policies
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relname in ('cw_time_entries','cw_resource_groups','cw_resource_notes')
order by c.relname;
```

Expected: 3 rows, `relrowsecurity = true`, policies = 1 for `cw_time_entries`, 2 each for groups and notes.

```sql
select column_name from information_schema.columns
where table_schema='public' and table_name='cw_tickets' and column_name='owner_identifier';
```

Expected: 1 row.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260826_pending_closure_report.sql
git commit -m "feat: schema for pending closure report"
```

---

### Task 2: Populate `owner_identifier` on sync

**Files:**
- Modify: `src/lib/connectwise/tickets.ts` (interface `TicketRow`, function `ticketToRow`)

**Interfaces:**
- Consumes: `cw_tickets.owner_identifier` from Task 1.
- Produces: `TicketRow.owner_identifier: string | null`.

`CwTicket.owner` is already typed as `{ identifier: string; name: string }` — no interface change needed on the input side.

- [ ] **Step 1: Add the field to `TicketRow`**

In the `TicketRow` interface, immediately after `assigned_resource: string | null;`:

```ts
    owner_identifier: string | null;
```

- [ ] **Step 2: Populate it in `ticketToRow`**

In the returned object, immediately after `assigned_resource: t.owner?.name ?? t.resources ?? null,`:

```ts
        owner_identifier: t.owner?.identifier ?? null,
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Backfill existing rows**

Existing tickets have `owner_identifier` null until they next sync. Backfill from the stored JSONB:

```sql
update public.cw_tickets
set owner_identifier = raw->'owner'->>'identifier'
where owner_identifier is null and raw->'owner'->>'identifier' is not null;
```

Verify:

```sql
select count(*) filter (where owner_identifier is not null) as with_owner,
       count(*) filter (where owner_identifier is null) as without_owner
from public.cw_tickets;
```

Expected: `with_owner` > 0. `without_owner` is the genuinely unassigned set.

- [ ] **Step 5: Commit**

```bash
git add src/lib/connectwise/tickets.ts
git commit -m "feat: store owner_identifier on synced tickets"
```

---

### Task 3: Shared board-scope helper

**Files:**
- Create: `src/lib/connectwise/boards.ts`
- Modify: `src/app/api/connectwise/tickets/route.ts`
- Modify: `src/app/api/connectwise/tech-kpis/route.ts`

**Interfaces:**
- Produces: `selectedBoardIds(supabase): Promise<number[]>` — board ids with any monitor flag set.

- [ ] **Step 1: Create the helper**

```ts
import type { SupabaseClient } from '@supabase/supabase-js';

// A board is in scope when any of the three monitor flags is set. Used by the
// report and the KPI routes so deselecting a board in Settings actually removes
// its tickets from the views, rather than leaving stale rows visible.
export async function selectedBoardIds(
    supabase: SupabaseClient<never, 'public', never>,
): Promise<number[]> {
    const { data, error } = await supabase
        .from('cw_monitored_boards')
        .select('board_id')
        .or('monitor_today.eq.true,monitor_pending_closure.eq.true,monitor_sla.eq.true');
    if (error) throw new Error(`selectedBoardIds: ${error.message}`);
    return (data ?? []).map((r: { board_id: number }) => r.board_id);
}
```

- [ ] **Step 2: Apply scoping in the tickets route**

In `src/app/api/connectwise/tickets/route.ts`, add the import:

```ts
import { selectedBoardIds } from '@/lib/connectwise/boards';
```

Replace the existing board-param block:

```ts
    const boardParam = url.searchParams.get('boards');
    if (boardParam) {
        const ids = boardParam.split(',').map(s => parseInt(s, 10)).filter(Number.isFinite);
        if (ids.length) q = q.in('board_id', ids);
    }
```

with:

```ts
    // Explicit ?boards= wins; otherwise scope to the boards ticked in Settings.
    const boardParam = url.searchParams.get('boards');
    const explicit = boardParam
        ? boardParam.split(',').map(s => parseInt(s, 10)).filter(Number.isFinite)
        : [];
    const boardIds = explicit.length ? explicit : await selectedBoardIds(supabase);
    // No boards selected means no scope, not "everything" — same contract as the daily sync.
    if (!boardIds.length) return NextResponse.json({ ok: true, tickets: [] });
    q = q.in('board_id', boardIds);
```

- [ ] **Step 3: Apply scoping in the tech-kpis route**

In `src/app/api/connectwise/tech-kpis/route.ts`, add the import as above. Replace the query block:

```ts
    const { data, error } = await supabase
        .from('cw_tickets')
        .select('id, assigned_resource, resources, date_entered, date_closed, actual_hours, board_id')
        .or(`date_entered.gte.${new Date(sinceMs).toISOString()},date_closed.gte.${new Date(sinceMs).toISOString()}`);
```

with:

```ts
    const boardIds = await selectedBoardIds(supabase);
    if (!boardIds.length) {
        return NextResponse.json({ ok: true, days, rows: [] });
    }
    const { data, error } = await supabase
        .from('cw_tickets')
        .select('id, assigned_resource, resources, date_entered, date_closed, actual_hours, board_id')
        .in('board_id', boardIds)
        .or(`date_entered.gte.${new Date(sinceMs).toISOString()},date_closed.gte.${new Date(sinceMs).toISOString()}`);
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` → exit 0
Run: `npx eslint src/lib/connectwise/boards.ts src/app/api/connectwise/tickets/route.ts src/app/api/connectwise/tech-kpis/route.ts` → exit 0

Confirm the scope matches what SQL says:

```sql
select count(*) from public.cw_monitored_boards
where monitor_today or monitor_pending_closure or monitor_sla;
```

Expected at time of writing: 6.

- [ ] **Step 5: Commit**

```bash
git add src/lib/connectwise/boards.ts src/app/api/connectwise/tickets/route.ts src/app/api/connectwise/tech-kpis/route.ts
git commit -m "feat: scope ticket and tech KPI queries to selected boards"
```

---

### Task 4: Time-entry sync

**Files:**
- Create: `src/lib/connectwise/timeEntries.ts`
- Create: `src/app/api/connectwise/sync/time-entries/route.ts`
- Modify: `vercel.json`
- Modify: `.env.local` (document the new var)

**Interfaces:**
- Consumes: `cwFetchAll`, `cwConditions`, `cwDate` from `@/lib/connectwise/client`; `cw_time_entries` from Task 1.
- Produces: `CwTimeEntry`, `TimeEntryRow`, `timeEntryToRow(e)`, `fetchTimeEntries(days)`.

- [ ] **Step 1: Create the mapper and fetcher**

```ts
import { cwFetchAll, cwConditions, cwDate } from './client';

export interface CwTimeEntry {
    id: number;
    chargeToId?: number;
    chargeToType?: string;
    member?: { id: number; identifier: string; name: string };
    actualHours?: number;
    timeStart?: string;
    workType?: { id: number; name: string };
}

export interface TimeEntryRow {
    id: number;
    ticket_id: number | null;
    member_identifier: string | null;
    member_name: string | null;
    actual_hours: number | null;
    time_start: string | null;
    work_type: string | null;
    raw: CwTimeEntry;
    synced_at: string;
}

export function timeEntryToRow(e: CwTimeEntry): TimeEntryRow {
    return {
        id: e.id,
        ticket_id: e.chargeToId ?? null,
        member_identifier: e.member?.identifier ?? null,
        member_name: e.member?.name ?? null,
        actual_hours: e.actualHours ?? null,
        time_start: e.timeStart ?? null,
        work_type: e.workType?.name ?? null,
        raw: e,
        synced_at: new Date().toISOString(),
    };
}

export const TIME_ENTRY_WINDOW_DAYS = Number(process.env.CW_TIME_ENTRY_WINDOW_DAYS || 30);

// Only ServiceTicket entries matter here — CW also charges time to activities,
// projects and charge codes, none of which belong to a ticket.
export async function fetchTimeEntries(days = TIME_ENTRY_WINDOW_DAYS) {
    const since = new Date(Date.now() - days * 86_400_000);
    const conditions = cwConditions([
        `chargeToType="ServiceTicket"`,
        `timeStart >= ${cwDate(since)}`,
    ]);
    return cwFetchAll<CwTimeEntry>('/time/entries', { conditions, orderBy: 'id desc' });
}
```

- [ ] **Step 2: Create the sync route**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logSyncRun } from '@/lib/connectwise/sync';
import { authorizeSync } from '@/lib/connectwise/auth';
import { fetchTimeEntries, timeEntryToRow, TIME_ENTRY_WINDOW_DAYS } from '@/lib/connectwise/timeEntries';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    const unauth = await authorizeSync(req);
    if (unauth) return unauth;
    try {
        const result = await logSyncRun('time_entries', async () => {
            const supabase = createAdminClient();
            const entries = await fetchTimeEntries();
            const rows = entries.map(timeEntryToRow).filter(r => r.ticket_id != null);
            if (rows.length) {
                const { error } = await supabase
                    .from('cw_time_entries')
                    .upsert(rows, { onConflict: 'id' });
                if (error) throw error;
            }
            return { count: rows.length, meta: { window_days: TIME_ENTRY_WINDOW_DAYS } };
        });
        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 502 });
    }
}

export const GET = POST;
```

- [ ] **Step 3: Add the cron entry**

In `vercel.json`, add to the `crons` array, after the `daily` entry:

```json
        {
            "path": "/api/connectwise/sync/time-entries",
            "schedule": "*/15 * * * *"
        },
```

- [ ] **Step 4: Document the env var**

Add to `.env.local` under the ConnectWise block:

```
# Rolling window for the time-entry sync. Bounds volume; the endpoint would
# otherwise return full history.
CW_TIME_ENTRY_WINDOW_DAYS=30
```

Note for the implementer: this must also be set in the Vercel project env, or the default of 30 applies.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` → exit 0
Run: `npx eslint src/lib/connectwise/timeEntries.ts src/app/api/connectwise/sync/time-entries/route.ts` → exit 0

Trigger one sync (logged-in staff session, or Bearer `CRON_SECRET`), then:

```sql
select scope, record_count, success, error_message, meta
from public.cw_sync_runs where scope='time_entries'
order by started_at desc limit 1;
```

Expected: `success = true`, `record_count` > 0.

```sql
select count(*) as entries, count(distinct ticket_id) as tickets,
       count(distinct member_identifier) as members
from public.cw_time_entries;
```

Expected: all three > 0, and `member_identifier` values look like `agarrido`, `skaur`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/connectwise/timeEntries.ts src/app/api/connectwise/sync/time-entries/route.ts vercel.json .env.local
git commit -m "feat: sync ConnectWise time entries"
```

---

### Task 5: Report derivation functions

**Files:**
- Create: `src/lib/connectwise/kpi.ts`

**Interfaces:**
- Produces: `ReportTicket`, `ResourceRow`, `OverallStats`, `isWhiteNoise(t)`, `rollupByResource(tickets)`, `overallStats(tickets)`, `pct(part, total)`.

Pure functions, no I/O — importable from both routes and client components, and unit-testable the moment a runner exists.

- [ ] **Step 1: Create the module**

```ts
// Derivation rules for the Pending Closure Report.
//
// White noise means the ticket has NO time entries. This is deliberately not
// `actual_hours = 0` or NULL: no actual_hours threshold reproduces the
// published report's numbers. Hours likewise come from summed time entries,
// so "real" and "hours" always agree on their source.

export interface ReportTicket {
    id: number;
    owner_identifier: string;
    entry_count: number;
    hours: number;
}

export interface ResourceRow {
    resource: string;
    display_name: string;
    real: number;
    white_noise: number;
    total: number;
    under_1hr: number;
    over_1hr: number;
    avg_hours: number;
}

export interface OverallStats {
    total: number;
    real: number;
    real_pct: number;
    white_noise: number;
    white_noise_pct: number;
    under_1hr: number;
    under_1hr_pct: number;
    over_1hr: number;
    over_1hr_pct: number;
}

export function isWhiteNoise(t: ReportTicket): boolean {
    return t.entry_count === 0;
}

export function pct(part: number, total: number): number {
    if (!total) return 0;
    return +((part / total) * 100).toFixed(1);
}

export function rollupByResource(
    tickets: ReportTicket[],
    displayNames: Record<string, string> = {},
): ResourceRow[] {
    const acc = new Map<string, { real: number; wn: number; total: number; u1: number; o1: number; hours: number }>();
    for (const t of tickets) {
        const cur = acc.get(t.owner_identifier)
            ?? { real: 0, wn: 0, total: 0, u1: 0, o1: 0, hours: 0 };
        cur.total += 1;
        if (isWhiteNoise(t)) cur.wn += 1; else cur.real += 1;
        if (t.hours < 1) cur.u1 += 1; else cur.o1 += 1;
        cur.hours += t.hours;
        acc.set(t.owner_identifier, cur);
    }
    return [...acc.entries()]
        .map(([resource, d]) => ({
            resource,
            display_name: displayNames[resource] ?? resource,
            real: d.real,
            white_noise: d.wn,
            total: d.total,
            under_1hr: d.u1,
            over_1hr: d.o1,
            avg_hours: d.total ? +(d.hours / d.total).toFixed(2) : 0,
        }))
        .sort((a, b) => b.real - a.real || b.total - a.total);
}

export function overallStats(tickets: ReportTicket[]): OverallStats {
    const total = tickets.length;
    const white_noise = tickets.filter(isWhiteNoise).length;
    const real = total - white_noise;
    const under_1hr = tickets.filter(t => t.hours < 1).length;
    const over_1hr = total - under_1hr;
    return {
        total,
        real, real_pct: pct(real, total),
        white_noise, white_noise_pct: pct(white_noise, total),
        under_1hr, under_1hr_pct: pct(under_1hr, total),
        over_1hr, over_1hr_pct: pct(over_1hr, total),
    };
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` → exit 0
Run: `npx eslint src/lib/connectwise/kpi.ts` → exit 0

- [ ] **Step 3: Commit**

```bash
git add src/lib/connectwise/kpi.ts
git commit -m "feat: pending closure report derivation rules"
```

---

### Task 6: Report API route

**Files:**
- Create: `src/app/api/connectwise/pending-closure-report/route.ts`

**Interfaces:**
- Consumes: `selectedBoardIds` (Task 3), `rollupByResource` / `overallStats` / `ReportTicket` (Task 5), `owner_identifier` (Task 2), `cw_time_entries` (Task 4).
- Produces: `GET /api/connectwise/pending-closure-report?date=YYYY-MM-DD`.

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { selectedBoardIds } from '@/lib/connectwise/boards';
import { rollupByResource, overallStats, type ReportTicket } from '@/lib/connectwise/kpi';

export const runtime = 'nodejs';

const PENDING_STATUS_NAMES = (process.env.CW_PENDING_CLOSURE_STATUSES || 'Pending Closure')
    .split(',').map(s => s.trim()).filter(Boolean);

interface TicketPick { id: number; owner_identifier: string | null; assigned_resource: string | null }
interface EntryPick { ticket_id: number | null; actual_hours: number | null }
interface GroupPick { resource_identifier: string; display_name: string | null; group_name: string; sort_order: number }
interface NotePick { resource_identifier: string; note: string }

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);
    const supabase = await createClient();

    const boardIds = await selectedBoardIds(supabase);
    if (!boardIds.length) {
        return NextResponse.json({ ok: true, date, overall: overallStats([]), groups: [] });
    }

    // Resource-owned pending closure only: unassigned tickets are out of scope.
    const { data: tickets, error: tErr } = await supabase
        .from('cw_tickets')
        .select('id, owner_identifier, assigned_resource')
        .in('status_name', PENDING_STATUS_NAMES)
        .in('board_id', boardIds)
        .is('date_closed', null)
        .not('owner_identifier', 'is', null);
    if (tErr) return NextResponse.json({ ok: false, error: tErr.message }, { status: 500 });

    const rows = (tickets ?? []) as TicketPick[];
    const ids = rows.map(t => t.id);

    let entries: EntryPick[] = [];
    if (ids.length) {
        const { data: e, error: eErr } = await supabase
            .from('cw_time_entries')
            .select('ticket_id, actual_hours')
            .in('ticket_id', ids);
        if (eErr) return NextResponse.json({ ok: false, error: eErr.message }, { status: 500 });
        entries = (e ?? []) as EntryPick[];
    }

    const counts = new Map<number, { n: number; hours: number }>();
    for (const e of entries) {
        if (e.ticket_id == null) continue;
        const cur = counts.get(e.ticket_id) ?? { n: 0, hours: 0 };
        cur.n += 1;
        cur.hours += e.actual_hours ?? 0;
        counts.set(e.ticket_id, cur);
    }

    const reportTickets: ReportTicket[] = rows.map(t => {
        const c = counts.get(t.id) ?? { n: 0, hours: 0 };
        return {
            id: t.id,
            owner_identifier: t.owner_identifier as string,
            entry_count: c.n,
            hours: c.hours,
        };
    });

    const { data: groupRows } = await supabase
        .from('cw_resource_groups')
        .select('resource_identifier, display_name, group_name, sort_order');
    const { data: noteRows } = await supabase
        .from('cw_resource_notes')
        .select('resource_identifier, note')
        .eq('report_date', date);

    const groups = (groupRows ?? []) as GroupPick[];
    const notes = (noteRows ?? []) as NotePick[];

    const displayNames: Record<string, string> = {};
    for (const g of groups) if (g.display_name) displayNames[g.resource_identifier] = g.display_name;
    // Fall back to the CW display name when no group row overrides it.
    for (const t of rows) {
        if (t.owner_identifier && !displayNames[t.owner_identifier] && t.assigned_resource) {
            displayNames[t.owner_identifier] = t.assigned_resource;
        }
    }

    const groupOf = new Map(groups.map(g => [g.resource_identifier, g]));
    const noteOf = new Map(notes.map(n => [n.resource_identifier, n.note]));

    const resourceRows = rollupByResource(reportTickets, displayNames);

    const bucketed = new Map<string, { group_name: string; sort: number; resources: unknown[] }>();
    for (const r of resourceRows) {
        const g = groupOf.get(r.resource);
        const name = g?.group_name ?? 'Ungrouped';
        const bucket = bucketed.get(name) ?? { group_name: name, sort: g?.sort_order ?? 999, resources: [] };
        bucket.resources.push({ ...r, note: noteOf.get(r.resource) ?? '' });
        bucketed.set(name, bucket);
    }

    return NextResponse.json({
        ok: true,
        date,
        overall: overallStats(reportTickets),
        groups: [...bucketed.values()].sort((a, b) => a.sort - b.sort || a.group_name.localeCompare(b.group_name)),
    });
}
```

- [ ] **Step 2: Verify types and lint**

Run: `npx tsc --noEmit` → exit 0
Run: `npx eslint src/app/api/connectwise/pending-closure-report/route.ts` → exit 0

- [ ] **Step 3: Verify the figures against SQL**

The route's numbers must match a hand-run query. Run this and keep the output:

```sql
with sel as (
  select board_id from public.cw_monitored_boards
  where monitor_today or monitor_pending_closure or monitor_sla
),
base as (
  select t.id, t.owner_identifier,
         (select count(*) from public.cw_time_entries e where e.ticket_id = t.id) as entries,
         coalesce((select sum(e.actual_hours) from public.cw_time_entries e where e.ticket_id = t.id), 0) as hours
  from public.cw_tickets t join sel on sel.board_id = t.board_id
  where t.status_name = 'Pending Closure'
    and t.date_closed is null
    and t.owner_identifier is not null
)
select count(*) as total,
       count(*) filter (where entries > 0) as real_tickets,
       count(*) filter (where entries = 0) as white_noise,
       count(*) filter (where hours < 1)  as under_1hr,
       count(*) filter (where hours >= 1) as over_1hr
from base;
```

Then load the route as a signed-in staff user and confirm `overall` matches exactly. If they differ, the route is wrong — do not proceed.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/connectwise/pending-closure-report/route.ts
git commit -m "feat: pending closure report API"
```

---

### Task 7: Notes and groups write routes

**Files:**
- Create: `src/app/api/connectwise/resource-notes/route.ts`
- Create: `src/app/api/connectwise/resource-groups/route.ts`

**Interfaces:**
- Produces: `PUT /api/connectwise/resource-notes`, `PUT /api/connectwise/resource-groups`.

Both use the **session** client so RLS applies and `auth.uid()` is real. Do not use `createAdminClient()` here.

- [ ] **Step 1: Create the notes route**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function PUT(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => null);
    const report_date = body?.report_date as string | undefined;
    const resource_identifier = body?.resource_identifier as string | undefined;
    const note = (body?.note ?? '') as string;
    if (!report_date || !resource_identifier) {
        return NextResponse.json({ ok: false, error: 'report_date and resource_identifier are required' }, { status: 400 });
    }

    const { error } = await supabase
        .from('cw_resource_notes')
        .upsert(
            { report_date, resource_identifier, note, updated_by: user.id, updated_at: new Date().toISOString() },
            { onConflict: 'report_date,resource_identifier' },
        );
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Create the groups route**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function PUT(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => null);
    const resource_identifier = body?.resource_identifier as string | undefined;
    if (!resource_identifier) {
        return NextResponse.json({ ok: false, error: 'resource_identifier is required' }, { status: 400 });
    }

    const { error } = await supabase
        .from('cw_resource_groups')
        .upsert(
            {
                resource_identifier,
                display_name: body?.display_name ?? null,
                group_name: body?.group_name ?? 'Ungrouped',
                sort_order: Number(body?.sort_order ?? 0),
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'resource_identifier' },
        );
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` → exit 0
Run: `npx eslint src/app/api/connectwise/resource-notes/route.ts src/app/api/connectwise/resource-groups/route.ts` → exit 0

Save a note from the UI (or a signed-in fetch), then:

```sql
select report_date, resource_identifier, note, updated_by
from public.cw_resource_notes order by updated_at desc limit 3;
```

Expected: the row exists and `updated_by` is a real user id, not null. A null there means the route used the admin client — fix it.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/connectwise/resource-notes/route.ts src/app/api/connectwise/resource-groups/route.ts
git commit -m "feat: resource notes and groups write routes"
```

---

### Task 8: Pending Closure tab

**Files:**
- Modify: `src/app/admin/service-kpi/page.tsx`

**Interfaces:**
- Consumes: `GET /api/connectwise/pending-closure-report` (Task 6), `PUT /api/connectwise/resource-notes` (Task 7).

- [ ] **Step 1: Register the tab**

At line 7, extend the `Tab` union:

```ts
type Tab = 'today' | 'sla' | 'kpis' | 'pending' | 'settings';
```

In the `TABS` array, insert before the `settings` entry:

```ts
    { id: 'pending', label: 'Pending Closure', icon: ClipboardList },
```

Add `ClipboardList` to the existing `lucide-react` import.

In the render block near line 112, add alongside the other tab conditionals:

```tsx
                {tab === 'pending' && <PendingClosureTab />}
```

- [ ] **Step 2: Add the component**

Add this component next to the other tab components:

```tsx
interface PcResource {
    resource: string; display_name: string;
    real: number; white_noise: number; total: number;
    under_1hr: number; over_1hr: number; avg_hours: number; note: string;
}
interface PcGroup { group_name: string; resources: PcResource[] }
interface PcOverall {
    total: number; real: number; real_pct: number;
    white_noise: number; white_noise_pct: number;
    under_1hr: number; under_1hr_pct: number;
    over_1hr: number; over_1hr_pct: number;
}

function PendingClosureTab() {
    const today = new Date().toISOString().slice(0, 10);
    const [date, setDate] = useState(today);
    const [overall, setOverall] = useState<PcOverall | null>(null);
    const [groups, setGroups] = useState<PcGroup[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/connectwise/pending-closure-report?date=${date}`)
            .then(r => r.json())
            .then(d => { setOverall(d.overall ?? null); setGroups(d.groups ?? []); })
            .finally(() => setLoading(false));
    }, [date]);

    const saveNote = async (resource: string, note: string) => {
        await fetch('/api/connectwise/resource-notes', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ report_date: date, resource_identifier: resource, note }),
        });
    };

    const allResources = groups.flatMap(g => g.resources);

    return (
        <div className="space-y-6">
            <ActionBar
                left={<>Pending Closure Report — live from the current queue.</>}
                right={
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                    />
                }
            />

            {loading && <div className="text-sm text-slate-500">Loading…</div>}

            {overall && (
                <section className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="text-xs uppercase tracking-wider text-slate-500">Overall workload</div>
                        <div className="mt-1 text-3xl font-semibold text-slate-900">{overall.total}</div>
                        <div className="text-xs text-slate-500">resource-owned pending closure</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="text-xs uppercase tracking-wider text-slate-500">Signal vs. noise</div>
                        <div className="mt-1 text-sm text-slate-900">
                            Real <b>{overall.real}</b> ({overall.real_pct}%)
                        </div>
                        <div className="text-sm text-slate-900">
                            White noise <b>{overall.white_noise}</b> ({overall.white_noise_pct}%)
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="text-xs uppercase tracking-wider text-slate-500">Effort distribution</div>
                        <div className="mt-1 text-sm text-slate-900">
                            &lt;1 hr <b>{overall.under_1hr}</b> ({overall.under_1hr_pct}%)
                        </div>
                        <div className="text-sm text-slate-900">
                            &ge;1 hr <b>{overall.over_1hr}</b> ({overall.over_1hr_pct}%)
                        </div>
                    </div>
                </section>
            )}

            {groups.map(g => (
                <section key={g.group_name} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100">
                        <SectionTitle>{g.group_name}</SectionTitle>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {g.resources.map(r => (
                            <div key={r.resource} className="px-5 py-3">
                                <div className="text-sm font-semibold text-slate-900">
                                    {r.display_name} <span className="font-normal text-slate-500">— {r.real} real tickets</span>
                                </div>
                                <textarea
                                    defaultValue={r.note}
                                    onBlur={e => saveNote(r.resource, e.target.value)}
                                    placeholder="Add commentary for this resource…"
                                    className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                                    rows={2}
                                />
                            </div>
                        ))}
                    </div>
                </section>
            ))}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100"><SectionTitle>Pending Closure — Resource Table</SectionTitle></div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="text-left px-4 py-2.5 font-semibold">Resource</th>
                                <th className="text-right px-4 py-2.5 font-semibold">Real</th>
                                <th className="text-right px-4 py-2.5 font-semibold">White Noise</th>
                                <th className="text-right px-4 py-2.5 font-semibold">Total</th>
                                <th className="text-right px-4 py-2.5 font-semibold">&lt;1 hr</th>
                                <th className="text-right px-4 py-2.5 font-semibold">&ge;1 hr</th>
                                <th className="text-right px-4 py-2.5 font-semibold">Avg hrs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {allResources.map(r => (
                                <tr key={r.resource}>
                                    <td className="px-4 py-2">{r.resource}</td>
                                    <td className="px-4 py-2 text-right">{r.real}</td>
                                    <td className="px-4 py-2 text-right">{r.white_noise}</td>
                                    <td className="px-4 py-2 text-right">{r.total}</td>
                                    <td className="px-4 py-2 text-right">{r.under_1hr}</td>
                                    <td className="px-4 py-2 text-right">{r.over_1hr}</td>
                                    <td className="px-4 py-2 text-right">{r.avg_hours.toFixed(2)}</td>
                                </tr>
                            ))}
                            {!allResources.length && !loading && (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No resource-owned pending closure tickets</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` → exit 0
Run: `npx eslint src/app/admin/service-kpi/page.tsx` → must not introduce **new** errors (the repo has pre-existing ones; compare counts before and after).

Load the tab as a staff user. Confirm the three summary cards match the SQL from Task 6 Step 3, and that typing in a note box and clicking away persists it (reload the page).

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/service-kpi/page.tsx
git commit -m "feat: pending closure report tab"
```

---

### Task 9: Resource grouping in Settings

**Files:**
- Modify: `src/app/admin/service-kpi/page.tsx` (the `SettingsTab` component)

**Interfaces:**
- Consumes: `PUT /api/connectwise/resource-groups` (Task 7), `GET /api/connectwise/pending-closure-report` (Task 6) for the resource list.

- [ ] **Step 1: Add the Resources section**

Inside `SettingsTab`, after the Boards `<section>`, add:

```tsx
            <ResourceGroupsSection />
```

Then add the component:

```tsx
const GROUP_OPTIONS = ['Help Desk', 'Maintenance & Escalation', 'Project Resources', 'Ungrouped'];

function ResourceGroupsSection() {
    const [rows, setRows] = useState<{ resource: string; display_name: string; group_name: string }[]>([]);

    const load = async () => {
        const today = new Date().toISOString().slice(0, 10);
        const r = await fetch(`/api/connectwise/pending-closure-report?date=${today}`).then(r => r.json());
        const flat = (r.groups ?? []).flatMap((g: PcGroup) =>
            g.resources.map(res => ({ resource: res.resource, display_name: res.display_name, group_name: g.group_name })));
        setRows(flat);
    };
    useEffect(() => { load(); }, []);

    const setGroup = async (resource: string, group_name: string, display_name: string) => {
        setRows(rs => rs.map(r => r.resource === resource ? { ...r, group_name } : r));
        await fetch('/api/connectwise/resource-groups', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resource_identifier: resource, group_name, display_name }),
        });
    };

    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100"><SectionTitle>Resources</SectionTitle></div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                        <tr>
                            <th className="text-left px-4 py-2.5 font-semibold">Resource</th>
                            <th className="text-left px-4 py-2.5 font-semibold">Name</th>
                            <th className="text-left px-4 py-2.5 font-semibold">Group</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map(r => (
                            <tr key={r.resource}>
                                <td className="px-4 py-2 font-mono text-xs">{r.resource}</td>
                                <td className="px-4 py-2">{r.display_name}</td>
                                <td className="px-4 py-2">
                                    <select
                                        value={r.group_name}
                                        onChange={e => setGroup(r.resource, e.target.value, r.display_name)}
                                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                                    >
                                        {GROUP_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </td>
                            </tr>
                        ))}
                        {!rows.length && (
                            <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No resources with pending closure tickets yet</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` → exit 0

Assign a group in the UI, then confirm persistence:

```sql
select resource_identifier, display_name, group_name from public.cw_resource_groups order by group_name, resource_identifier;
```

Reload the Pending Closure tab and confirm the resource now renders under its assigned group heading rather than Ungrouped.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/service-kpi/page.tsx
git commit -m "feat: assign resources to report groups in settings"
```

---

## Self-Review Notes

**Spec coverage:** every spec section maps to a task — data model → Task 1; `owner_identifier` → Task 2; board scope → Task 3; time-entry sync → Task 4; derivation → Task 5; report API → Task 6; notes/groups APIs → Task 7; report UI → Task 8; settings UI → Task 9.

**Known gap, deliberate:** the spec's `PcGroup` type is defined in Task 8 and reused in Task 9. Task 9 must be implemented after Task 8, or that type will be undefined.

**Out of scope, per spec:** snapshots/history, PDF export, auto-drafted narrative, multi-select Settings chips, unassigned tickets.
