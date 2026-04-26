// Demo data for live-audience walkthrough.
// Persona: Petal & Stem — a thriving local florist in Hamilton, Ontario.
// All numbers are static-but-believable. The activity ticker rotates so the
// feed feels alive on a projector.

export interface DemoAgent {
    name: string;
    label: string;
    description: string;
    status: 'running' | 'idle' | 'queued';
    currentTask?: string;
    outcomeMetric: string; // short outcome shown in the "running now" box (e.g. "47 orders / wk")
    weeklyHoursSaved: number; // estimated hours per week this agent saves a human florist / marketer
}

export interface DemoCampaign {
    id: string;
    name: string;
    status: 'live' | 'queued' | 'draft';
    channels: string[];
    progress: number;
    posts: number;
    posted: number;
    metrics: { reach: number; engagement: number; saves: number };
    image: string;
    accent: string; // tailwind from-X-Y to-X-Y for fallback gradient
}

export interface DemoEvent {
    id: string;
    title: string;
    date: string; // human label
    type: 'wedding' | 'corporate' | 'funeral' | 'birthday' | 'custom';
    arrangements: number;
    status: 'confirmed' | 'preview' | 'in-progress';
    image: string;
}

export interface DemoQueuedPost {
    id: string;
    platform: 'instagram' | 'twitter' | 'facebook' | 'youtube' | 'google' | 'tiktok';
    title: string;
    scheduledFor: string;
    type: 'reel' | 'carousel' | 'single' | 'story' | 'tiktok';
    image: string;
    readyToPublish?: boolean;
}

export interface DemoReel {
    id: string;
    platform: 'instagram' | 'youtube';
    title: string;
    duration: string;
    views: string;
    image: string;
    accent: string;
}

export const DEMO_PERSONA = {
    businessName: 'Petal & Stem',
    tagline: 'Custom Floral Design · Hamilton, Ontario',
    accent: 'rose',
    location: 'Hamilton, ON',
    nextHoliday: { name: "Mother's Day", daysOut: 12 },
};

export const DEMO_KPIS = {
    activeAgents: 6,
    agentRunsToday: 47,
    postsQueued: 47,
    weeklyReach: 184_300,
    engagementRate: 6.4,
    eventsThisWeek: 12,
    liveCampaigns: 4,
    avgResponseTime: '4m',
};

// The first 6 (status: running) match the "AGENTS RUNNING NOW" cards in the demo screenshot.
// Order matters — first 6 are rendered as the top live row.
export const DEMO_AGENTS: DemoAgent[] = [
    { name: 'content-strategist', label: 'Content Strategist', description: 'Plans the seasonal content calendar around weddings, holidays, and local events.', status: 'running', currentTask: "Building Mother's Day campaign (32 posts across 4 platforms)", outcomeMetric: '32 posts planned / wk', weeklyHoursSaved: 4 },
    { name: 'caption-writer', label: 'Caption Writer', description: 'Writes captions, blog copy, and ad copy in Petal & Stem\'s warm, romantic voice.', status: 'running', currentTask: 'Drafting 3 caption variants for tomorrow\'s "Spring Bridal Collection" reel', outcomeMetric: '47 captions / wk', weeklyHoursSaved: 9.4 },
    { name: 'visual-director', label: 'Visual Director', description: 'Storyboards reels, finds trending visuals, and locks the look for every shoot.', status: 'running', currentTask: 'Storyboarding Mother\'s Day bouquet reveal · Pantone Peach Fuzz palette', outcomeMetric: '8 reels storyboarded / wk', weeklyHoursSaved: 6 },
    { name: 'scheduler', label: 'Scheduler', description: 'Pushes approved posts to Instagram, Facebook, TikTok, YouTube, and Google Business.', status: 'running', currentTask: 'Queuing 6 posts including 2 TikToks for the Mother\'s Day long weekend push', outcomeMetric: '47 posts scheduled / wk', weeklyHoursSaved: 4 },
    { name: 'engagement-responder', label: 'Engagement Responder', description: 'Handles Instagram, Facebook, and TikTok DMs and comments — quotes, availability, order questions.', status: 'running', currentTask: '6 DMs answered in the last hour · 2 converted to orders', outcomeMetric: '84 DMs replied / wk', weeklyHoursSaved: 7 },
    { name: 'special-events-coordinator', label: 'Special Events Coordinator', description: 'Tracks weddings, funerals, and corporate events — auto-preps reminders & checklists.', status: 'running', currentTask: 'Hartmann wedding (Sat) — 48hr reminder sent · 112 arrangements confirmed', outcomeMetric: '6 events tracked / wk', weeklyHoursSaved: 3.5 },
    { name: 'hashtag-researcher', label: 'Hashtag & SEO', description: 'Finds the highest-reach flower / event / local tags for every post.', status: 'idle', currentTask: 'Last run found 18 wedding tags · avg 9.4k searches / mo', outcomeMetric: '18 tag sets / wk', weeklyHoursSaved: 2.8 },
    { name: 'google-ads', label: 'Google Ads Manager', description: 'Optimises local search ads targeting Hamilton brides, event planners, and gifters.', status: 'idle', currentTask: 'CTR up 18% after last bid adjustment · CPC down to $0.74', outcomeMetric: '$12 ROAS this month', weeklyHoursSaved: 4 },
    { name: 'analytics-watcher', label: 'Analytics Watcher', description: 'Flags posts running above/below baseline and recommends boosts.', status: 'idle', currentTask: 'TikTok bouquet reveal: 48.2k views in 6hrs · recommend boosting', outcomeMetric: 'Weekly perf review', weeklyHoursSaved: 2.8 },
    { name: 'influencer-liaison', label: 'Influencer Liaison', description: 'Manages outreach and reposts from local wedding photographers and venues.', status: 'queued', currentTask: 'Draft DM to @hamiltonweddings (14.2k followers) for spring collab', outcomeMetric: '4 collabs / mo', weeklyHoursSaved: 2.3 },
];

const _totalWeeklyHours = DEMO_AGENTS.reduce((s, a) => s + a.weeklyHoursSaved, 0);
const _hourlyMarketerRate = 32;
export const DEMO_IMPACT = {
    weeklyHoursSaved: Math.round(_totalWeeklyHours * 10) / 10,
    fteEquivalent: Math.round((_totalWeeklyHours / 40) * 100) / 100,
    annualHoursSaved: Math.round(_totalWeeklyHours * 52),
    annualCostSaved: Math.round(_totalWeeklyHours * 52 * _hourlyMarketerRate),
    hourlyRate: _hourlyMarketerRate,
};

// Real Unsplash photo URLs — flowers, weddings, bouquets.
const U = (id: string, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const DEMO_CAMPAIGNS: DemoCampaign[] = [
    {
        id: 'c1', name: "Mother's Day Collection 2026",
        status: 'live', channels: ['Instagram', 'TikTok', 'Facebook', 'Google'],
        progress: 42, posts: 18, posted: 8,
        metrics: { reach: 41_200, engagement: 7.2, saves: 1_840 },
        image: '/images/demo/mothers-day.png',
        accent: 'from-rose-500 to-pink-400',
    },
    {
        id: 'c2', name: 'Spring Bridal Collection',
        status: 'live', channels: ['Instagram', 'TikTok', 'YouTube'],
        progress: 68, posts: 12, posted: 8,
        metrics: { reach: 28_700, engagement: 9.1, saves: 3_410 },
        image: '/images/demo/wedding.png',
        accent: 'from-pink-400 to-rose-300',
    },
    {
        id: 'c3', name: 'Corporate Event Florals',
        status: 'live', channels: ['Instagram', 'Facebook', 'LinkedIn'],
        progress: 80, posts: 8, posted: 6,
        metrics: { reach: 12_600, engagement: 4.8, saves: 320 },
        image: '/images/demo/corporate.png',
        accent: 'from-emerald-500 to-teal-400',
    },
    {
        id: 'c4', name: 'TikTok Floral Trends Series',
        status: 'live', channels: ['TikTok', 'Instagram'],
        progress: 55, posts: 10, posted: 6,
        metrics: { reach: 84_400, engagement: 11.3, saves: 5_210 },
        image: '/images/demo/reel-wrap.png',
        accent: 'from-violet-500 to-pink-500',
    },
    {
        id: 'c5', name: "Father's Day Gifting",
        status: 'queued', channels: ['Instagram', 'Facebook', 'TikTok'],
        progress: 0, posts: 10, posted: 0,
        metrics: { reach: 0, engagement: 0, saves: 0 },
        image: '/images/demo/corporate.png',
        accent: 'from-blue-400 to-indigo-400',
    },
];

export const DEMO_REELS: DemoReel[] = [
    { id: 'r1', platform: 'instagram', title: 'Behind the scenes: building a 200-stem bridal arch', duration: '0:47', views: '18.4k', image: '/images/demo/reel-arch.png', accent: 'from-rose-500 to-pink-400' },
    { id: 'r2', platform: 'youtube', title: 'How we design a same-day funeral arrangement', duration: '4:12', views: '6.2k', image: '/images/demo/funeral.png', accent: 'from-emerald-600 to-teal-500' },
    { id: 'r3', platform: 'instagram', title: 'Mother\'s Day bouquet speed wrap · 60 sec', duration: '0:58', views: '32.1k', image: '/images/demo/reel-wrap.png', accent: 'from-pink-500 to-rose-400' },
    { id: 'r4', platform: 'youtube', title: 'Full wedding florals walkthrough — Hartmann ceremony', duration: '7:22', views: '9.8k', image: '/images/demo/wedding.png', accent: 'from-rose-400 to-pink-300' },
];

export const DEMO_EVENTS: DemoEvent[] = [
    { id: 'e1', title: 'Hartmann — Garden Wedding', date: 'Sat Apr 28', type: 'wedding', arrangements: 112, status: 'confirmed', image: '/images/demo/wedding.png' },
    { id: 'e2', title: 'Calvary — Memorial Service', date: 'Sun Apr 29', type: 'funeral', arrangements: 8, status: 'in-progress', image: '/images/demo/funeral.png' },
    { id: 'e3', title: 'Chamber of Commerce Gala', date: 'Mon Apr 30', type: 'corporate', arrangements: 24, status: 'confirmed', image: '/images/demo/corporate.png' },
    { id: 'e4', title: 'Nguyen — Sweet 16 Party', date: 'Wed May 1', type: 'birthday', arrangements: 6, status: 'preview', image: '/images/demo/mothers-day.png' },
    { id: 'e5', title: 'Park — Micro Wedding Ceremony', date: 'Fri May 3', type: 'wedding', arrangements: 34, status: 'in-progress', image: '/images/demo/wedding.png' },
    { id: 'e6', title: 'TD Bank — Executive Table Settings', date: 'Sat May 4', type: 'corporate', arrangements: 18, status: 'confirmed', image: '/images/demo/corporate.png' },
];

export const DEMO_QUEUED_POSTS: DemoQueuedPost[] = [
    { id: 'p1', platform: 'tiktok', title: '🌸 POV: You just found the BEST Mother\'s Day bouquet in Hamilton', scheduledFor: 'Today · 10:00 AM', type: 'tiktok', image: '/images/demo/mothers-day.png', readyToPublish: true },
    { id: 'p2', platform: 'instagram', title: "Mother's Day is 12 days away 🌸 — reel drop", scheduledFor: 'Today · 11:30 AM', type: 'reel', image: '/images/demo/mothers-day.png', readyToPublish: true },
    { id: 'p3', platform: 'tiktok', title: 'Bridal arch build in 60 seconds 💐 #weddingflorals #hamilton', scheduledFor: 'Today · 2:00 PM', type: 'tiktok', image: '/images/demo/reel-arch.png', readyToPublish: true },
    { id: 'p4', platform: 'youtube', title: 'Full bridal arch build — time lapse', scheduledFor: 'Today · 4:15 PM', type: 'single', image: '/images/demo/reel-arch.png', readyToPublish: true },
    { id: 'p5', platform: 'instagram', title: 'Spring colour palette reveal — Pantone Peach Fuzz', scheduledFor: 'Tomorrow · 9:00 AM', type: 'carousel', image: '/images/demo/mothers-day.png', readyToPublish: false },
    { id: 'p6', platform: 'tiktok', title: 'How I wrapped 47 bouquets before 8am ☀️ #florist #behindthescenes', scheduledFor: 'Tomorrow · 12:00 PM', type: 'tiktok', image: '/images/demo/reel-wrap.png', readyToPublish: false },
    { id: 'p7', platform: 'facebook', title: "Order your Mother's Day bouquet before we sell out", scheduledFor: 'Sat · 2:00 PM', type: 'single', image: '/images/demo/mothers-day.png', readyToPublish: false },
    { id: 'p8', platform: 'google', title: "Petal & Stem: Mother's Day pre-orders open", scheduledFor: 'Sun · 8:00 AM', type: 'single', image: '/images/demo/wedding.png', readyToPublish: false },
    { id: 'p9', platform: 'tiktok', title: 'The flower that says "I love you" without saying a word 🌹', scheduledFor: 'Sun · 11:00 AM', type: 'tiktok', image: '/images/demo/mothers-day.png', readyToPublish: false },
    { id: 'p10', platform: 'youtube', title: 'Sympathy arrangement walkthrough — gentle & dignified', scheduledFor: 'Sun · 7:00 PM', type: 'single', image: '/images/demo/funeral.png', readyToPublish: false },
];

// Activity ticker — rotates so the feed always shows fresh entries during a live demo.
const ACTIVITY_LINES: { agent: string; status: 'running' | 'succeeded'; task: string }[] = [
    { agent: 'copywriter', status: 'succeeded', task: 'Drafted 3 caption variants for "Spring Bridal Collection" reel' },
    { agent: 'dm-responder', status: 'running', task: 'Responding to 6 Instagram DMs — 2 converted to confirmed orders' },
    { agent: 'hashtag-researcher', status: 'succeeded', task: 'Found 18 trending wedding hashtags · avg 9.4k searches / mo' },
    { agent: 'events-coordinator', status: 'succeeded', task: 'Sent 48hr reminder for Hartmann wedding · 112 arrangements confirmed' },
    { agent: 'analytics-watcher', status: 'succeeded', task: 'Bridal bouquet reel running +240% above baseline — boosted $20' },
    { agent: 'dm-responder', status: 'running', task: 'Quoting a corporate centrepiece order for TD Bank gala (18 tables)' },
    { agent: 'events-coordinator', status: 'succeeded', task: "Mother's Day pre-order count updated — 47 orders confirmed" },
    { agent: 'scheduler', status: 'succeeded', task: "Queued 4 posts for Mother's Day weekend push across Instagram & Facebook" },
    { agent: 'content-strategist', status: 'running', task: "Building Mother's Day campaign calendar — 14 posts across 4 platforms" },
    { agent: 'copywriter', status: 'running', task: "Drafting Google Business update for Mother's Day extended hours" },
    { agent: 'influencer-liaison', status: 'succeeded', task: 'Sent collab DM to @hamiltonweddings (14.2k followers)' },
    { agent: 'analytics-watcher', status: 'succeeded', task: 'Best post this week: "Hartmann arch build reel" — 32.1k plays' },
    { agent: 'google-ads', status: 'succeeded', task: "Mother's Day local search ads: CTR 8.4% · CPC $0.74 · ROAS $12" },
    { agent: 'hashtag-researcher', status: 'running', task: 'Cross-referencing #hamiltonweddings regional search volume' },
    { agent: 'dm-responder', status: 'succeeded', task: 'Resolved 12 order enquiries autonomously · avg response 4 min' },
    { agent: 'photographer-scout', status: 'running', task: 'Sourcing Pantone Peach Fuzz spring bouquet references (22 found)' },
    { agent: 'scheduler', status: 'succeeded', task: 'Synced this week\'s content to Meta Business Suite + Google' },
    { agent: 'events-coordinator', status: 'running', task: 'Building setup checklist for Chamber of Commerce gala (24 arrangements)' },
    { agent: 'content-strategist', status: 'succeeded', task: 'Locked next 14 days of content pipeline — alternating weddings/gifting' },
    { agent: 'copywriter', status: 'succeeded', task: 'Refreshed evergreen floral care tips library (78 entries)' },
];

export function makeActivityEntry(seedIndex: number, baseTime: number) {
    const line = ACTIVITY_LINES[seedIndex % ACTIVITY_LINES.length];
    return {
        id: `demo-${seedIndex}-${baseTime}`,
        agent_name: line.agent,
        status: line.status as string,
        task: line.task,
        created_at: new Date(baseTime - seedIndex * 47_000).toISOString(),
    };
}

export function buildInitialActivity(count = 8) {
    const now = Date.now();
    return Array.from({ length: count }).map((_, i) => makeActivityEntry(i, now));
}
