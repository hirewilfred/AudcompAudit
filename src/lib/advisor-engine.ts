import { AdvisorResponses } from './advisor-questions';

export interface Recommendation {
    tool: string;
    category: string;
    description: string;
    monthlyEstimate: string;
    annualEstimate: string;
    priority: 'high' | 'medium' | 'low';
    icon: string;
    tags: string[];
}

export interface RoadmapPhase {
    phase: number;
    title: string;
    timeline: string;
    color: string;
    items: string[];
}

export interface RoiDefaults {
    numUsers: number;
    hourlyRate: number;
    timeSavedPerMonth: number;
    annualCostPerUser: number;
    monthlyPages: number;
}

export function generateRecommendations(responses: AdvisorResponses): Recommendation[] {
    const recs: Recommendation[] = [];
    const tier = responses.m365_tier as string;
    const size = responses.company_size as string;
    const painPoints = (responses.pain_points as string[]) || [];
    const accounting = responses.accounting as string;
    const crm = responses.crm as string;
    const infra = responses.infrastructure as string;
    const storage = responses.file_storage as string;
    const sensitivity = responses.data_sensitivity as string;
    const budget = responses.monthly_budget as string;
    const aiUsage = responses.ai_usage as string;

    const hasCopilotTier = ['premium', 'e3', 'e5'].includes(tier);
    const hasAdvancedSecurity = ['premium', 'e3', 'e5'].includes(tier);
    const isEnterprise = ['201-1000', '1000+'].includes(size);
    const isSmall = ['1-10', '11-50'].includes(size);
    const budgetConstrained = budget === '0-500';

    // --- Microsoft 365 Copilot ---
    if (['standard', 'premium', 'e3', 'e5'].includes(tier)) {
        recs.push({
            tool: 'Microsoft 365 Copilot',
            category: 'Productivity',
            description: `Embedded AI across Word, Excel, Teams, Outlook and PowerPoint. Summarizes meetings, drafts emails, generates reports, and analyzes spreadsheets. Your existing M365 ${tier.toUpperCase()} plan is the foundation — Copilot is a natural add-on.`,
            monthlyEstimate: '$30/user/mo',
            annualEstimate: `~$360/user/yr`,
            priority: 'high',
            icon: 'Sparkles',
            tags: ['Productivity', 'Microsoft 365', 'Email', 'Meetings'],
        });
    }

    // --- Azure AI Document Intelligence (for document-heavy workflows) ---
    if (painPoints.includes('document_processing') || accounting !== 'none') {
        recs.push({
            tool: 'Azure AI Document Intelligence',
            category: 'Document Automation',
            description: 'Automatically extracts data from invoices, contracts, and forms with 95%+ accuracy. Integrates with SharePoint and your accounting tools to eliminate manual data entry.',
            monthlyEstimate: '$1–$10 per 1,000 pages',
            annualEstimate: 'Usage-based (~$50–$500/mo typical)',
            priority: 'high',
            icon: 'FileText',
            tags: ['Documents', 'Invoices', 'Automation', 'Azure'],
        });
    }

    // --- Copilot Studio (custom agents) ---
    if (!isSmall || !budgetConstrained) {
        recs.push({
            tool: 'Microsoft Copilot Studio',
            category: 'AI Agents',
            description: 'Build no-code AI agents for customer-facing chat, internal helpdesk, HR onboarding, and FAQ bots. No coding required — integrates directly with Teams and your business data.',
            monthlyEstimate: '$200/mo flat + $0.01/message',
            annualEstimate: '~$2,400+/yr base',
            priority: isEnterprise ? 'high' : 'medium',
            icon: 'Bot',
            tags: ['Agents', 'Chatbots', 'No-code', 'Teams'],
        });
    }

    // --- Dynamics 365 AI / Sales Copilot ---
    if (painPoints.includes('sales_qualification') || crm === 'dynamics_crm') {
        recs.push({
            tool: 'Microsoft Sales Copilot (Viva Sales)',
            category: 'Sales AI',
            description: 'AI-powered sales assistant that auto-generates CRM updates, summarizes customer calls, surfaces next best actions, and scores leads inside Outlook and Teams.',
            monthlyEstimate: '$50/user/mo',
            annualEstimate: '~$600/user/yr',
            priority: 'high',
            icon: 'TrendingUp',
            tags: ['Sales', 'CRM', 'Lead Scoring', 'Dynamics 365'],
        });
    }

    // --- Power Automate AI flows ---
    if (painPoints.includes('manual_data_entry') || painPoints.includes('reporting')) {
        recs.push({
            tool: 'Power Automate + AI Builder',
            category: 'Process Automation',
            description: 'Automate repetitive workflows between your apps (accounting, CRM, email) with intelligent triggers. AI Builder adds document processing, prediction models, and approval flows — no code needed.',
            monthlyEstimate: '$15–$40/user/mo',
            annualEstimate: '~$180–$480/user/yr',
            priority: 'high',
            icon: 'Zap',
            tags: ['Automation', 'No-code', 'Workflows', 'Integration'],
        });
    }

    // --- Microsoft Purview (data governance for sensitive data) ---
    if (['high', 'critical'].includes(sensitivity) || hasAdvancedSecurity) {
        recs.push({
            tool: 'Microsoft Purview',
            category: 'Data Governance',
            description: 'Automatically scans, classifies, and protects sensitive data across your file structure before you deploy AI tools. Required for regulated industries — ensures AI compliance and data residency.',
            monthlyEstimate: 'Included in E5 / ~$7/user/mo (add-on)',
            annualEstimate: tier === 'e5' ? 'Included in your E5 plan' : '~$84/user/yr',
            priority: ['high', 'critical'].includes(sensitivity) ? 'high' : 'medium',
            icon: 'Shield',
            tags: ['Compliance', 'Data Protection', 'PIPEDA', 'Governance'],
        });
    }

    // --- Power BI + Copilot for analytics ---
    if (painPoints.includes('reporting') || painPoints.includes('forecasting')) {
        recs.push({
            tool: 'Power BI + Copilot',
            category: 'Business Intelligence',
            description: 'Ask questions in plain English to generate dashboards, charts, and financial forecasts from your existing data. Connects to QuickBooks, Dynamics, Excel, SharePoint, and 100+ other sources.',
            monthlyEstimate: '$10/user/mo (Pro) or $20 (Premium)',
            annualEstimate: '~$120–$240/user/yr',
            priority: 'medium',
            icon: 'BarChart3',
            tags: ['Analytics', 'Reporting', 'Dashboards', 'BI'],
        });
    }

    // --- Azure OpenAI Service for custom solutions ---
    if (aiUsage === 'strategy' || aiUsage === 'advanced' || isEnterprise) {
        recs.push({
            tool: 'Azure OpenAI Service',
            category: 'Custom AI',
            description: 'Deploy GPT-4 and other frontier models within your own Azure environment with full data privacy. Build custom assistants, document Q&A systems, and AI-powered workflows on your proprietary data.',
            monthlyEstimate: 'Usage-based (~$100–$2,000/mo)',
            annualEstimate: 'Scales with usage',
            priority: isEnterprise ? 'high' : 'medium',
            icon: 'BrainCircuit',
            tags: ['Custom AI', 'GPT-4', 'Azure', 'Enterprise'],
        });
    }

    // --- SharePoint + Copilot for knowledge management ---
    if (painPoints.includes('knowledge_sharing') && ['sharepoint', 'mixed'].includes(storage)) {
        recs.push({
            tool: 'SharePoint + Microsoft Copilot',
            category: 'Knowledge Management',
            description: 'Instantly search and surface answers from your internal documents, wikis, and knowledge bases using natural language. Reduces onboarding time by up to 50% by making internal knowledge findable.',
            monthlyEstimate: 'Included with M365 plan + Copilot add-on',
            annualEstimate: 'Included in SharePoint license',
            priority: 'medium',
            icon: 'BookOpen',
            tags: ['Knowledge Base', 'Search', 'SharePoint', 'Onboarding'],
        });
    }

    // Ensure at least 3 recommendations
    if (recs.length < 3) {
        recs.push({
            tool: 'Microsoft Copilot for Microsoft 365',
            category: 'Productivity',
            description: 'Start your AI journey with the most accessible entry point: AI built into the tools your team already uses daily — Email, Teams meetings, Word documents, and Excel spreadsheets.',
            monthlyEstimate: '$30/user/mo',
            annualEstimate: '~$360/user/yr',
            priority: 'high',
            icon: 'Sparkles',
            tags: ['Starter', 'Productivity', 'Microsoft 365'],
        });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 6);
}

export function generateRoadmap(responses: AdvisorResponses): RoadmapPhase[] {
    const timeline = responses.timeline as string;
    const aiUsage = responses.ai_usage as string;
    const painPoints = (responses.pain_points as string[]) || [];

    const isBeginnerAI = aiUsage === 'none' || aiUsage === 'personal';
    const wantsQuick = timeline === 'asap' || timeline === '1-3m';

    return [
        {
            phase: 1,
            title: 'Quick Wins',
            timeline: wantsQuick ? 'Weeks 1–4' : 'Month 1–2',
            color: 'blue',
            items: [
                isBeginnerAI ? 'Pilot Microsoft 365 Copilot with 5–10 power users' : 'Audit existing AI tool utilization and ROI',
                'Assess data with Microsoft Purview for AI-readiness',
                painPoints.includes('document_processing') ? 'Deploy invoice/document automation for accounting' : 'Identify top 3 repetitive workflows to automate',
                'Establish AI usage policy and governance framework',
            ],
        },
        {
            phase: 2,
            title: 'Core Adoption',
            timeline: wantsQuick ? 'Month 2–3' : 'Month 3–5',
            color: 'indigo',
            items: [
                'Roll out Copilot or AI tools company-wide with training',
                painPoints.includes('manual_data_entry') ? 'Deploy Power Automate to eliminate manual data entry' : 'Automate top 3 identified workflows with Power Automate',
                painPoints.includes('reporting') ? 'Launch Power BI dashboards connected to live data sources' : 'Connect business data sources for unified reporting',
                'Build internal AI champion network to drive adoption',
            ],
        },
        {
            phase: 3,
            title: 'Scale & Optimize',
            timeline: wantsQuick ? 'Month 4–6' : 'Month 6–12',
            color: 'emerald',
            items: [
                'Build custom AI agent with Copilot Studio for top use case',
                'Measure and report ROI vs. initial projections',
                painPoints.includes('customer_service') ? 'Deploy customer-facing AI chatbot to reduce ticket volume' : 'Explore customer-facing AI opportunities',
                'Expand to Azure OpenAI for proprietary data solutions',
            ],
        },
    ];
}

export function generateRoiDefaults(responses: AdvisorResponses): RoiDefaults {
    const size = responses.company_size as string;
    const tier = responses.m365_tier as string;
    const industry = responses.industry as string;
    const painPoints = (responses.pain_points as string[]) || [];

    const sizeMap: Record<string, number> = {
        '1-10': 5,
        '11-50': 20,
        '51-200': 100,
        '201-1000': 450,
        '1000+': 1200,
    };

    const industryRateMap: Record<string, number> = {
        'professional_services': 85,
        'technology': 95,
        'finance': 110,
        'healthcare': 75,
        'manufacturing': 45,
        'retail': 35,
        'logistics': 45,
        'education': 40,
        'nonprofit': 40,
        'real_estate': 65,
    };

    const numUsers = sizeMap[size] || 25;
    const hourlyRate = industryRateMap[industry] || 55;

    // Time saved estimate based on pain points
    // Base savings (emails, meetings, basic tasks)
    let timeSaved = 4; // Start at 4 hours / month conservative
    
    if (painPoints.includes('email_overload')) timeSaved += 4;
    if (painPoints.includes('document_processing')) timeSaved += 6;
    if (painPoints.includes('reporting')) timeSaved += 3;
    if (painPoints.includes('manual_data_entry')) timeSaved += 5;
    if (painPoints.includes('customer_service')) timeSaved += 4;
    if (painPoints.includes('knowledge_sharing')) timeSaved += 2;
    
    // Efficiency multiplier for high-tier M365 (better integration)
    if (['premium', 'e3', 'e5'].includes(tier)) {
        timeSaved += 2;
    }

    const annualCostPerUser = tier === 'none' ? 120 : 360; 
    const monthlyPages = painPoints.includes('document_processing') ? 5000 : 0;

    return {
        numUsers,
        hourlyRate,
        timeSavedPerMonth: Math.min(timeSaved, 30), // Cap at 30 hours per month
        annualCostPerUser,
        monthlyPages,
    };
}

export function buildPromptSummary(responses: AdvisorResponses): string {
    const size = responses.company_size || 'unknown';
    const industry = responses.industry || 'unknown';
    const tier = responses.m365_tier || 'unknown';
    const storage = responses.file_storage || 'unknown';
    const accounting = responses.accounting || 'unknown';
    const crm = responses.crm || 'none';
    const aiUsage = responses.ai_usage || 'none';
    const budget = responses.monthly_budget || 'unknown';
    const painPoints = (responses.pain_points as string[]) || [];

    return `
Company Profile:
- Size: ${size} employees
- Industry: ${industry}
- Infrastructure: ${responses.infrastructure || 'unknown'}
- Microsoft 365 Tier: ${tier}
- File Storage: ${storage}
- Data Sensitivity: ${responses.data_sensitivity || 'medium'}

Business Tools:
- Accounting: ${accounting}
- CRM: ${crm}
- HR Platform: ${responses.hr_platform || 'none'}

AI Readiness:
- Current AI Usage: ${aiUsage}
- Key Pain Points: ${painPoints.join(', ') || 'not specified'}

Budget & Timeline:
- Monthly Budget: ${budget}
- Target Timeline: ${responses.timeline || 'flexible'}
`.trim();
}
