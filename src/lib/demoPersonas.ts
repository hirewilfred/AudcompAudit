// Multi-persona demo configs for /demo. Each persona drives a fully-themed
// command-center demo (agents, KPIs, activity, campaigns) and is selected via
// the ?persona=<slug> query param.

import type { DemoAgent, DemoCampaign, DemoEvent, DemoQueuedPost } from './demoData';
import {
  DEMO_PERSONA as FLORIST_PERSONA,
  DEMO_AGENTS as FLORIST_AGENTS,
  DEMO_KPIS as FLORIST_KPIS,
  DEMO_CAMPAIGNS as FLORIST_CAMPAIGNS,
  DEMO_EVENTS as FLORIST_EVENTS,
  DEMO_QUEUED_POSTS as FLORIST_QUEUED,
} from './demoData';

export type PersonaSlug = 'florist' | 'dental' | 'brandhaven' | 'uem';

export interface AgentWorkflowStep {
  step: number;
  label: string;
  detail: string;
  human_minutes: number;  // how long this step takes a person
  agent_seconds: number;  // how long the agent takes
}

export interface AgentWorkflow {
  agentName: string;             // matches DemoAgent.name
  scenario: string;              // headline scenario the workflow describes
  trigger: string;               // what kicks it off
  beforeAgents: { duration: string; description: string };
  withAgents: { duration: string; description: string };
  steps: AgentWorkflowStep[];
  outcome: string;               // bottom-line outcome line
  pitchLine: string;             // how the salesperson should frame this
}

export interface PersonaConfig {
  slug: PersonaSlug;
  businessName: string;
  tagline: string;
  industry: string;
  accent: 'rose' | 'cyan' | 'amber';
  iconKey: 'Flower2' | 'Stethoscope' | 'Hammer';
  location: string;
  nextEvent: { name: string; daysOut: number };
  hourlyRate: number;
  humanCostMonthly: number;
  agents: DemoAgent[];
  kpiRow: { label: string; value: string | number; sub: string; tone: 'rose' | 'violet' | 'emerald' | 'amber' | 'cyan' | 'blue' }[];
  activityLines: { agent: string; status: 'running' | 'succeeded'; task: string }[];
  campaigns: DemoCampaign[];
  events: DemoEvent[];
  queuedPosts: DemoQueuedPost[];
  // Sales-enablement extensions:
  pitch: { headline: string; subhead: string; problemBefore: string; solutionAfter: string };
  workflows: AgentWorkflow[];   // 1-2 hero workflows we walk through during the demo
  agentExplanations: Record<string, { howItWorks: string; savesPerWeek: string; replaces: string }>;  // keyed by agent.name
}

// ── DENTAL — Bright Smile Dental ────────────────────────────────────────────
const DENTAL_AGENTS: DemoAgent[] = [
  { name: 'scheduling-assistant', label: 'Scheduling Assistant', description: 'Books, reschedules, and confirms appointments via SMS and the patient portal.', status: 'running', currentTask: 'Confirming 14 visits for tomorrow · 2 patients moved off the waitlist into open slots', outcomeMetric: '124 bookings / wk', weeklyHoursSaved: 9 },
  { name: 'recall-reminder', label: 'Recall & Reminder Agent', description: 'Drives 6-month recall + 24/72hr appointment reminders with no-show prevention.', status: 'running', currentTask: 'Sent 47 recall texts to patients overdue for cleanings · 9 booked in the last hour', outcomeMetric: '67% drop in no-shows', weeklyHoursSaved: 6 },
  { name: 'clinical-transcriber', label: 'Clinical Transcriber', description: 'Listens during operatory visits and drafts SOAP notes for hygienist review.', status: 'running', currentTask: 'Drafting SOAP for Op2 (Patient: J.M., scaling + flouride) — ready for review in 12s', outcomeMetric: '3 min / SOAP note', weeklyHoursSaved: 11 },
  { name: 'insurance-claim', label: 'Insurance Claim Agent', description: 'Submits and tracks claims, flags rejections, and prompts for missing info.', status: 'running', currentTask: '8 claims submitted today · 1 flagged (missing pre-auth for #16 crown)', outcomeMetric: '$4.2k claims / day', weeklyHoursSaved: 5 },
  { name: 'waitlist-optimizer', label: 'Waitlist Optimizer', description: 'Auto-fills cancellations from a ranked waitlist within minutes.', status: 'running', currentTask: '11:30am cancellation filled in 4 minutes · waitlist patient confirmed via SMS', outcomeMetric: '92% slot utilization', weeklyHoursSaved: 4 },
  { name: 'review-collector', label: 'Review Collector', description: 'Sends post-visit Google review requests to happy patients only (NPS-gated).', status: 'running', currentTask: 'Triggered 18 Google review requests for 5★ NPS scores from yesterday', outcomeMetric: '42 5★ reviews / mo', weeklyHoursSaved: 2.5 },
  { name: 'treatment-plan', label: 'Treatment Plan Drafter', description: 'Drafts patient-facing treatment plans with cost breakdown and insurance estimate.', status: 'idle', currentTask: 'Last run: 6 plans drafted yesterday · avg case acceptance 73%', outcomeMetric: '24 plans / wk', weeklyHoursSaved: 3.5 },
  { name: 'new-patient-intake', label: 'New Patient Intake', description: 'Walks new patients through forms, insurance verification, and first-visit prep via SMS.', status: 'idle', currentTask: '3 new patient packets sent overnight · all returned signed', outcomeMetric: '12 new pts / wk', weeklyHoursSaved: 4 },
  { name: 'hygiene-recall-stats', label: 'Hygiene Analytics', description: 'Flags hygiene appointment compliance and revenue-per-hour by operatory.', status: 'idle', currentTask: 'Op3 hygiene revenue 18% above clinic average this week', outcomeMetric: 'Weekly perf review', weeklyHoursSaved: 1.5 },
  { name: 'referral-network', label: 'Referral Network Agent', description: 'Tracks referrals out (specialists) and in (other GPs), auto-thank-yous and reciprocity tracking.', status: 'queued', currentTask: 'Referral packet to Dr. Chen (oral surgery) — 3 patients this month', outcomeMetric: '8 referrals / wk', weeklyHoursSaved: 2 },
];

// ── BRANDHAVEN HOMES — Custom Home Builder ──────────────────────────────────
const BRANDHAVEN_AGENTS: DemoAgent[] = [
  { name: 'bid-estimator', label: 'AI Bid Estimator', description: 'Generates accurate cost estimates from project specs and 4 years of historical job data.', status: 'running', currentTask: 'Building bid for the Maple Ridge custom: 3,200 sqft · materials $412k · 11hr complete by EOD', outcomeMetric: '60% faster bids', weeklyHoursSaved: 12 },
  { name: 'site-progress', label: 'Site Progress Reporter', description: 'Pulls daily photo logs from foremen, generates client-facing progress updates with photos.', status: 'running', currentTask: 'Generated weekly update for the Hartmann build · 18 photos · sent to client at 7am', outcomeMetric: '14 builds tracked', weeklyHoursSaved: 8 },
  { name: 'subcontractor-coordinator', label: 'Subcontractor Coordinator', description: 'Schedules subs, sends arrival reminders, flags scheduling conflicts before they happen.', status: 'running', currentTask: 'Plumbing rough-in pushed to Tuesday · electrician notified · framer 3-day buffer confirmed', outcomeMetric: '32 subs coordinated', weeklyHoursSaved: 9 },
  { name: 'change-order-drafter', label: 'Change Order Drafter', description: 'Drafts change orders from emails, ties them to project budget, sends for client signature.', status: 'running', currentTask: 'CO #12 (Maple Ridge): kitchen island upgrade quartz → marble · +$4,800 · client signed', outcomeMetric: '$48k / wk in COs', weeklyHoursSaved: 6 },
  { name: 'safety-compliance', label: 'Safety Compliance Agent', description: 'Auto-generates daily safety logs from site photos · flags PPE violations.', status: 'running', currentTask: '4 sites logged today · 1 flag at Hartmann (rebar without cap) — corrected within 18 mins', outcomeMetric: '100% log compliance', weeklyHoursSaved: 4 },
  { name: 'lead-qualifier', label: 'Lead Qualifier', description: 'Qualifies inbound leads from website + Houzz, scores buyers by readiness, books discovery calls.', status: 'running', currentTask: 'New lead: Mr. Patel · 0.6 acre lot in Ancaster · scored A · discovery call booked Friday 2pm', outcomeMetric: '18 qualified / wk', weeklyHoursSaved: 5 },
  { name: 'budget-watch', label: 'Budget Watch', description: 'Monitors actuals vs budget by line item, flags overruns >5% in real time.', status: 'idle', currentTask: 'Hartmann build: tile labor 12% over · alert sent to PM', outcomeMetric: 'Daily variance check', weeklyHoursSaved: 3.5 },
  { name: 'design-vendor-bot', label: 'Design Vendor Bot', description: 'Pulls finishes, fixtures, and lead times from preferred vendor catalogs into the design selection tool.', status: 'idle', currentTask: 'Synced 412 SKU updates from Cambria + Kohler overnight', outcomeMetric: '8 selections / wk', weeklyHoursSaved: 2.5 },
  { name: 'permit-tracker', label: 'Permit Tracker', description: 'Watches municipal portals for permit status changes, escalates stalls to the PM.', status: 'idle', currentTask: 'Hamilton permit for the Ancaster build approved · framing schedule confirmed', outcomeMetric: '12 permits tracked', weeklyHoursSaved: 2 },
  { name: 'warranty-callback', label: 'Warranty Callback', description: 'Triages 30-day, 6-month, and 1-year warranty walkthroughs with homeowners.', status: 'queued', currentTask: 'Mrs. Khouri (1yr walkthrough): 4 minor punch-list items collected, scheduled for next Wed', outcomeMetric: '6 walks / mo', weeklyHoursSaved: 1.5 },
];

const DENTAL_ACTIVITY = [
  { agent: 'scheduling-assistant', status: 'succeeded' as const, task: 'Booked patient J.M. for cleaning Thu 2pm · sent confirmation SMS' },
  { agent: 'recall-reminder', status: 'succeeded' as const, task: 'Recall text sent to 47 overdue patients · 9 booked within 1 hour' },
  { agent: 'clinical-transcriber', status: 'running' as const, task: 'Drafting SOAP note for Op2 visit (J.M., scaling + flouride)' },
  { agent: 'insurance-claim', status: 'succeeded' as const, task: 'Submitted claim #4127 to Manulife · auto-approved · $284 to clinic' },
  { agent: 'waitlist-optimizer', status: 'succeeded' as const, task: '11:30am cancellation filled in 4 min from waitlist · slot saved' },
  { agent: 'review-collector', status: 'succeeded' as const, task: '5★ NPS triggered Google review request · sent to 18 patients' },
  { agent: 'new-patient-intake', status: 'succeeded' as const, task: 'Sent intake packet to 3 new patients · all returned signed before 9am' },
  { agent: 'treatment-plan', status: 'running' as const, task: 'Drafting treatment plan for Patient T.S. · #18 crown + 2 fillings · $2,840' },
];

const BRANDHAVEN_ACTIVITY = [
  { agent: 'bid-estimator', status: 'running' as const, task: 'Compiling bid for Maple Ridge custom · 3,200 sqft · materials $412k' },
  { agent: 'site-progress', status: 'succeeded' as const, task: 'Weekly progress email sent to Hartmann clients · 18 photos attached' },
  { agent: 'subcontractor-coordinator', status: 'succeeded' as const, task: 'Plumbing rough-in pushed to Tue · all subs notified · no conflicts' },
  { agent: 'change-order-drafter', status: 'succeeded' as const, task: 'CO #12 drafted: kitchen island marble upgrade · +$4,800 · client signed' },
  { agent: 'safety-compliance', status: 'succeeded' as const, task: 'Daily safety log generated for 4 active sites · 1 flag corrected in 18 min' },
  { agent: 'lead-qualifier', status: 'succeeded' as const, task: 'New lead Mr. Patel scored A · discovery call booked Fri 2pm' },
  { agent: 'budget-watch', status: 'running' as const, task: 'Watching Hartmann tile labor variance · 12% over · PM alerted' },
  { agent: 'permit-tracker', status: 'succeeded' as const, task: 'Hamilton permit approved for Ancaster build · framing scheduled' },
];

const DENTAL_KPIS: PersonaConfig['kpiRow'] = [
  { label: 'Bookings This Week', value: 124, sub: '92% slot utilization', tone: 'cyan' },
  { label: 'No-Show Rate', value: '6.4%', sub: 'down from 19% baseline', tone: 'emerald' },
  { label: 'SOAP Notes Drafted', value: 287, sub: 'avg 3 min per note', tone: 'violet' },
  { label: 'Reviews This Month', value: 42, sub: '5★ avg · 4.92 rating', tone: 'amber' },
];

const BRANDHAVEN_KPIS: PersonaConfig['kpiRow'] = [
  { label: 'Active Builds', value: 14, sub: '11 on-schedule · 3 watching', tone: 'amber' },
  { label: 'Bids Out This Week', value: 9, sub: '60% faster than last quarter', tone: 'blue' },
  { label: 'Change Orders', value: '$48k', sub: 'this week · all signed', tone: 'emerald' },
  { label: 'Safety Compliance', value: '100%', sub: 'all 4 sites logged', tone: 'rose' },
];

const FLORIST_ACTIVITY = [
  { agent: 'caption-writer', status: 'succeeded' as const, task: 'Drafted 3 caption variants for Spring Bridal Collection reel' },
  { agent: 'scheduler', status: 'succeeded' as const, task: 'Queued 6 posts for Mother\'s Day long weekend push' },
  { agent: 'engagement-responder', status: 'succeeded' as const, task: 'Replied to DM about same-day funeral arrangement · converted to order' },
  { agent: 'content-strategist', status: 'running' as const, task: 'Building Mother\'s Day campaign across 4 platforms · 32 posts' },
  { agent: 'visual-director', status: 'succeeded' as const, task: 'Storyboarded Mother\'s Day bouquet reveal · Pantone Peach Fuzz palette' },
  { agent: 'special-events-coordinator', status: 'succeeded' as const, task: 'Hartmann wedding 48hr reminder sent · 112 arrangements confirmed' },
];

const FLORIST_KPI_ROW: PersonaConfig['kpiRow'] = [
  { label: 'Active Agents', value: FLORIST_KPIS.activeAgents, sub: `${FLORIST_KPIS.agentRunsToday} runs today`, tone: 'rose' },
  { label: 'Posts Queued', value: FLORIST_KPIS.postsQueued, sub: `${FLORIST_QUEUED.filter(p => p.readyToPublish).length} ready to publish`, tone: 'violet' },
  { label: 'Weekly Reach', value: `${(FLORIST_KPIS.weeklyReach / 1000).toFixed(1)}k`, sub: `${FLORIST_KPIS.engagementRate}% engagement`, tone: 'emerald' },
  { label: 'Events This Week', value: FLORIST_KPIS.eventsThisWeek, sub: `${FLORIST_KPIS.liveCampaigns} live campaigns`, tone: 'amber' },
];

// ── PITCHES ─────────────────────────────────────────────────────────────────
const FLORIST_PITCH = {
  headline: 'Six agents handle every marketing task — owner stays creative, not chained to her phone.',
  subhead: 'Petal & Stem went from 12 missed DMs/day to 0, and freed 40 hours a week of marketing work.',
  problemBefore: 'Owner is the entire marketing team — captions, DMs, scheduling, ad copy, event prep. She works weddings on weekends and posts at midnight. She misses DMs that turn into orders.',
  solutionAfter: 'Six specialist agents own each marketing job. She approves drafts each morning over coffee — done in 20 minutes. The agents fire on holidays, weddings, and DMs in real time.',
};

const DENTAL_PITCH = {
  headline: 'Front desk stops being the bottleneck — agents handle bookings, claims, and clinical notes.',
  subhead: 'Bright Smile cut no-shows from 19% → 6%, and hygienists no longer wait on charting.',
  problemBefore: 'Reception spends 60% of the day on phone scheduling, no-show rescheduling, and clinical-note transcription. $80/hr hygienists wait on charting before starting the next patient.',
  solutionAfter: 'Scheduling Assistant runs SMS bookings + waitlist auto-fill. Recall Agent prevents no-shows. Clinical Transcriber drafts SOAP notes in 3 minutes. Front desk becomes proactive instead of reactive.',
};

const COGECO_PITCH = {
  headline: 'AI estimates bids in 4 hours, not 5 days — and every change order signs itself.',
  subhead: 'Cogeco Homes increased bid throughput 3x and recovered $48k/wk in untracked change orders.',
  problemBefore: 'Estimating takes 5 days per bid. Subs get scheduled by text. Change orders get verbal-agreed and never invoiced. Site safety logs live in someone\'s notebook.',
  solutionAfter: 'AI Bid Estimator builds bids from spec + 4 years of history. Subcontractor Coordinator catches conflicts 3 days out. Change orders auto-draft, get e-signed, tied to the budget. Foreman snaps a photo, agent generates the daily safety log.',
};

// ── WORKFLOWS ───────────────────────────────────────────────────────────────
const FLORIST_WORKFLOWS: AgentWorkflow[] = [
  {
    agentName: 'caption-writer',
    scenario: 'Tomorrow\'s "Spring Bridal Collection" reel needs 3 caption variants',
    trigger: 'Visual Director finishes storyboard at 6:42pm',
    beforeAgents: { duration: '90 minutes', description: 'Owner stares at the screen at 11pm trying to find the right words. Writes one okay caption. Posts it.' },
    withAgents: { duration: '38 seconds', description: 'Caption Writer reads brand voice corpus + reel concept, drafts 3 variants. Owner picks one tomorrow morning.' },
    steps: [
      { step: 1, label: 'Receive trigger', detail: 'Visual Director hands off the reel concept and target audience tag.', human_minutes: 5, agent_seconds: 1 },
      { step: 2, label: 'Pull brand voice', detail: 'Reads 2,400 past captions + 47 customer reviews to lock the tone.', human_minutes: 15, agent_seconds: 4 },
      { step: 3, label: 'Draft 3 variants', detail: 'Writes long, medium, and punchy versions with hashtag clusters.', human_minutes: 60, agent_seconds: 28 },
      { step: 4, label: 'Self-edit', detail: 'Removes filler words, validates against brand do-not-say list.', human_minutes: 10, agent_seconds: 5 },
    ],
    outcome: 'Owner approves a caption in 12 seconds tomorrow. 90 minutes of work compressed into 38 seconds.',
    pitchLine: 'Show the prospect: "This is what happens between when she finishes the reel concept and when she goes to bed. Today, those 90 minutes don\'t exist."',
  },
];

const DENTAL_WORKFLOWS: AgentWorkflow[] = [
  {
    agentName: 'clinical-transcriber',
    scenario: 'Hygienist finishes a 45-min cleaning · needs SOAP note before next patient',
    trigger: 'Operatory door closes · ambient mic stops recording',
    beforeAgents: { duration: '12 minutes per patient', description: 'Hygienist walks to workstation, types up SOAP note from memory while next patient waits. Often defers it to end of day.' },
    withAgents: { duration: '12 seconds to draft · 30 seconds to review', description: 'Agent transcribes audio, structures into SOAP format, surfaces relevant codes. Hygienist taps "Approve" or edits one line.' },
    steps: [
      { step: 1, label: 'Capture audio', detail: 'PHIPA-compliant local processing in a Canadian region.', human_minutes: 0, agent_seconds: 0 },
      { step: 2, label: 'Structure into SOAP', detail: 'Extracts Subjective, Objective, Assessment, Plan from natural speech.', human_minutes: 8, agent_seconds: 8 },
      { step: 3, label: 'Suggest billing codes', detail: 'Maps procedures to ODA fee guide codes for the claim.', human_minutes: 3, agent_seconds: 3 },
      { step: 4, label: 'Hand off for approval', detail: 'Hygienist sees a 4-line summary, taps Approve.', human_minutes: 1, agent_seconds: 1 },
    ],
    outcome: '11 hours/week back to hygienists. SOAP notes done same-visit, not end-of-day.',
    pitchLine: '"Your $80/hr hygienists are doing $20/hr typing today. We give them those hours back — that\'s 11 hrs × 4 hygienists × 52 weeks of recovered chair time."',
  },
  {
    agentName: 'recall-reminder',
    scenario: '47 patients are overdue for a 6-month cleaning · need to refill the schedule',
    trigger: 'Daily 9am scan of patients last seen >180 days ago',
    beforeAgents: { duration: '6 hours over 2 weeks', description: 'Front desk calls patients during slow moments. Voicemails go unreturned. Most never call back.' },
    withAgents: { duration: '4 minutes total · 9 booked in the first hour', description: 'Sends personalized SMS, includes 2 open slot times, patient taps to confirm. Front desk only gets involved if patient asks a question.' },
    steps: [
      { step: 1, label: 'Identify cohort', detail: 'Pulls patients last seen >180 days, ranks by recall risk.', human_minutes: 30, agent_seconds: 8 },
      { step: 2, label: 'Personalize message', detail: 'Uses each patient\'s last hygienist name and clinic-specific tone.', human_minutes: 240, agent_seconds: 12 },
      { step: 3, label: 'Send + track', detail: 'Drops 47 SMS in 90 seconds, watches for replies.', human_minutes: 90, agent_seconds: 90 },
      { step: 4, label: 'Auto-book confirmations', detail: 'When patient picks a time, books in PMS, sends confirmation.', human_minutes: 30, agent_seconds: 6 },
    ],
    outcome: '67% drop in no-shows. Recall list shrinks weekly instead of growing.',
    pitchLine: '"Today, your front desk decides who gets called. The agent calls everyone. That\'s where the 67% comes from."',
  },
];

const COGECO_WORKFLOWS: AgentWorkflow[] = [
  {
    agentName: 'bid-estimator',
    scenario: 'New custom build inquiry: 3,200 sqft 2-storey on a 0.6 acre lot in Ancaster',
    trigger: 'Lead Qualifier marks the prospect ready, attaches plans + lot survey',
    beforeAgents: { duration: '5 days', description: 'Estimator manually pulls lumber prices from last year\'s spreadsheet, calls 3 subs for labor quotes, builds bid in Excel. Bid sent Friday — competitor bid Tuesday and won.' },
    withAgents: { duration: '4 hours · estimator reviews 30 min', description: 'AI Bid Estimator parses plans, applies 4 years of historical cost data, pulls live material prices from preferred suppliers, generates a line-item bid. Estimator reviews and adjusts the unique 30%.' },
    steps: [
      { step: 1, label: 'Parse plans + spec', detail: 'Reads architectural plans, extracts square footage, room count, and finish level.', human_minutes: 90, agent_seconds: 45 },
      { step: 2, label: 'Pull historical line items', detail: 'Matches against 4 years of past builds with similar specs.', human_minutes: 180, agent_seconds: 30 },
      { step: 3, label: 'Refresh material prices', detail: 'Pulls live lumber, drywall, fixture prices from preferred vendors.', human_minutes: 120, agent_seconds: 22 },
      { step: 4, label: 'Quote subcontractor labor', detail: 'Drafts RFQs to 3 framers, 2 plumbers, 2 electricians via email + tracks responses.', human_minutes: 600, agent_seconds: 180 },
      { step: 5, label: 'Compile bid PDF', detail: 'Generates client-facing bid with line items, allowances, and timeline.', human_minutes: 240, agent_seconds: 60 },
    ],
    outcome: '5 days → 4 hours. You bid 2-3x more jobs without adding an estimator. Win rate jumps when bids land in <48 hrs.',
    pitchLine: '"Your competitor bid this job in 24 hours and won. The 5-day version of your business loses every fast-moving deal. We give you the 4-hour bid."',
  },
  {
    agentName: 'change-order-drafter',
    scenario: 'Mid-build: homeowner emails "can we upgrade the kitchen island to marble?"',
    trigger: 'Change Order Drafter watches the project email inbox',
    beforeAgents: { duration: '2-3 weeks · sometimes never', description: 'PM verbally agrees on site. Forgets to write it up. Change goes in. Invoice never reflects it. Margin disappears.' },
    withAgents: { duration: '14 minutes · client e-signed before lunch', description: 'Agent reads email, prices the upgrade against the budget, drafts CO with line items + timeline impact, sends for signature. Tied to project budget automatically.' },
    steps: [
      { step: 1, label: 'Detect change request', detail: 'Watches inbox for keywords: "upgrade", "instead of", "can we add".', human_minutes: 60, agent_seconds: 8 },
      { step: 2, label: 'Price the change', detail: 'Quartz → marble: +$4,800 material, +6 hrs labor, +$220 disposal.', human_minutes: 90, agent_seconds: 18 },
      { step: 3, label: 'Draft CO doc', detail: 'Generates branded CO #12 with line items, totals, sign-here block.', human_minutes: 45, agent_seconds: 12 },
      { step: 4, label: 'Send for e-signature', detail: 'Drops CO into homeowner\'s portal + email; tracks signature.', human_minutes: 15, agent_seconds: 4 },
      { step: 5, label: 'Tie to project budget', detail: 'Budget auto-updates; PM and accounting see the variance immediately.', human_minutes: 30, agent_seconds: 6 },
    ],
    outcome: 'Every change order gets captured, priced, and signed. $48k/week in CO revenue that used to vanish.',
    pitchLine: '"Walk through your last 3 builds. How many verbal changes never made it to an invoice? That\'s the leak. We close it."',
  },
];

// ── AGENT EXPLANATIONS (per persona) ────────────────────────────────────────
const FLORIST_EXPLAIN: Record<string, { howItWorks: string; savesPerWeek: string; replaces: string }> = {
  'content-strategist':           { howItWorks: 'Reads your seasonal calendar, IG/FB analytics, and competitor posts. Outputs a 32-post plan across 4 platforms each week.',                                            savesPerWeek: '4 hrs',  replaces: '$130/wk in marketing-coordinator time' },
  'caption-writer':               { howItWorks: 'Trained on 2,400 of your past captions + reviews. Drafts 3 variants per post in under a minute.',                                                                    savesPerWeek: '9.4 hrs',replaces: '$300/wk in copywriting' },
  'visual-director':              { howItWorks: 'Storyboards reels by reading the brief + checking what\'s trending in florist-tagged content.',                                                                      savesPerWeek: '6 hrs',  replaces: '$190/wk in art direction' },
  'scheduler':                    { howItWorks: 'Pushes approved posts to all 5 channels at the optimal time per platform.',                                                                                          savesPerWeek: '4 hrs',  replaces: '$130/wk in social ops time' },
  'engagement-responder':         { howItWorks: 'Watches IG/FB/TikTok DMs. Drafts replies in your voice. You approve with a tap.',                                                                                    savesPerWeek: '7 hrs',  replaces: 'Missed orders: 12 DMs/wk that used to go unanswered' },
  'special-events-coordinator':   { howItWorks: 'Tracks every wedding/funeral on the books. Auto-sends 7-day, 48-hr, and morning-of checklists.',                                                                     savesPerWeek: '3.5 hrs',replaces: '$110/wk in coordinator time' },
};

const DENTAL_EXPLAIN: Record<string, { howItWorks: string; savesPerWeek: string; replaces: string }> = {
  'scheduling-assistant':  { howItWorks: 'Patient texts the clinic line. Agent offers 3 open slots, books in your PMS, sends confirmation.',                              savesPerWeek: '9 hrs',   replaces: '0.6 FTE at the front desk' },
  'recall-reminder':       { howItWorks: 'Daily scan for >180-day patients. Sends personalized SMS with open slots. Books on tap.',                                       savesPerWeek: '6 hrs',   replaces: '67% of no-shows · ~$1,100/wk in lost chair time' },
  'clinical-transcriber':  { howItWorks: 'Listens during the visit (PHIPA-safe Canadian region). Drafts SOAP note in 12 seconds. Hygienist approves.',                    savesPerWeek: '11 hrs',  replaces: '$880/wk of $80/hr hygienist time on charting' },
  'insurance-claim':       { howItWorks: 'Auto-submits claims, watches for rejections, prompts staff for missing info on flagged ones.',                                  savesPerWeek: '5 hrs',   replaces: '$190/wk in claims-management' },
  'waitlist-optimizer':    { howItWorks: 'Cancellation comes in. Agent ranks waitlist, texts top 3, books the first to confirm.',                                         savesPerWeek: '4 hrs',   replaces: '92% slot utilization vs ~74% baseline' },
  'review-collector':      { howItWorks: 'NPS-gated. Only 5★ patients get the Google review request. Result: 4.92★ avg, 42 reviews/mo.',                                  savesPerWeek: '2.5 hrs', replaces: 'A part-time marketing intern' },
  'treatment-plan':        { howItWorks: 'Drafts patient-facing plan with cost, insurance estimate, and visual breakdown.',                                                savesPerWeek: '3.5 hrs', replaces: 'Treatment coordinator time · case acceptance ↑' },
  'new-patient-intake':    { howItWorks: 'New patient texts: agent walks them through forms, insurance verification, first-visit prep.',                                  savesPerWeek: '4 hrs',   replaces: 'Front-desk onboarding overhead' },
};

const COGECO_EXPLAIN: Record<string, { howItWorks: string; savesPerWeek: string; replaces: string }> = {
  'bid-estimator':              { howItWorks: 'Reads plans, applies 4 yrs of historical cost data, refreshes live material prices, outputs line-item bid in 4 hrs.',          savesPerWeek: '12 hrs',  replaces: '5-day → 4-hour bids · 2-3x throughput' },
  'site-progress':              { howItWorks: 'Pulls foreman photos from a Telegram channel each Friday morning, generates branded weekly update + emails homeowner.',       savesPerWeek: '8 hrs',   replaces: 'PM weekly write-ups · happier homeowners' },
  'subcontractor-coordinator':  { howItWorks: 'Watches the project schedule. Spots conflicts 3-5 days out. Sends "you\'re booked Tuesday at 7am" reminders.',                  savesPerWeek: '9 hrs',   replaces: 'No-show subs · $1,800/wk in idle days' },
  'change-order-drafter':       { howItWorks: 'Reads project inbox. Drafts CO from email, prices it, gets e-signature, ties to budget.',                                       savesPerWeek: '6 hrs',   replaces: '$48k/wk in unbilled CO revenue' },
  'safety-compliance':          { howItWorks: 'Foreman snaps photos of the site. Agent generates the OHSA-compliant daily log + flags PPE issues.',                            savesPerWeek: '4 hrs',   replaces: 'End-of-day paperwork · 100% log compliance' },
  'lead-qualifier':             { howItWorks: 'Inbound from web/Houzz: pulls lot details, scores readiness A/B/C, books discovery call on agreed slot.',                       savesPerWeek: '5 hrs',   replaces: '$150/wk SDR time · faster speed-to-lead' },
  'budget-watch':               { howItWorks: 'Compares actuals to budget by line item daily. Pings PM the moment a line is >5% over.',                                        savesPerWeek: '3.5 hrs', replaces: 'Surprise overruns at month-end close' },
  'permit-tracker':             { howItWorks: 'Polls municipal portals. Escalates the moment a permit stalls. Notifies framer when approval lands.',                           savesPerWeek: '2 hrs',   replaces: 'Lost build days waiting on permits' },
  'design-vendor-bot':          { howItWorks: 'Syncs SKU + lead-time updates from preferred vendors overnight into the design selection tool.',                                savesPerWeek: '2.5 hrs', replaces: 'Designer manual catalog updates' },
  'warranty-callback':          { howItWorks: 'Triages 30-day, 6-month, 1-year walkthroughs · collects punch lists via SMS · schedules trades.',                               savesPerWeek: '1.5 hrs', replaces: 'Word-of-mouth referrals from happier owners' },
};

// ── UEM — Engineering / Planning ────────────────────────────────────────────
const UEM_AGENTS: DemoAgent[] = [
  { name: 'proposal-intelligence', label: 'Proposal Intelligence Agent', description: 'Drafts proposal sections, PIFs, and pulls relevant past project experience.', status: 'running', currentTask: 'Drafting cover letter for Niagara Falls watermain project', outcomeMetric: '60% faster drafts', weeklyHoursSaved: 48 },
  { name: 'rfp-monitoring', label: 'RFP Monitoring Agent', description: 'Scans Ontario procurement portals 24/7 and delivers a ranked briefing.', status: 'running', currentTask: 'Scanning Bids&Tenders · found 2 stormwater RFPs in Niagara', outcomeMetric: 'Zero missed RFPs', weeklyHoursSaved: 15 },
  { name: 'meeting-intelligence', label: 'Meeting Intelligence Agent', description: 'Converts rough notes to branded minutes and extracts trackable action items.', status: 'running', currentTask: 'Formatting minutes for project kickoff · extracted 4 action items', outcomeMetric: 'Same-day turnaround', weeklyHoursSaved: 18 },
  { name: 'planning-intelligence', label: 'Planning Intelligence Agent', description: 'Reviews site plans against zoning bylaws and monitors policy updates.', status: 'running', currentTask: 'Reviewing site plan against Niagara Falls industrial setbacks', outcomeMetric: '4-6h → 1-2h research', weeklyHoursSaved: 16 },
  { name: 'field-inspection', label: 'Field Inspection Agent', description: 'Generates draft inspection reports and flags deviations from specs for QA/QC.', status: 'running', currentTask: 'Pulling inspection data from project server for contract admin report', outcomeMetric: '45-60 min reports', weeklyHoursSaved: 18 },
  { name: 'cad-automation', label: 'CAD Automation Agent', description: 'Identifies missing CAD components and automates repetitive drafting tasks.', status: 'running', currentTask: 'Scanning Civil 3D file for missing components · creating subassemblies', outcomeMetric: '15 min component check', weeklyHoursSaved: 30 },
  { name: 'asset-management', label: 'Asset Management AI', description: 'Processes condition data and generates O. Reg. 588/17 deterioration models.', status: 'idle', currentTask: 'Last run: Generated capital prioritization for municipal client', outcomeMetric: '2-3 wk AM reports', weeklyHoursSaved: 35 },
  { name: 'financial-operations', label: 'Financial Operations Agent', description: 'Generates draft invoices from billing data and tracks outstanding payments.', status: 'idle', currentTask: 'Last run: drafted 14 end-of-month invoices', outcomeMetric: '8-12 hrs bookkeeping saved', weeklyHoursSaved: 8 },
];

const UEM_ACTIVITY = [
  { agent: 'proposal-intelligence', status: 'succeeded' as const, task: 'Drafted PIF for Niagara Falls watermain project from briefing notes' },
  { agent: 'rfp-monitoring', status: 'succeeded' as const, task: 'Monday briefing delivered: 5 relevant RFPs found this week' },
  { agent: 'meeting-intelligence', status: 'running' as const, task: 'Summarizing 2024 Planning Act amendments into a 2-page brief' },
  { agent: 'planning-intelligence', status: 'succeeded' as const, task: 'Flagged 2 zoning non-conformances in site plan review' },
  { agent: 'field-inspection', status: 'succeeded' as const, task: 'Draft inspection report generated · 3 deviations highlighted for QA' },
  { agent: 'cad-automation', status: 'running' as const, task: 'Auto-generating preliminary drafting layout from standard template' },
];

const UEM_KPIS: PersonaConfig['kpiRow'] = [
  { label: 'Weekly Savings', value: '$17k', sub: '6 Quick Win Agents', tone: 'emerald' },
  { label: 'Proposals Drafted', value: 8, sub: '60% faster turnaround', tone: 'blue' },
  { label: 'RFPs Captured', value: 3, sub: 'from 24/7 portal monitoring', tone: 'violet' },
  { label: 'Action Items', value: 100, sub: '% capture rate in minutes', tone: 'cyan' },
];

const UEM_PITCH = {
  headline: 'Engineering & Planning teams get $819K/year in recovered capacity back.',
  subhead: 'UEM deployed 6 quick-win agents in 30 days to automate proposals, RFP monitoring, and CAD tasks.',
  problemBefore: 'Senior staff spend 12+ hours manually drafting proposals. RFP opportunities are missed. Inspection reports take hours. CAD drafters waste time on repetitive subassemblies.',
  solutionAfter: 'Proposal Agent drafts in 3 hours. RFP Monitor scans Merx 24/7. Field Agent drafts reports in 45 minutes. CAD Agent catches missing components in 15 minutes.',
};

const UEM_WORKFLOWS: AgentWorkflow[] = [
  {
    agentName: 'proposal-intelligence',
    scenario: 'New RFP assignment requires a full proposal draft',
    trigger: 'New RFP assignment in Sharepoint project folder',
    beforeAgents: { duration: '12+ hours', description: 'Senior staff rebuilds proposal manually, searching past proposals to copy-paste relevant experience.' },
    withAgents: { duration: '3 hours', description: 'Agent learns from past proposals, auto-drafts Scope, Team, and Approach, pulling perfect past project references.' },
    steps: [
      { step: 1, label: 'Scan RFP requirements', detail: 'Parses the new RFP document for key deliverables and scope.', human_minutes: 60, agent_seconds: 15 },
      { step: 2, label: 'Cross-reference past proposals', detail: 'Finds matching past project experience based on client and geography.', human_minutes: 180, agent_seconds: 30 },
      { step: 3, label: 'Auto-draft sections', detail: 'Drafts Scope of Work, Team Qualifications, and Project Approach.', human_minutes: 360, agent_seconds: 90 },
      { step: 4, label: 'Format and proofread', detail: 'Reformats to UEM standard template and voice.', human_minutes: 120, agent_seconds: 20 },
    ],
    outcome: 'First-draft time reduced from 8–12h to 2–3h per proposal. More proposals submitted per year.',
    pitchLine: '"Your senior engineers are doing $25/hr copy-pasting. We give them those 9 hours back on every single proposal."',
  },
  {
    agentName: 'rfp-monitoring',
    scenario: 'Monitoring Ontario procurement portals for relevant opportunities',
    trigger: 'Scheduled 4-hour scan of Merx, Bids&Tenders, Bonfire',
    beforeAgents: { duration: '15 hours/week', description: 'Staff sporadically checks portals when not heads-down on projects. Opportunities are missed.' },
    withAgents: { duration: '0 hours/week', description: 'Agent scans all portals 24/7, scores opportunities by fit, and delivers a ranked briefing every Monday.' },
    steps: [
      { step: 1, label: 'Scan all portals', detail: 'Checks Merx, Bids&Tenders, Bonfire, and municipal sites.', human_minutes: 240, agent_seconds: 45 },
      { step: 2, label: 'Filter and score', detail: 'Filters by UEM service profile and scores fit (1-10).', human_minutes: 120, agent_seconds: 15 },
      { step: 3, label: 'Deliver weekly briefing', detail: 'Monday 07:00 briefing sent to principals with top 5 RFPs.', human_minutes: 60, agent_seconds: 5 },
    ],
    outcome: 'Zero missed procurement opportunities. 2-4 additional RFPs captured per year.',
    pitchLine: '"How many $150K RFPs did you miss last year because your team was too busy doing the work to look for the work?"',
  }
];

const UEM_EXPLAIN: Record<string, { howItWorks: string; savesPerWeek: string; replaces: string }> = {
  'proposal-intelligence': { howItWorks: 'Learns from past proposals to auto-draft sections and PIFs.', savesPerWeek: '48 hrs', replaces: 'Senior staff copy-pasting' },
  'rfp-monitoring': { howItWorks: 'Scans Ontario portals 24/7 and delivers a ranked Monday briefing.', savesPerWeek: '15 hrs', replaces: 'Manual portal checking' },
  'meeting-intelligence': { howItWorks: 'Converts notes to branded minutes and extracts action items.', savesPerWeek: '18 hrs', replaces: 'Admin minute-taking' },
  'planning-intelligence': { howItWorks: 'Monitors policy updates and reviews site plans against bylaws.', savesPerWeek: '16 hrs', replaces: 'Manual policy research' },
  'field-inspection': { howItWorks: 'Pulls data and drafts inspection reports from company templates.', savesPerWeek: '18 hrs', replaces: 'Manual report formatting' },
  'cad-automation': { howItWorks: 'Identifies missing components and creates subassemblies.', savesPerWeek: '30 hrs', replaces: 'Repetitive CAD drafting' },
  'asset-management': { howItWorks: 'Processes condition data for O. Reg. 588/17 AM plans.', savesPerWeek: '35 hrs', replaces: 'Weeks of manual modeling' },
  'financial-operations': { howItWorks: 'Generates draft invoices and automates bookkeeping.', savesPerWeek: '8 hrs', replaces: 'Manual invoice drafting' },
};

export const DEMO_PERSONAS: Record<PersonaSlug, PersonaConfig> = {
  florist: {
    slug: 'florist',
    businessName: FLORIST_PERSONA.businessName,
    tagline: FLORIST_PERSONA.tagline,
    industry: 'Florist / Gift Retail',
    accent: 'rose',
    iconKey: 'Flower2',
    location: FLORIST_PERSONA.location,
    nextEvent: FLORIST_PERSONA.nextHoliday,
    hourlyRate: 32,
    humanCostMonthly: 6346,
    agents: FLORIST_AGENTS,
    kpiRow: FLORIST_KPI_ROW,
    activityLines: FLORIST_ACTIVITY,
    campaigns: FLORIST_CAMPAIGNS,
    events: FLORIST_EVENTS,
    queuedPosts: FLORIST_QUEUED,
    pitch: FLORIST_PITCH,
    workflows: FLORIST_WORKFLOWS,
    agentExplanations: FLORIST_EXPLAIN,
  },
  dental: {
    slug: 'dental',
    businessName: 'Bright Smile Dental',
    tagline: 'Family Dentistry · Mississauga, ON',
    industry: 'Dental Practice',
    accent: 'cyan',
    iconKey: 'Stethoscope',
    location: 'Mississauga, ON',
    nextEvent: { name: 'Spring Recall Push', daysOut: 8 },
    hourlyRate: 38,
    humanCostMonthly: 8120,
    agents: DENTAL_AGENTS,
    kpiRow: DENTAL_KPIS,
    activityLines: DENTAL_ACTIVITY,
    campaigns: [],
    events: [],
    queuedPosts: [],
    pitch: DENTAL_PITCH,
    workflows: DENTAL_WORKFLOWS,
    agentExplanations: DENTAL_EXPLAIN,
  },
  brandhaven: {
    slug: 'brandhaven',
    businessName: 'Cogeco Homes',
    tagline: 'Custom Home Builder · Hamilton, ON',
    industry: 'Custom Home Builder',
    accent: 'amber',
    iconKey: 'Hammer',
    location: 'Hamilton, ON',
    nextEvent: { name: 'Maple Ridge Closing', daysOut: 18 },
    hourlyRate: 42,
    humanCostMonthly: 9560,
    agents: BRANDHAVEN_AGENTS,
    kpiRow: BRANDHAVEN_KPIS,
    activityLines: BRANDHAVEN_ACTIVITY,
    campaigns: [],
    events: [],
    queuedPosts: [],
    pitch: COGECO_PITCH,
    workflows: COGECO_WORKFLOWS,
    agentExplanations: COGECO_EXPLAIN,
  },
  uem: {
    slug: 'uem',
    businessName: 'UEM Consulting',
    tagline: 'Engineering & Planning · Ontario',
    industry: 'Engineering / Planning',
    accent: 'cyan',
    iconKey: 'Hammer',
    location: 'Ontario',
    nextEvent: { name: 'Q3 Board Meeting', daysOut: 12 },
    hourlyRate: 110,
    humanCostMonthly: 73913,
    agents: UEM_AGENTS,
    kpiRow: UEM_KPIS,
    activityLines: UEM_ACTIVITY,
    campaigns: [],
    events: [],
    queuedPosts: [],
    pitch: UEM_PITCH,
    workflows: UEM_WORKFLOWS,
    agentExplanations: UEM_EXPLAIN,
  },
};

export function getPersona(slug?: string | null): PersonaConfig {
  if (slug && slug in DEMO_PERSONAS) return DEMO_PERSONAS[slug as PersonaSlug];
  return DEMO_PERSONAS.florist;
}

export function makeActivityFor(persona: PersonaConfig, seed: number, baseTime: number) {
  const line = persona.activityLines[seed % persona.activityLines.length];
  return {
    id: `${baseTime}-${seed}`,
    agent_name: line.agent,
    status: line.status,
    task: line.task,
    timestamp: baseTime,
  };
}

export function buildInitialActivityFor(persona: PersonaConfig, count = 8) {
  const out = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    out.push(makeActivityFor(persona, i, now - i * 4500));
  }
  return out;
}

export function impactFor(persona: PersonaConfig) {
  const totalHours = persona.agents.reduce((s, a) => s + a.weeklyHoursSaved, 0);
  return {
    weeklyHoursSaved: Math.round(totalHours * 10) / 10,
    fteEquivalent: Math.round((totalHours / 40) * 100) / 100,
    annualHoursSaved: Math.round(totalHours * 52),
    annualCostSaved: Math.round(totalHours * 52 * persona.hourlyRate),
    hourlyRate: persona.hourlyRate,
  };
}
