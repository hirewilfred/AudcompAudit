# Pending Closure Report — Design

Date: 2026-08-26
Status: Approved for planning

## Purpose

The Service KPI dashboard exists to produce the **Pending Closure Report**: a
per-resource daily view of the pending-closure queue that separates real work
from "white noise" and shows how effort is distributed.

The report's published shape (Aug 25, 2026) is the target:

- Overall workload — total resource-owned pending-closure tickets
- Signal vs. noise — real vs. white noise, with percentages
- Effort distribution — tickets under 1 hour vs. 1 hour or more
- Narrative sections grouped by resource type
- A resource table: real, white noise, total, `<1hr`, `>=1hr`, avg hrs/ticket

## Definitions

These are the decisions that drive everything else.

**White noise** — a ticket with **no time entries** in ConnectWise. Not
`actual_hours = 0`, and not `actual_hours IS NULL`. Verified against live data:
no `actual_hours` threshold reproduces the published Aug 25 numbers, so the
classification cannot be derived from the ticket record alone.

**Real ticket** — a ticket with one or more time entries.

**Resource-owned** — `owner_identifier IS NOT NULL`. Unassigned tickets are
excluded from the report entirely. This is significant: as of writing, 42
pending-closure tickets are unassigned and 40 of those have no logged time. They
do not appear in this report.

**Resource identity** — the ConnectWise **owner identifier** (`agarrido`,
`skaur`, `omirza`), not the display name. `assigned_resource` holds display
names and splits the same person across rows (`gsingh` vs `Gundeep Singh`).

**Hours** — the **sum of time-entry `actualHours`** for the ticket, not
`cw_tickets.actual_hours`.

> Stated assumption: these two sources disagree in live data. Because white
> noise is defined by time entries, the hour buckets derive from the same
> source; otherwise a ticket could count as "real" while contributing zero
> hours. If the published report's hour buckets actually come from
> `actual_hours`, this needs revisiting before implementation.

**Board scope** — a board counts as selected when any of `monitor_today`,
`monitor_pending_closure` or `monitor_sla` is true.

## Known limitation: no history

The report is **live view only**, per decision. The database holds the current
queue; pending-closure tickets leave it as they close.

Consequences, accepted:

- Past reports cannot be reproduced. The Aug 25 report cannot be regenerated.
- No trending of white-noise percentage over time.
- Daily notes are stored against a date, but the numbers they annotate are not.
  A note from last Tuesday will render beside today's figures.

Adding `cw_report_snapshots` (a frozen per-resource row per day) is the change
that lifts all three. Explicitly out of scope here.

## Data model

### New: `cw_time_entries`

Synced from `/time/entries`, filtered to `chargeToType = 'ServiceTicket'`.

| Column | Type | Source |
|---|---|---|
| `id` | int PK | `id` |
| `ticket_id` | int | `chargeToId` |
| `member_identifier` | text | `member.identifier` |
| `member_name` | text | `member.name` |
| `actual_hours` | numeric | `actualHours` |
| `time_start` | timestamptz | `timeStart` |
| `work_type` | text | `workType.name` |
| `raw` | jsonb | whole record |
| `synced_at` | timestamptz | now() |

Indexes: `ticket_id`, `member_identifier`, `time_start desc`.

### New: `cw_resource_groups`

| Column | Type | Notes |
|---|---|---|
| `resource_identifier` | text PK | matches `owner_identifier` |
| `display_name` | text | for presentation |
| `group_name` | text | e.g. Help Desk, Maintenance & Escalation, Project Resources |
| `sort_order` | int | ordering within group |
| `active` | boolean | default true |

Resources with no row render in an "Ungrouped" section rather than vanishing.

### New: `cw_resource_notes`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `report_date` | date | |
| `resource_identifier` | text | |
| `note` | text | |
| `updated_by` | uuid | auth.uid() |
| `updated_at` | timestamptz | |

Unique on `(report_date, resource_identifier)`.

### Changed: `cw_tickets`

Add `owner_identifier text`, populated in `ticketToRow` from
`raw.owner.identifier`. Indexed. Today this value is only reachable through
JSONB traversal, which cannot be indexed cleanly and would appear in every
report query.

### RLS

All three new tables follow the established pattern from
`20260512_connectwise_rls_indexes.sql`: RLS enabled, staff/admin `SELECT` via
`is_staff_or_admin()`, no INSERT policies — sync writes go through the
service-role client. `cw_resource_notes` and `cw_resource_groups` additionally
need staff INSERT/UPDATE policies, since they are edited from the UI by a
logged-in user rather than written by a sync.

## Sync

New route `POST|GET /api/connectwise/sync/time-entries`, matching the existing
six: `authorizeSync()` first, `logSyncRun('time_entries', ...)`, writes via
`createAdminClient()`.

Fetches `/time/entries` with a `timeStart` condition over a rolling window,
default 30 days, overridable via `CW_TIME_ENTRY_WINDOW_DAYS`. The window bounds
volume; without it the endpoint returns the full history.

Cron: every 15 minutes, alongside `daily`.

## Derivation

Computed per request. No stored aggregates.

```
base = cw_tickets
       where status_name in PENDING_STATUS_NAMES
         and date_closed is null
         and board_id in (selected board ids)
         and owner_identifier is not null

per ticket:
  entries = count of cw_time_entries where ticket_id = ticket.id
  hours   = sum of those entries' actual_hours (0 when none)

classification:
  white noise = entries == 0
  real        = entries > 0

buckets:
  under_1hr = hours < 1
  over_1hr  = hours >= 1

per resource (grouped by owner_identifier):
  real, white_noise, total, under_1hr, over_1hr
  avg_hours = sum(hours) / total

overall:
  total, real + pct, white_noise + pct, under_1hr + pct, over_1hr + pct
```

Percentages round to one decimal, matching the published report (64.9% / 35.1%).

Division-by-zero guard: a resource with zero tickets does not appear; overall
percentages render as 0 when total is 0.

## API

**`GET /api/connectwise/pending-closure-report?date=YYYY-MM-DD`**

`date` selects which notes to attach; figures are always live. Defaults to
today.

```json
{
  "ok": true,
  "date": "2026-08-26",
  "overall": {
    "total": 131,
    "real": 85, "real_pct": 64.9,
    "white_noise": 46, "white_noise_pct": 35.1,
    "under_1hr": 103, "under_1hr_pct": 78.6,
    "over_1hr": 28, "over_1hr_pct": 21.4
  },
  "groups": [
    { "group_name": "Help Desk",
      "resources": [
        { "resource": "agarrido", "display_name": "Antonio Garrido",
          "real": 20, "white_noise": 9, "total": 29,
          "under_1hr": 28, "over_1hr": 1, "avg_hours": 0.30,
          "note": "..." }
      ] }
  ]
}
```

**`PUT /api/connectwise/resource-notes`** — body `{ report_date,
resource_identifier, note }`. Upserts on the unique key. Staff/admin session
required; uses the session client so RLS applies and `updated_by` is real.

**`PUT /api/connectwise/resource-groups`** — assigns `group_name` and
`sort_order` for a resource. Staff/admin only.

Both existing routes (`tickets`, `tech-kpis`) gain board scoping via a shared
`selectedBoardIds()` helper in `src/lib/connectwise/boards.ts`. An explicit
`?boards=` parameter still overrides. When no boards are selected the routes
return empty rather than everything, matching how the daily sync already
handles that case.

## UI

**New tab: Pending Closure**, on the existing service-KPI page.

- Overall workload — total, as a headline figure
- Signal vs. noise — real / white noise with percentages
- Effort distribution — `<1hr` / `>=1hr` with percentages
- Grouped sections in `sort_order`, each resource with an inline editable note
  that saves on blur
- Resource table: Resource, Real, White Noise, Total, `<1hr`, `>=1hr`, Avg hrs

**Settings tab** gains a Resources section: one row per distinct
`owner_identifier` seen in tickets, with a group dropdown and sort order.
New resources appear automatically as Ungrouped.

## Testing

The project has **no test runner** — no test script, no test files. Adding
Vitest is out of scope for this work and would be its own decision.

Verification is therefore:

- `npx tsc --noEmit` clean
- `npx eslint` clean on changed files (the repo has ~485 pre-existing errors
  elsewhere; only changed files must be clean)
- Each derivation rule checked against live data via SQL before and after, so
  the rendered figures are confirmed to match a hand-run query
- Sync verified by a real run producing a `cw_sync_runs` row with
  `success = true` and a non-zero record count

The derivation rules are pure functions in `src/lib/connectwise/kpi.ts` with no
I/O, so they are unit-testable the moment a runner exists.

## Out of scope

- `cw_report_snapshots` and any historical reproduction or trending
- PDF or file export of the report
- Auto-drafted narrative text
- Multi-select location/department filters on Settings (separate, still parked)
- Normalising resource identity beyond using `owner_identifier`
- Including unassigned tickets
