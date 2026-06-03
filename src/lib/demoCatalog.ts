// Catalog of industry-specific AI agent demos used in /dashboard/sales-training
// to train sales reps on how to position AI agents for different verticals.

export interface DemoIndustry {
  slug: string;
  industry: string;
  persona: string;       // sample business name
  location?: string;
  employees?: number;
  hero: string;          // short positioning headline
  pain: string;          // the recurring problem this vertical hits
  outcome: string;       // measurable outcome the agents deliver
  annualSavings: string; // headline ROI
  payback: string;       // payback window
  agents: string[];      // names of agents in the package
  discoveryQuestions: string[];
  talkingPoints: string[];
  objections: { q: string; a: string }[];
  demoPath: string;      // route to open the live demo
  accent: string;        // tailwind gradient class for the card
  available: boolean;    // is the live demo wired up yet?
}

export const DEMO_CATALOG: DemoIndustry[] = [
  {
    slug: 'florist',
    industry: 'Florist / Gift Retail',
    persona: 'Petal & Stem',
    location: 'Hamilton, ON',
    employees: 11,
    hero: 'Owner-operator drowning in DMs, captions, and seasonal pushes',
    pain: 'Single owner managing IG/FB/TikTok content, DMs, ad copy, and event prep — every Mother\'s / Valentine\'s / wedding season is a panic.',
    outcome: '6 always-on agents handle content, captions, scheduling, DMs, events, and analytics — cutting ~40 marketing hrs/week.',
    annualSavings: '$66,500',
    payback: '2.3 months',
    agents: ['Content Strategist', 'Caption Writer', 'Visual Director', 'Scheduler', 'Engagement Responder', 'Special Events Coordinator'],
    discoveryQuestions: [
      'How many hours a week do you spend writing captions and replying to DMs?',
      'How far ahead are you usually planning content — same week, or next month?',
      'Who handles posting when you\'re working a wedding or event on the weekend?',
      'How often do you miss replying to a DM that turned into an order?',
    ],
    talkingPoints: [
      'Six agents, not chatbots — each one owns a job (content, captions, DMs, events).',
      'Trained on your voice and your seasonal calendar — Mother\'s Day, weddings, funerals.',
      'Mission Control dashboard shows every action they take, every DM reply, every post queued.',
      'You stay in approval mode — agents draft, you click "Approve" or "Tweak".',
    ],
    objections: [
      { q: 'I tried ChatGPT, it sounds generic.', a: 'These are custom-trained on your brand voice and product line. We feed them your past captions, reviews, and FAQ — output is indistinguishable from your own writing.' },
      { q: 'I don\'t want a bot replying to my DMs.', a: 'Default mode is suggestions. The agent drafts a reply, you tap to send. Once you trust it, you can flip individual flows to auto-send.' },
      { q: 'How long until it\'s working?', a: 'Two weeks to first agent in production. Six agents fully tuned in ~30 days.' },
    ],
    demoPath: '/demo/florist',
    accent: 'from-rose-500/20 to-pink-500/20',
    available: true,
  },
  {
    slug: 'dental',
    industry: 'Dental Practice',
    persona: 'Bright Smile Dental',
    location: 'Mississauga, ON',
    employees: 14,
    hero: 'Front desk eaten alive by booking calls and post-visit notes',
    pain: 'Reception spends 60% of the day on phone scheduling, no-show rescheduling, and clinical note transcription. High-paid hygienists waiting on chart writeups.',
    outcome: 'Scheduling AI on SMS handles bookings + waitlist; clinical-note AI generates SOAP notes in 3 mins per visit.',
    annualSavings: '$48,200',
    payback: '3.1 months',
    agents: ['Scheduling Assistant', 'Recall & Reminder Agent', 'Clinical Transcriber', 'Insurance Claim Agent', 'Waitlist Optimizer', 'Review Collector', 'Treatment Plan Drafter', 'New Patient Intake'],
    discoveryQuestions: [
      'How many no-shows do you average a week and what does each cost you?',
      'How long after a patient leaves does the SOAP note actually get written?',
      'Where do new-patient inquiries come in — phone, web form, Google?',
      'Are your hygienists ever waiting on charting before starting the next patient?',
    ],
    talkingPoints: [
      '67% drop in no-shows once SMS reminders + waitlist auto-fill are live.',
      'Clinical agent listens during the appointment (HIPAA-safe), drafts the SOAP note, hygienist approves in 30 seconds.',
      'Front desk goes from reactive to proactive — calls become a backup channel, not the primary one.',
    ],
    objections: [
      { q: 'Are these tools HIPAA / PHIPA compliant?', a: 'Yes. Audio is processed in a Canadian region with PHIPA-compliant Audcomp infrastructure. No data leaves the country.' },
      { q: 'Patients don\'t want to text our office.', a: 'They already do — they just text the personal cell of whoever answered last time. We give them an official channel that\'s logged in your PMS.' },
    ],
    demoPath: '/demo/dental',
    accent: 'from-cyan-500/20 to-teal-500/20',
    available: true,
  },
  {
    slug: 'manufacturing',
    industry: 'Manufacturing / Metalworks',
    persona: 'Precision Metal Works',
    location: 'Hamilton, ON',
    employees: 48,
    hero: 'Manual QC missing 28% of defects; clients rejecting batches',
    pain: 'Quality control is a human visually inspecting parts under fluorescent light. Misses surface defects → rework cycles + 4.2% client rejection rate.',
    outcome: 'Computer-vision QC at three production stages flags defects in real time. Predictive maintenance prevents machine failures.',
    annualSavings: '$87,400',
    payback: '4.2 months',
    agents: ['Computer Vision QC', 'Predictive Maintenance', 'Production Analytics', 'Reject Triage Agent'],
    discoveryQuestions: [
      'What\'s your current first-pass yield, and what does each rework cost?',
      'How often do you ship a batch and have it bounce back from the client?',
      'When a CNC fails, do you find out from the operator or from the part it ruined?',
      'Are you running on legacy PLCs or do you have modern sensor data flowing somewhere?',
    ],
    talkingPoints: [
      '41% reduction in defects in 8 weeks — measured against your own pre-deploy baseline.',
      'Cameras are off-the-shelf USB3 industrial — no exotic hardware, no rip-and-replace.',
      'Predictive maintenance uses vibration + temperature curves — flags failure 3-7 days out.',
    ],
    objections: [
      { q: 'My machines are 20 years old.', a: 'We don\'t need to replace them. We add sensors externally — they don\'t even need to know they\'re being monitored.' },
      { q: 'My operators will think we\'re replacing them.', a: 'You\'re replacing the manual inspection job, not the machinist. Most clients redeploy that headcount to a setup or programming role — both pay better.' },
    ],
    demoPath: '/demo?industry=manufacturing',
    accent: 'from-slate-500/20 to-zinc-500/20',
    available: false,
  },
  {
    slug: 'accounting',
    industry: 'Accounting Firm',
    persona: 'Clearview Accounting',
    location: 'Calgary, AB',
    employees: 34,
    hero: 'Senior accountants doing $25/hr work — and you can\'t hire',
    pain: 'During tax season, $80/hr senior accountants are doing invoice data entry and tax-research database lookups. Talent pipeline is dry.',
    outcome: 'Invoice automation extracts and categorizes with 99.2% accuracy. Tax-research AI surfaces relevant rulings in seconds.',
    annualSavings: '$131,000',
    payback: '2.0 months',
    agents: ['Invoice Automation', 'Tax Research AI', 'Client Onboarding Bot', 'CRA Letter Drafter'],
    discoveryQuestions: [
      'What does a partner-hour cost vs a junior-hour, and which one is doing data entry today?',
      'How many tax-research lookups do your seniors do during March/April?',
      'How long does new-client onboarding take from engagement letter to active in your system?',
    ],
    talkingPoints: [
      '15 hours/week saved per accountant during tax season — straight to the bottom line.',
      '99.2% extraction accuracy — better than your best junior, runs in seconds.',
      'Tax-research agent reads CRA bulletins, court rulings, and your past memos to surface precedent.',
    ],
    objections: [
      { q: 'My partners need to see every invoice.', a: 'They still do — agent drafts the categorization, partner approves. Goes from 90 sec/invoice to 8 sec/invoice.' },
      { q: 'Auditing standards require human review.', a: 'Agreed. Agents prep, humans review. We don\'t eliminate the human — we eliminate the typing.' },
    ],
    demoPath: '/demo?industry=accounting',
    accent: 'from-blue-500/20 to-indigo-500/20',
    available: false,
  },
  {
    slug: 'brandhaven',
    industry: 'Custom Home Builder',
    persona: 'Cogeco Homes',
    location: 'Hamilton, ON',
    employees: 38,
    hero: 'Bidding takes 5 days, change orders bleed margin, sites run on text messages',
    pain: 'Estimating, change orders, subcontractor scheduling, and safety logs all live in someone\'s head or a notebook. Margins shrink with every untracked CO and every missed sub.',
    outcome: 'AI Bid Estimator builds bids from spec + history in hours. Subcontractor Coordinator schedules and reminds. Site Progress Reporter sends weekly client updates with photos. Change Order Drafter ties every CO to the budget and gets it signed.',
    annualSavings: '$112,400',
    payback: '3.4 months',
    agents: ['AI Bid Estimator', 'Site Progress Reporter', 'Subcontractor Coordinator', 'Change Order Drafter', 'Safety Compliance Agent', 'Lead Qualifier', 'Budget Watch', 'Permit Tracker'],
    discoveryQuestions: [
      'How long is your average bid turnaround — and how often do you lose a job because someone else bid first?',
      'When the framer is a day late, who notices first — you, the homeowner, or the foreman on site?',
      'How much margin disappeared into untracked change orders on your last 3 builds?',
      'Where do site photos live today — texts, WhatsApp, a shared drive?',
      'How are you keeping homeowners informed during the build — weekly call, email, drive-by?',
    ],
    talkingPoints: [
      '60% faster bid prep means you bid 2-3x more jobs without adding an estimator.',
      'Every change order is drafted, priced, and tied to the project budget — homeowners e-sign in the same email thread.',
      'Weekly progress emails to homeowners with site photos — auto-generated, branded, sent every Friday at 7am.',
      'Subcontractor Coordinator sees scheduling conflicts 3-5 days out — fixes them before the framer drives to a closed site.',
      '100% safety log compliance from a foreman snapping site photos on their phone.',
    ],
    objections: [
      { q: 'Every custom build is unique, AI can\'t price it.', a: 'Agreed — but 70% of line items (lumber, drywall, fixtures, labor classes) repeat across builds. AI does the 70%, your estimator does the unique 30% in 2 hours instead of 2 days.' },
      { q: 'My foremen aren\'t going to use new software.', a: 'They already use a smartphone. Photos go to a Telegram or WhatsApp number we provide — agent does the rest. Foreman doesn\'t learn anything new.' },
      { q: 'Homeowners want a phone call, not an automated email.', a: 'They get both. Agent prepares the weekly update; your PM still picks up the phone for the conversation. Removes the typing, not the relationship.' },
    ],
    demoPath: '/demo/brandhaven',
    accent: 'from-amber-500/20 to-orange-500/20',
    available: true,
  },
  {
    slug: 'retail',
    industry: 'Independent Grocery / Retail',
    persona: 'Fresh Harvest Market',
    location: 'Ottawa, ON',
    employees: 28,
    hero: '$80k/year in food waste vs the chains — and you can\'t price-match',
    pain: 'Static pricing means perishables get marked down too late. Independent grocer can\'t compete on volume, but bleeds on waste.',
    outcome: 'Demand forecasting predicts daily SKU movement; dynamic markdown engine adjusts perishable prices to maximize sell-through.',
    annualSavings: '$41,600',
    payback: '5.0 months',
    agents: ['Perishable Forecasting', 'Dynamic Pricing Engine', 'Waste Analytics', 'Reorder Trigger Agent'],
    discoveryQuestions: [
      'How much spoiled product are you writing off per week?',
      'When you mark something down, how do you decide the new price — gut, formula, or POS?',
      'Are your supplier reorders based on POS pull or on a manager walking the floor?',
    ],
    talkingPoints: [
      '45% reduction in waste in 60 days — pays for itself in the first quarter.',
      'Dynamic markdown is invisible to the customer — they see "Today\'s Price" labels, not panic discounting.',
      '94% sell-through rate vs 71% baseline.',
    ],
    objections: [
      { q: 'Customers will catch on and wait for markdowns.', a: 'Markdowns are tied to expiry, not time-of-day. The system stops marking down once a SKU is going to clear naturally.' },
    ],
    demoPath: '/demo?industry=retail',
    accent: 'from-lime-500/20 to-emerald-500/20',
    available: false,
  },
  {
    slug: 'uem',
    industry: 'Engineering & Planning',
    persona: 'UEM Consulting',
    location: 'Ontario',
    employees: 150,
    hero: '6 quick-win agents combined: $819K/year in recovered staff capacity.',
    pain: 'Senior staff spend 12+ hours manually drafting proposals. Procurement portals are checked inconsistently, missing opportunities. Planning research is slow and CAD work is repetitive.',
    outcome: 'Proposal drafting time cut by 60-70%. 24/7 RFP monitoring prevents missed opportunities. CAD tasks and inspection reports automated.',
    annualSavings: '$819,000',
    payback: '1.0 months',
    agents: ['Proposal Intelligence', 'RFP Monitoring', 'Meeting Intelligence', 'Planning Intelligence', 'Field Inspection', 'CAD Automation', 'Asset Management AI', 'Financial Operations'],
    discoveryQuestions: [
      'How many hours per week do your senior engineers/planners spend writing proposals from scratch?',
      'How many RFP opportunities do you estimate you miss each quarter because your team is heads-down on active projects?',
      'What does a partner-hour cost vs a junior-hour, and which one is doing data entry for field inspections today?',
      'How much time is lost manually cross-referencing zoning bylaws and official municipal plans?',
    ],
    talkingPoints: [
      'Six quick-win agents deployed in under 30 days — delivering $819K/year in recovered staff capacity.',
      'Proposal Intelligence agent learns your past templates, cutting first-draft time from 12 hours to 2-3 hours.',
      'RFP Monitoring Agent checks Merx, Bids&Tenders, and Bonfire 24/7, delivering a ranked briefing every Monday morning.',
      'CAD Automation Agent identifies missing components and creates subassemblies in 15 minutes instead of 3 hours.',
    ],
    objections: [
      { q: 'Every engineering proposal is unique. Can an AI write it?', a: 'The agent writes the boilerplate—qualifications, past project experience, and standard approaches. Your engineers focus on the 30% that is a unique technical solution.' },
      { q: 'How does it handle confidential client data in planning or CAD files?', a: 'The models are ring-fenced. Your data never leaves your environment and is never used to train external models.' },
    ],
    demoPath: '/demo/uem',
    accent: 'from-cyan-500/20 to-blue-500/20',
    available: true,
  },
];

export const DEMO_TRAINING_RESOURCES = [
  { title: 'Discovery Call Script', desc: '5-question opener that surfaces pain in <10 minutes.', duration: '12 min read' },
  { title: 'ROI Calculator Walkthrough', desc: 'How to build a defensible $-saved number live in front of the prospect.', duration: '8 min video' },
  { title: 'Objection Handling Library', desc: '37 real objections from past calls + how senior reps answered them.', duration: '20 min read' },
  { title: 'Pricing & Packaging Cheat Sheet', desc: 'Starter / Growth / Enterprise — what\'s in each, when to upsell.', duration: '6 min read' },
];
