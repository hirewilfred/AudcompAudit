// Placeholder sample data so the Service KPI dashboard is viewable
// before ConnectWise credentials are wired up. Returned by the read APIs
// when the database has no synced rows yet.

export interface SampleTicket {
    id: number;
    summary: string;
    status_name: string;
    status_id: number;
    board_id: number;
    board_name: string;
    priority_id: number;
    priority_name: string;
    priority_sort: number;
    company_id: number;
    company_name: string;
    contact_id: number;
    contact_name: string;
    resources: string;
    assigned_resource: string;
    date_entered: string;
    date_closed: string | null;
    last_updated: string;
    required_date: string | null;
    date_next_action: string | null;
    actual_hours: number;
    age_days: number;
    sla_status: string | null;
    sla_respond_minutes: number | null;
    sla_resolve_minutes: number | null;
    sla_resolution_minutes: number | null;
    minutes_until_breach: number | null;
    raw: null;
    synced_at: string;
}

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();
const minutesFromNow = (m: number) => new Date(now + m * 60_000).toISOString();

const SAMPLE_BOARDS = [
    { id: 1, name: 'Help Desk' },
    { id: 2, name: 'Alerts' },
    { id: 3, name: 'Network' },
    { id: 4, name: 'Projects' },
];

const TECHS = ['agarrido', 'cridley', 'omirza', 'sduncan', 'jthomas', 'mlee'];
const COMPANIES = [
    'Geosource Energy Inc.', 'Hornetsecurity Canada', 'Microsoft Canada', 'Audcomp - Internal Purchasing',
    'Stelco', 'Hanscomb Limited', 'Thrive Group', 'Datto Canada Enterprises, Inc.', 'GoDaddy.com, LLC',
    'Catchall', 'Vision Truck Group', 'Load Covering Solutions', 'Zip Signs Ltd.', 'Black Creek CHC',
];
const CONTACTS = ['Sonal Kumar', 'Emmy Luberto', 'Steve Kelly', 'Stelco IT Team', 'Craig Bye',
    'Lawren Malloch', 'Vince Greco', 'Tatiana Tonkovich', 'Anne Beattie', 'Dark Web ID', 'Linda Petelka'];

const SAMPLE_SUMMARIES = [
    'Geosource- GS-QBCLOUD Your certificate library item SAML Encryption-2025-03-11 expires soon',
    'Quarantine report from 02.05.26 3:00 PM for tech@audcomp.com',
    'Statement of Account – 003016512725',
    '(14168070308) Voicemail notification - 19 second(s) message',
    'Exchange Restore - Stelco - Report 05/01/2026 16:12:21 - 6 errors, 1 warning',
    'Daily Dark Web Compromise Report',
    'Admin Status Report - Arctic Wolf Managed Security Awareness Team',
    'Network Status Report',
    '365 Total Backup Daily Summary Report',
    'Backup Failed - VPG-IVAN-FRANKO Daily (30) Job',
    'Alert Summary for HPADattoBackups',
    '[Failed] Daily Backup AB-DC002 - 1 machine failed',
    'CRREF-SERVER Bootable Screenshot FAILED on CRREF-BACKUP',
    'GoDaddy - Digital Marketing Essentials Plan removed from account',
    'Darkweb monitoring automated reports',
    'DRV - Fragmentation > 45 % - LCSBU1001S 807 C',
    'Perf - Processor Utilization: VIS-ETOB-SHOP18',
    'LT - Agents No Checkin for More Than 30 Days',
    'UPTIME - Over 1 Month Without Reboot',
    'Software Uninstalled for TOARC-SQL: Java 8 Update 461',
];

const STATUSES_NEW = [
    { id: 1, name: 'Triaged' },
    { id: 2, name: 'New' },
    { id: 3, name: 'In Progress' },
    { id: 4, name: 'Awaiting Input' },
];
const PRIORITIES = [
    { id: 1, name: 'Priority 1 - Critical', sort: 1 },
    { id: 2, name: 'Priority 2 - High', sort: 2 },
    { id: 3, name: 'Priority 3 - Medium', sort: 3 },
    { id: 4, name: 'Priority 4 - Low', sort: 4 },
];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }

function makeTicket(i: number, opts: { board?: typeof SAMPLE_BOARDS[number]; status?: typeof STATUSES_NEW[number]; ageHours?: number; minutesUntilBreach?: number | null; closed?: boolean; assignedTech?: string; touchedTechs?: string[] }): SampleTicket {
    const board = opts.board ?? pick(SAMPLE_BOARDS, i);
    const status = opts.status ?? pick(STATUSES_NEW, i);
    const priority = pick(PRIORITIES, i);
    const company = pick(COMPANIES, i);
    const contact = pick(CONTACTS, i);
    const assigned = opts.assignedTech ?? pick(TECHS, i);
    // Most tickets are touched by 1 tech; some by 2-3 (escalations).
    const touched = opts.touchedTechs ?? (
        i % 4 === 0
            ? [assigned, pick(TECHS, i + 2)]
            : i % 7 === 0
                ? [assigned, pick(TECHS, i + 1), pick(TECHS, i + 3)]
                : [assigned]
    );
    const resourcesStr = [...new Set(touched)].join(', ');
    const ageH = opts.ageHours ?? (i * 0.7) % 36;
    const dateEntered = hoursAgo(ageH);
    const required = opts.minutesUntilBreach !== undefined && opts.minutesUntilBreach !== null
        ? minutesFromNow(opts.minutesUntilBreach)
        : null;
    const dateClosed = opts.closed ? hoursAgo(Math.max(0, ageH - 2 - (i % 5))) : null;
    return {
        id: 602000 + i,
        summary: pick(SAMPLE_SUMMARIES, i),
        status_name: opts.closed ? 'Closed' : status.name,
        status_id: opts.closed ? 99 : status.id,
        board_id: board.id,
        board_name: board.name,
        priority_id: priority.id,
        priority_name: priority.name,
        priority_sort: priority.sort,
        company_id: 1000 + i,
        company_name: company,
        contact_id: 5000 + i,
        contact_name: contact,
        resources: resourcesStr,
        assigned_resource: assigned,
        date_entered: dateEntered,
        date_closed: dateClosed,
        last_updated: dateClosed ?? dateEntered,
        required_date: required,
        date_next_action: null,
        actual_hours: +(((i % 7) * 0.25)).toFixed(2),
        age_days: +(ageH / 24).toFixed(1),
        sla_status: required ? (opts.minutesUntilBreach! < 0 ? 'Breached' : 'Active') : null,
        sla_respond_minutes: 30,
        sla_resolve_minutes: 480,
        sla_resolution_minutes: 480,
        minutes_until_breach: opts.minutesUntilBreach ?? null,
        raw: null,
        synced_at: new Date().toISOString(),
    };
}

export function sampleTodayTickets(): SampleTicket[] {
    return Array.from({ length: 18 }, (_, i) =>
        makeTicket(i, { board: pick(SAMPLE_BOARDS, i), ageHours: (i * 0.6) % 8 })
    );
}

export function samplePendingClosureTickets(): SampleTicket[] {
    return Array.from({ length: 9 }, (_, i) =>
        makeTicket(i + 30, {
            board: SAMPLE_BOARDS[0],
            status: { id: 7, name: 'Pending Closure' },
            ageHours: 24 + i * 6,
        })
    );
}

export function sampleSlaTickets(): SampleTicket[] {
    const minutesPlan = [-180, -45, -5, 12, 35, 58, 90, 240, 600, 1440, 2880];
    return minutesPlan.map((mtb, i) =>
        makeTicket(i + 50, { board: pick(SAMPLE_BOARDS, i), ageHours: 4 + i * 2, minutesUntilBreach: mtb })
    );
}

export function sampleClosedTickets(): SampleTicket[] {
    // Tickets closed over the last ~14 days, distributed across techs.
    return Array.from({ length: 60 }, (_, i) =>
        makeTicket(i + 70, {
            board: pick(SAMPLE_BOARDS, i),
            ageHours: 24 * ((i % 14) + 1) + (i % 6),
            closed: true,
        })
    );
}

export function sampleAllTickets(): SampleTicket[] {
    // Superset used for tech-level KPI rollups: open + closed.
    return [
        ...sampleTodayTickets(),
        ...samplePendingClosureTickets(),
        ...sampleSlaTickets(),
        ...sampleClosedTickets(),
    ];
}

export function sampleOpenTickets(): SampleTicket[] {
    return [
        ...sampleTodayTickets(),
        ...samplePendingClosureTickets(),
        ...sampleSlaTickets(),
    ];
}

export const SAMPLE_BOARD_ROWS = [
    { board_id: 1, board_name: 'Help Desk', location_id: 1, location_name: 'Audcomp', department_id: 1, department_name: 'Services', monitor_today: true, monitor_pending_closure: true, monitor_sla: true, enabled: true },
    { board_id: 2, board_name: 'Alerts', location_id: 1, location_name: 'Audcomp', department_id: 1, department_name: 'Services', monitor_today: false, monitor_pending_closure: false, monitor_sla: false, enabled: true },
    { board_id: 3, board_name: 'Network', location_id: 1, location_name: 'Audcomp', department_id: 1, department_name: 'Services', monitor_today: false, monitor_pending_closure: false, monitor_sla: false, enabled: true },
    { board_id: 4, board_name: 'Projects', location_id: 1, location_name: 'Audcomp', department_id: 2, department_name: 'Projects', monitor_today: false, monitor_pending_closure: false, monitor_sla: false, enabled: true },
    { board_id: 5, board_name: 'AGS Support', location_id: 2, location_name: 'AGS', department_id: 1, department_name: 'Services', monitor_today: false, monitor_pending_closure: false, monitor_sla: false, enabled: true },
];
