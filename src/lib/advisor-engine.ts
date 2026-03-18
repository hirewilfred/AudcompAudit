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
    const hr = responses.hr_platform as string;
    const infra = responses.infrastructure as string;
    const storage = responses.file_storage as string;
    const sensitivity = responses.data_sensitivity as string;
    const budget = responses.monthly_budget as string;
    const aiUsage = responses.ai_usage as string;
    const industry = responses.industry as string;

    const isM365User = tier && tier !== 'none' && tier !== 'unsure';
    const isGoogleUser = storage === 'google_drive' || tier === 'none';
    const isEnterprise = ['201-1000', '1000+'].includes(size);
    const isSmall = ['1-10', '11-50'].includes(size);
    const hasCopilotTier = ['premium', 'e3', 'e5'].includes(tier);
    const budgetConstrained = budget === '0-500';
    const budgetMid = ['500-2000', '2000-5000'].includes(budget);
    const budgetHigh = budget === '5000+';
    const isBeginnerAI = aiUsage === 'none' || aiUsage === 'personal';
    const isAdvancedAI = aiUsage === 'strategy' || aiUsage === 'advanced';

    // ──────────────────────────────────────────────
    // PRODUCTIVITY / COLLABORATION LAYER
    // ──────────────────────────────────────────────

    if (isM365User) {
        recs.push({
            tool: 'Microsoft 365 Copilot',
            category: 'Productivity',
            description: `Built directly into Word, Excel, Teams, Outlook, and PowerPoint — your team already knows these apps. Copilot summarizes meetings, drafts emails, generates reports from your data, and explains complex spreadsheets in seconds. Your existing M365 ${tier.toUpperCase()} plan is the perfect foundation to unlock it.`,
            monthlyEstimate: '$30/user/mo',
            annualEstimate: '~$360/user/yr',
            priority: 'high',
            icon: 'Sparkles',
            tags: ['Productivity', 'Microsoft 365', 'Email', 'Meetings'],
        });
    } else if (isGoogleUser) {
        recs.push({
            tool: 'Google Workspace + Gemini AI',
            category: 'Productivity',
            description: 'Gemini is Google\'s AI built directly into Gmail, Docs, Sheets, and Meet — everything your team already uses. It drafts emails, summarizes long threads, generates reports, and auto-transcribes meetings. No new tools to learn, no migration required.',
            monthlyEstimate: '$22–$30/user/mo (Gemini add-on)',
            annualEstimate: '~$264–$360/user/yr',
            priority: 'high',
            icon: 'Sparkles',
            tags: ['Productivity', 'Google Workspace', 'Gmail', 'Docs'],
        });
    } else {
        // On-prem / other infrastructure → recommend standalone AI productivity
        recs.push({
            tool: 'Claude for Work (Anthropic)',
            category: 'Productivity',
            description: 'A powerful, secure AI assistant your team can use for drafting, summarizing documents, analyzing data, writing reports, and answering internal questions — without being tied to any single platform. Works alongside your existing tools.',
            monthlyEstimate: '$25–$30/user/mo',
            annualEstimate: '~$300–$360/user/yr',
            priority: 'high',
            icon: 'BrainCircuit',
            tags: ['Productivity', 'AI Assistant', 'Documents', 'Analysis'],
        });
    }

    // ──────────────────────────────────────────────
    // CRM-SPECIFIC AI
    // ──────────────────────────────────────────────

    if (crm === 'salesforce') {
        recs.push({
            tool: 'Salesforce Einstein AI',
            category: 'Sales AI',
            description: 'Einstein is built directly into your Salesforce CRM and requires no migration. It automatically scores leads, forecasts pipeline with surprising accuracy, generates follow-up email drafts, and surfaces "next best action" recommendations based on deal history. You\'re already paying for Salesforce — activate Einstein now.',
            monthlyEstimate: 'Included in some plans / $25–$75/user add-on',
            annualEstimate: 'Scales with your Salesforce contract',
            priority: 'high',
            icon: 'TrendingUp',
            tags: ['Salesforce', 'Lead Scoring', 'Pipeline', 'CRM AI'],
        });
    } else if (crm === 'hubspot') {
        recs.push({
            tool: 'HubSpot Breeze AI',
            category: 'Sales AI',
            description: 'Breeze is HubSpot\'s native AI that enriches your contacts automatically, writes sales emails, summarizes deal timelines, and predicts which leads are ready to close. Since it\'s built into your existing HubSpot, turning it on takes hours — not weeks.',
            monthlyEstimate: 'Included in Professional+ / ~$50/mo add-on',
            annualEstimate: 'Tied to your existing HubSpot plan',
            priority: 'high',
            icon: 'TrendingUp',
            tags: ['HubSpot', 'Lead Scoring', 'Email AI', 'CRM AI'],
        });
    } else if (crm === 'dynamics_crm') {
        recs.push({
            tool: 'Microsoft Sales Copilot (Viva Sales)',
            category: 'Sales AI',
            description: 'AI-powered sales assistant built for Dynamics 365 — auto-generates CRM updates from emails, summarizes customer calls, surfaces next best actions, and scores leads inside Outlook and Teams without switching apps.',
            monthlyEstimate: '$50/user/mo',
            annualEstimate: '~$600/user/yr',
            priority: 'high',
            icon: 'TrendingUp',
            tags: ['Sales', 'CRM', 'Lead Scoring', 'Dynamics 365'],
        });
    } else if (crm === 'zoho') {
        recs.push({
            tool: 'Zoho Zia AI',
            category: 'Sales AI',
            description: 'Zia is Zoho\'s built-in AI assistant — it predicts deal outcomes, detects anomalies in your sales pipeline, auto-enriches lead records, and nudges your team on the best time to contact each prospect. It\'s already inside your Zoho account.',
            monthlyEstimate: 'Included in Zoho CRM Plus',
            annualEstimate: 'No additional cost at most tiers',
            priority: 'medium',
            icon: 'TrendingUp',
            tags: ['Zoho', 'Lead Scoring', 'Pipeline', 'CRM AI'],
        });
    } else if (painPoints.includes('sales_qualification') || crm === 'none' || crm === 'spreadsheets') {
        recs.push({
            tool: 'HubSpot CRM + AI (Free Tier Available)',
            category: 'Sales AI',
            description: 'If you\'re still managing sales in spreadsheets, HubSpot\'s free CRM with built-in Breeze AI is the fastest path to lead scoring, automated follow-ups, and pipeline visibility. Setup takes days, and the AI layer activates immediately.',
            monthlyEstimate: 'Free–$90/mo (Starter)',
            annualEstimate: 'Free tier available, scales up',
            priority: 'high',
            icon: 'TrendingUp',
            tags: ['CRM', 'Lead Scoring', 'HubSpot', 'Sales'],
        });
    }

    // ──────────────────────────────────────────────
    // ACCOUNTING / FINANCE AI
    // ──────────────────────────────────────────────

    if (accounting === 'quickbooks') {
        recs.push({
            tool: 'QuickBooks AI + Intuit Assist',
            category: 'Finance AI',
            description: 'Intuit\'s built-in AI for QuickBooks automatically categorizes transactions, flags anomalies, generates plain-English financial summaries, and forecasts cash flow — all inside the tool your bookkeeper already uses daily. No integration required.',
            monthlyEstimate: 'Included in QuickBooks subscription',
            annualEstimate: 'No added cost — activate in your existing plan',
            priority: 'high',
            icon: 'BarChart3',
            tags: ['QuickBooks', 'Finance', 'Cash Flow', 'AI Bookkeeping'],
        });
    } else if (accounting === 'xero') {
        recs.push({
            tool: 'Xero Analytics Plus',
            category: 'Finance AI',
            description: 'Xero\'s AI-powered analytics layer delivers real-time cash flow predictions, automated reporting, and short-term business forecasting directly inside your Xero dashboard. It learns your business patterns over time and gets smarter each month.',
            monthlyEstimate: '~$7/mo add-on to your Xero plan',
            annualEstimate: '~$84/yr — lowest-cost AI upgrade available',
            priority: 'high',
            icon: 'BarChart3',
            tags: ['Xero', 'Finance', 'Cash Flow', 'Forecasting'],
        });
    } else if (accounting === 'sage') {
        recs.push({
            tool: 'Sage Copilot',
            category: 'Finance AI',
            description: 'Sage\'s AI assistant is embedded directly in Sage 50, Sage Intacct, and Sage Business Cloud. It automates reconciliation suggestions, flags unusual transactions, generates month-end summaries, and can answer natural language questions about your financials.',
            monthlyEstimate: 'Included in Sage subscription (varies by tier)',
            annualEstimate: 'No additional cost — enable in your Sage account',
            priority: 'medium',
            icon: 'BarChart3',
            tags: ['Sage', 'Finance', 'Reconciliation', 'AI Bookkeeping'],
        });
    } else if (accounting === 'spreadsheets' && painPoints.includes('reporting')) {
        recs.push({
            tool: 'AI-Powered Reporting (Power BI or Looker Studio)',
            category: 'Finance AI',
            description: 'Moving off spreadsheets for reporting is the single highest-ROI AI move for your business. Power BI (if M365) or Looker Studio (if Google) connects to your data, generates visualizations automatically, and lets your team ask financial questions in plain English.',
            monthlyEstimate: '$0–$10/user/mo',
            annualEstimate: 'Free tier available; scales with usage',
            priority: 'high',
            icon: 'BarChart3',
            tags: ['Reporting', 'Finance', 'Dashboards', 'BI'],
        });
    }

    // ──────────────────────────────────────────────
    // DOCUMENT PROCESSING
    // ──────────────────────────────────────────────

    if (painPoints.includes('document_processing')) {
        if (isM365User) {
            recs.push({
                tool: 'Azure AI Document Intelligence',
                category: 'Document Automation',
                description: 'Automatically extracts data from invoices, contracts, forms, and receipts with 95%+ accuracy. Integrates directly with SharePoint and your accounting tools to eliminate manual re-keying. Built on Microsoft\'s cloud — ideal if you\'re already on Azure or M365.',
                monthlyEstimate: '$1–$10 per 1,000 pages',
                annualEstimate: 'Usage-based (~$50–$500/mo typical)',
                priority: 'high',
                icon: 'FileText',
                tags: ['Documents', 'Invoices', 'Automation', 'Azure'],
            });
        } else {
            recs.push({
                tool: 'Google Document AI',
                category: 'Document Automation',
                description: 'Google\'s document processing AI extracts structured data from invoices, contracts, tax forms, and medical records with high accuracy. It plugs directly into Google Drive or any cloud storage — no coding needed to get started.',
                monthlyEstimate: 'Pay-per-use (~$1.50 per 1,000 pages)',
                annualEstimate: 'Usage-based (~$50–$400/mo typical)',
                priority: 'high',
                icon: 'FileText',
                tags: ['Documents', 'Invoices', 'Automation', 'Google Cloud'],
            });
        }
    }

    // ──────────────────────────────────────────────
    // PROCESS AUTOMATION
    // ──────────────────────────────────────────────

    if (painPoints.includes('manual_data_entry') || painPoints.includes('reporting')) {
        if (isM365User) {
            recs.push({
                tool: 'Power Automate + AI Builder',
                category: 'Process Automation',
                description: 'Eliminate the copy-paste work killing your team\'s time. Power Automate connects your accounting, CRM, email, and SharePoint with intelligent triggers — no code needed. AI Builder adds document extraction, approval flows, and prediction models on top.',
                monthlyEstimate: '$15–$40/user/mo',
                annualEstimate: '~$180–$480/user/yr',
                priority: 'high',
                icon: 'Zap',
                tags: ['Automation', 'No-code', 'Workflows', 'Integration'],
            });
        } else {
            recs.push({
                tool: 'Make (formerly Integromat) + AI Modules',
                category: 'Process Automation',
                description: 'Connect your entire tool stack — CRM, accounting, email, storage, Slack — with visual automation workflows. Make\'s AI modules can classify documents, summarize content, and route approvals intelligently across 1,000+ app integrations.',
                monthlyEstimate: '$9–$29/mo (Starter–Pro)',
                annualEstimate: '~$108–$348/yr — extremely cost-effective',
                priority: 'high',
                icon: 'Zap',
                tags: ['Automation', 'No-code', 'Make', 'Integration'],
            });
        }
    }

    // ──────────────────────────────────────────────
    // REPORTING / ANALYTICS
    // ──────────────────────────────────────────────

    if (painPoints.includes('reporting') || painPoints.includes('forecasting')) {
        if (isM365User) {
            recs.push({
                tool: 'Power BI + Copilot',
                category: 'Business Intelligence',
                description: 'Ask your data questions in plain English — Power BI with Copilot generates charts, forecasts, and exec-ready dashboards on demand. Connects directly to your M365 data, QuickBooks, Dynamics, Excel, and 100+ other sources.',
                monthlyEstimate: '$10/user/mo (Pro) or $20 (Premium)',
                annualEstimate: '~$120–$240/user/yr',
                priority: 'medium',
                icon: 'BarChart3',
                tags: ['Analytics', 'Reporting', 'Dashboards', 'BI'],
            });
        } else if (isGoogleUser) {
            recs.push({
                tool: 'Looker Studio + Google Gemini',
                category: 'Business Intelligence',
                description: 'Google\'s free BI platform connects to Sheets, BigQuery, Google Ads, and hundreds of other sources. With Gemini integration, you can ask questions in natural language and get automated insight summaries — no data analyst required.',
                monthlyEstimate: 'Free (Looker Studio) / $12/mo (Gemini add-on)',
                annualEstimate: 'Free to very low cost',
                priority: 'medium',
                icon: 'BarChart3',
                tags: ['Analytics', 'Reporting', 'Google', 'Free'],
            });
        }
    }

    // ──────────────────────────────────────────────
    // CUSTOMER SERVICE AI
    // ──────────────────────────────────────────────

    if (painPoints.includes('customer_service')) {
        if (budgetConstrained) {
            recs.push({
                tool: 'Tidio AI Chatbot',
                category: 'Customer Service',
                description: 'Tidio\'s AI chatbot handles common customer questions 24/7, qualifies leads, and escalates to a human only when needed. Designed for SMBs — setup takes hours, no developer needed, and the free tier handles up to 50 conversations/month.',
                monthlyEstimate: 'Free–$29/mo',
                annualEstimate: 'Free tier available; $348/yr for Pro',
                priority: 'high',
                icon: 'Bot',
                tags: ['Customer Service', 'Chatbot', 'AI', 'Low-cost'],
            });
        } else if (isM365User) {
            recs.push({
                tool: 'Microsoft Copilot Studio',
                category: 'Customer Service',
                description: 'Build no-code AI agents for customer-facing chat, internal helpdesk, HR onboarding, and FAQ bots. Integrates directly with Teams, your website, and your business data in SharePoint — no developer required.',
                monthlyEstimate: '$200/mo flat + $0.01/message',
                annualEstimate: '~$2,400+/yr base',
                priority: isEnterprise ? 'high' : 'medium',
                icon: 'Bot',
                tags: ['Agents', 'Chatbots', 'No-code', 'Teams'],
            });
        } else {
            recs.push({
                tool: 'Intercom AI (Fin)',
                category: 'Customer Service',
                description: 'Intercom\'s Fin AI agent resolves the majority of customer inquiries instantly using your help documentation and product knowledge — without human intervention. Hands off complex cases seamlessly to your team with full conversation context.',
                monthlyEstimate: '$39/mo base + $0.99/resolved conversation',
                annualEstimate: 'Scales with volume — typically $500–$2,000/mo',
                priority: 'high',
                icon: 'Bot',
                tags: ['Customer Service', 'AI Agent', 'Intercom', 'Support'],
            });
        }
    }

    // ──────────────────────────────────────────────
    // DATA SECURITY & GOVERNANCE
    // ──────────────────────────────────────────────

    if (['high', 'critical'].includes(sensitivity)) {
        if (isM365User) {
            recs.push({
                tool: 'Microsoft Purview',
                category: 'Data Governance',
                description: 'With regulated or sensitive data, you can\'t deploy AI without first knowing where your data lives. Purview automatically scans, classifies, and applies protection policies across your M365 environment — essential before any AI rollout in healthcare, finance, or legal.',
                monthlyEstimate: tier === 'e5' ? 'Included in your E5 plan' : '~$7/user/mo (add-on)',
                annualEstimate: tier === 'e5' ? 'Included in your E5 plan' : '~$84/user/yr',
                priority: 'high',
                icon: 'Shield',
                tags: ['Compliance', 'Data Protection', 'PIPEDA', 'Governance'],
            });
        } else {
            recs.push({
                tool: 'Nightfall AI (Data Loss Prevention)',
                category: 'Data Governance',
                description: 'Nightfall scans your cloud storage, SaaS apps, and AI prompts in real-time to prevent sensitive data (PHI, PII, credentials) from leaking into AI tools. Critical for healthcare, finance, or legal firms using cloud-based AI.',
                monthlyEstimate: 'Custom pricing (typically $5–$15/user/mo)',
                annualEstimate: 'Scales with data volume and integrations',
                priority: 'high',
                icon: 'Shield',
                tags: ['Compliance', 'Data Protection', 'DLP', 'Security'],
            });
        }
    }

    // ──────────────────────────────────────────────
    // KNOWLEDGE MANAGEMENT
    // ──────────────────────────────────────────────

    if (painPoints.includes('knowledge_sharing')) {
        if (['sharepoint', 'mixed'].includes(storage)) {
            recs.push({
                tool: 'SharePoint + Microsoft Copilot',
                category: 'Knowledge Management',
                description: 'Instantly surface answers from your internal documents, wikis, and SharePoint libraries using natural language search. Reduces onboarding time by up to 50% — employees find what they need in seconds instead of digging through folders.',
                monthlyEstimate: 'Included with M365 + Copilot add-on',
                annualEstimate: 'Covered by existing SharePoint license',
                priority: 'medium',
                icon: 'BookOpen',
                tags: ['Knowledge Base', 'Search', 'SharePoint', 'Onboarding'],
            });
        } else if (isGoogleUser) {
            recs.push({
                tool: 'Notion AI + Google Drive Integration',
                category: 'Knowledge Management',
                description: 'Build a central AI-powered knowledge base in Notion that auto-summarizes documents, generates SOPs, and answers team questions from your existing Google Drive content. Notion AI generates wikis from raw notes in minutes.',
                monthlyEstimate: '$16/user/mo (Notion Team + AI)',
                annualEstimate: '~$192/user/yr',
                priority: 'medium',
                icon: 'BookOpen',
                tags: ['Knowledge Base', 'Notion', 'Google Drive', 'Onboarding'],
            });
        } else {
            recs.push({
                tool: 'Guru AI Knowledge Base',
                category: 'Knowledge Management',
                description: 'Guru builds a verified, AI-searchable knowledge base from your existing documents and processes. It surfaces the right answer inside Slack, email, or your browser — wherever your team is working — reducing repeated questions by up to 70%.',
                monthlyEstimate: '$10–$20/user/mo',
                annualEstimate: '~$120–$240/user/yr',
                priority: 'medium',
                icon: 'BookOpen',
                tags: ['Knowledge Base', 'Guru', 'Search', 'Onboarding'],
            });
        }
    }

    // ──────────────────────────────────────────────
    // INDUSTRY-SPECIFIC RECOMMENDATIONS
    // ──────────────────────────────────────────────

    if (industry === 'healthcare') {
        recs.push({
            tool: 'Nuance DAX Copilot (Healthcare AI)',
            category: 'Healthcare AI',
            description: 'Ambient AI for healthcare teams — automatically generates clinical notes, summarizes patient visits, and reduces documentation burden by up to 50%. Built specifically for Canadian healthcare compliance (PIPEDA, PHIPA) with full data residency controls.',
            monthlyEstimate: 'Custom enterprise pricing',
            annualEstimate: 'Typically $1,500–$3,000/clinician/yr',
            priority: 'high',
            icon: 'FileText',
            tags: ['Healthcare', 'Clinical Notes', 'Compliance', 'AI Documentation'],
        });
    } else if (industry === 'manufacturing') {
        recs.push({
            tool: 'Sight Machine (Manufacturing AI)',
            category: 'Operations AI',
            description: 'Connects to your production line data to predict equipment failures before they happen, optimize scheduling, and identify quality defects in real-time. Manufacturers using predictive maintenance typically cut unplanned downtime by 20–40%.',
            monthlyEstimate: 'Custom pricing based on assets monitored',
            annualEstimate: 'ROI typically 5–10x in year one',
            priority: 'medium',
            icon: 'Zap',
            tags: ['Manufacturing', 'Predictive Maintenance', 'Operations', 'IoT AI'],
        });
    } else if (industry === 'retail') {
        recs.push({
            tool: 'Shopify AI / Klaviyo AI (Retail)',
            category: 'Retail AI',
            description: 'Retail-specific AI that personalizes product recommendations for every shopper, predicts which customers are about to churn, and auto-generates targeted promotional emails with proven subject lines. Increases average order value and repeat purchase rates.',
            monthlyEstimate: '$20–$200/mo depending on store volume',
            annualEstimate: 'Highly variable — ROI often 10–20x',
            priority: 'high',
            icon: 'TrendingUp',
            tags: ['Retail', 'Personalization', 'Email AI', 'E-commerce'],
        });
    } else if (industry === 'real_estate') {
        recs.push({
            tool: 'Rechat AI (Real Estate CRM)',
            category: 'Real Estate AI',
            description: 'AI-native real estate platform that auto-generates property listings, designs marketing materials, scores buyer leads, and automates follow-up sequences — all from one dashboard. Reduces time-to-close and keeps more deals in the pipeline.',
            monthlyEstimate: '$199–$499/agent/mo',
            annualEstimate: 'Typically pays back in 1–2 closed deals',
            priority: 'medium',
            icon: 'TrendingUp',
            tags: ['Real Estate', 'Listings AI', 'Lead Scoring', 'Marketing'],
        });
    }

    // ──────────────────────────────────────────────
    // HR / ONBOARDING
    // ──────────────────────────────────────────────

    if (painPoints.includes('hr_onboarding')) {
        if (hr === 'bamboohr') {
            recs.push({
                tool: 'BambooHR AI + Onboarding Automation',
                category: 'HR AI',
                description: 'BambooHR\'s built-in AI streamlines onboarding with automated task assignments, e-signature workflows, and personalized onboarding checklists. New hire completion rates improve dramatically and HR overhead drops by 30–60%.',
                monthlyEstimate: 'Included in BambooHR Advantage tier',
                annualEstimate: 'Covered by your existing BambooHR plan',
                priority: 'medium',
                icon: 'Users',
                tags: ['HR', 'Onboarding', 'BambooHR', 'Automation'],
            });
        } else {
            recs.push({
                tool: 'Rippling + AI Onboarding',
                category: 'HR AI',
                description: 'Rippling unifies HR, payroll, IT provisioning, and onboarding in one platform with AI automation. New hires get accounts, apps, and hardware set up automatically on day one — saving HR 10+ hours per new employee.',
                monthlyEstimate: '$8/user/mo',
                annualEstimate: '~$96/user/yr',
                priority: 'medium',
                icon: 'Users',
                tags: ['HR', 'Onboarding', 'Rippling', 'IT Automation'],
            });
        }
    }

    // ──────────────────────────────────────────────
    // IT SUPPORT / HELPDESK
    // ──────────────────────────────────────────────

    if (painPoints.includes('it_support')) {
        recs.push({
            tool: 'Freshdesk AI (Freddy)',
            category: 'IT Support AI',
            description: 'Freddy AI resolves common IT tickets instantly — password resets, software access requests, and how-to questions — without human intervention. Routes complex issues intelligently and suggests solutions to your IT team based on historical ticket data.',
            monthlyEstimate: '$18–$85/agent/mo',
            annualEstimate: '~$216–$1,020/agent/yr',
            priority: 'medium',
            icon: 'Bot',
            tags: ['IT Support', 'Helpdesk', 'Freshdesk', 'Ticket Automation'],
        });
    }

    // ──────────────────────────────────────────────
    // EMAIL OVERLOAD
    // ──────────────────────────────────────────────

    if (painPoints.includes('email_overload')) {
        if (isM365User) {
            recs.push({
                tool: 'Microsoft 365 Copilot (Email & Meetings)',
                category: 'Communication AI',
                description: 'Copilot in Outlook drafts replies, summarizes long threads, and suggests meeting agendas automatically. In Teams, it transcribes meetings, generates action item lists, and answers "what did I miss?" in real time.',
                monthlyEstimate: '$30/user/mo',
                annualEstimate: '~$360/user/yr',
                priority: 'high',
                icon: 'Sparkles',
                tags: ['Email', 'Meetings', 'Outlook', 'Teams'],
            });
        } else if (isGoogleUser) {
            recs.push({
                tool: 'Google Workspace Gemini (Email & Meet)',
                category: 'Communication AI',
                description: 'Gemini in Gmail drafts full email replies with one click, summarizes long threads into key points, and takes notes in Google Meet automatically. Saves 1–2 hours per person per day on communication overhead.',
                monthlyEstimate: '$22–$30/user/mo',
                annualEstimate: '~$264–$360/user/yr',
                priority: 'high',
                icon: 'Sparkles',
                tags: ['Email', 'Meetings', 'Gmail', 'Google Meet'],
            });
        }
    }

    // ──────────────────────────────────────────────
    // ADVANCED / CUSTOM AI (for mature orgs)
    // ──────────────────────────────────────────────

    if (isAdvancedAI || (isEnterprise && !budgetConstrained)) {
        if (isM365User) {
            recs.push({
                tool: 'Azure OpenAI Service',
                category: 'Custom AI',
                description: 'Deploy GPT-4 and frontier AI models within your own Azure environment with full data privacy and sovereignty. Build custom assistants, document Q&A systems, and AI-powered workflows trained on your proprietary data — nothing leaves your tenant.',
                monthlyEstimate: 'Usage-based (~$100–$2,000/mo)',
                annualEstimate: 'Scales with usage',
                priority: isEnterprise ? 'high' : 'medium',
                icon: 'BrainCircuit',
                tags: ['Custom AI', 'GPT-4', 'Azure', 'Enterprise'],
            });
        } else {
            recs.push({
                tool: 'Anthropic Claude API (Custom Agents)',
                category: 'Custom AI',
                description: 'Build custom AI agents and workflows using Claude\'s API — search your documents, answer customer questions, automate complex multi-step processes, and integrate AI deeply into your product or operations. No vendor lock-in to Microsoft or Google.',
                monthlyEstimate: 'Usage-based (~$50–$1,000+/mo)',
                annualEstimate: 'Scales with usage',
                priority: isEnterprise ? 'high' : 'medium',
                icon: 'BrainCircuit',
                tags: ['Custom AI', 'Claude API', 'Agents', 'Flexible'],
            });
        }
    }

    // ──────────────────────────────────────────────
    // FALLBACK — ensure at least 3 recommendations
    // ──────────────────────────────────────────────

    if (recs.length < 3) {
        recs.push({
            tool: 'AI Readiness Assessment (Free)',
            category: 'Strategy',
            description: 'Before investing in tools, a structured AI readiness review ensures you\'re solving the right problems first. Our team maps your workflows, identifies the highest-ROI automation opportunities, and recommends a phased implementation plan.',
            monthlyEstimate: 'Free 30-minute discovery call',
            annualEstimate: 'No cost — book a strategy session',
            priority: 'high',
            icon: 'Target',
            tags: ['Strategy', 'Assessment', 'Free', 'Planning'],
        });
    }

    // Sort by priority and cap at 6
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 6);
}

export function generateRoadmap(responses: AdvisorResponses): RoadmapPhase[] {
    const timeline = responses.timeline as string;
    const aiUsage = responses.ai_usage as string;
    const painPoints = (responses.pain_points as string[]) || [];
    const tier = responses.m365_tier as string;
    const crm = responses.crm as string;
    const storage = responses.file_storage as string;
    const industry = responses.industry as string;

    const isBeginnerAI = aiUsage === 'none' || aiUsage === 'personal';
    const isAdvancedAI = aiUsage === 'strategy' || aiUsage === 'advanced';
    const wantsQuick = timeline === 'asap' || timeline === '1-3m';
    const isM365 = tier && tier !== 'none' && tier !== 'unsure';
    const isGoogleUser = storage === 'google_drive' || tier === 'none';

    // Pick stack-specific tool names for roadmap items
    const productivityTool = isM365 ? 'Microsoft 365 Copilot' : isGoogleUser ? 'Google Gemini Workspace' : 'Claude for Work';
    const automationTool = isM365 ? 'Power Automate' : 'Make (Integromat)';
    const biTool = isM365 ? 'Power BI' : 'Looker Studio';

    // CRM-specific phase 2 item
    const crmItem = crm === 'salesforce'
        ? 'Activate Salesforce Einstein AI for lead scoring and pipeline forecasting'
        : crm === 'hubspot'
        ? 'Enable HubSpot Breeze AI for contact enrichment and email drafting'
        : crm === 'dynamics_crm'
        ? 'Deploy Microsoft Sales Copilot inside Dynamics 365 and Outlook'
        : painPoints.includes('sales_qualification')
        ? 'Implement AI-powered lead scoring in your CRM of choice'
        : `Connect ${biTool} dashboards to live data sources`;

    // Pain-point driven phase 1 item
    const quickWinItem = painPoints.includes('document_processing')
        ? 'Deploy AI document extraction for invoices and contracts (eliminate manual re-keying)'
        : painPoints.includes('email_overload')
        ? `Pilot ${productivityTool} for email drafting and meeting summaries with 5–10 users`
        : painPoints.includes('manual_data_entry')
        ? `Map top 3 manual data entry workflows and build first ${automationTool} flow`
        : painPoints.includes('reporting')
        ? `Connect existing data to ${biTool} for your first automated executive dashboard`
        : `Launch ${productivityTool} pilot with 5–10 power users`;

    // Industry-specific phase 3 item
    const industryItem = industry === 'healthcare'
        ? 'Evaluate clinical documentation AI (Nuance DAX) for physician efficiency'
        : industry === 'manufacturing'
        ? 'Pilot predictive maintenance AI on highest-risk equipment'
        : industry === 'retail'
        ? 'Launch AI-personalized email campaigns and product recommendation engine'
        : painPoints.includes('customer_service')
        ? 'Deploy customer-facing AI chatbot to handle tier-1 inquiries 24/7'
        : isM365
        ? 'Build custom AI agent with Copilot Studio for your top internal use case'
        : 'Build a custom AI agent tailored to your highest-volume business process';

    return [
        {
            phase: 1,
            title: 'Quick Wins',
            timeline: wantsQuick ? 'Weeks 1–4' : 'Month 1–2',
            color: 'blue',
            items: [
                isBeginnerAI ? quickWinItem : 'Audit existing AI tool utilization and measure actual ROI',
                'Conduct data readiness review — map where your business data lives',
                painPoints.includes('reporting') ? `Set up ${biTool} connected to your live accounting data` : 'Identify and document your top 3 highest-value automation opportunities',
                'Establish AI acceptable use policy and data governance framework',
            ],
        },
        {
            phase: 2,
            title: 'Core Adoption',
            timeline: wantsQuick ? 'Month 2–3' : 'Month 3–5',
            color: 'indigo',
            items: [
                `Roll out ${productivityTool} company-wide with structured training program`,
                crmItem,
                painPoints.includes('manual_data_entry')
                    ? `Deploy ${automationTool} to eliminate your top manual data entry workflows`
                    : `Automate your top 3 repetitive workflows with ${automationTool}`,
                'Build internal AI champion network to sustain and accelerate adoption',
            ],
        },
        {
            phase: 3,
            title: 'Scale & Optimize',
            timeline: wantsQuick ? 'Month 4–6' : 'Month 6–12',
            color: 'emerald',
            items: [
                industryItem,
                'Measure and report full ROI vs. original projections — build business case for expansion',
                isAdvancedAI
                    ? 'Design and deploy proprietary AI model or agent on your internal knowledge base'
                    : painPoints.includes('knowledge_sharing')
                    ? 'Launch AI-powered internal knowledge base — make institutional knowledge searchable'
                    : `Expand ${automationTool} to cover finance, HR, and operations workflows`,
                'Establish quarterly AI review cadence: assess new tools, retire underperformers',
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
    let timeSaved = 4; // conservative base (emails, basic tasks)

    if (painPoints.includes('email_overload')) timeSaved += 4;
    if (painPoints.includes('document_processing')) timeSaved += 6;
    if (painPoints.includes('reporting')) timeSaved += 3;
    if (painPoints.includes('manual_data_entry')) timeSaved += 5;
    if (painPoints.includes('customer_service')) timeSaved += 4;
    if (painPoints.includes('knowledge_sharing')) timeSaved += 2;
    if (painPoints.includes('hr_onboarding')) timeSaved += 2;
    if (painPoints.includes('it_support')) timeSaved += 3;

    // Efficiency multiplier for deep M365 integration
    if (['premium', 'e3', 'e5'].includes(tier)) timeSaved += 2;

    const annualCostPerUser = tier === 'none' ? 120 : 360;
    const monthlyPages = painPoints.includes('document_processing') ? 5000 : 0;

    return {
        numUsers,
        hourlyRate,
        timeSavedPerMonth: Math.min(timeSaved, 30), // cap at 30 hrs/mo
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
    const hr = responses.hr_platform || 'none';
    const aiUsage = responses.ai_usage || 'none';
    const budget = responses.monthly_budget || 'unknown';
    const sensitivity = responses.data_sensitivity || 'medium';
    const painPoints = (responses.pain_points as string[]) || [];
    const infra = responses.infrastructure || 'unknown';

    const isM365 = tier !== 'none' && tier !== 'unsure' && tier !== 'unknown';
    const isGoogle = storage === 'google_drive' || tier === 'none';
    const platform = isM365 ? `Microsoft 365 (${(tier as string).toUpperCase()})` : isGoogle ? 'Google Workspace' : 'non-Microsoft / on-premises stack';

    const painPointLabels: Record<string, string> = {
        document_processing: 'manual document processing',
        manual_data_entry: 'manual data entry between systems',
        reporting: 'slow or manual reporting',
        customer_service: 'slow customer service response',
        sales_qualification: 'inefficient lead qualification',
        knowledge_sharing: 'poor internal knowledge sharing',
        it_support: 'repetitive IT support requests',
        hr_onboarding: 'slow HR onboarding',
        forecasting: 'unreliable financial forecasting',
        email_overload: 'email and meeting overload',
    };

    const namedPainPoints = painPoints.map(p => painPointLabels[p] || p).join(', ');

    return `
Company Profile:
- Size: ${size} employees
- Industry: ${industry}
- Infrastructure: ${infra}
- Primary platform: ${platform}
- File Storage: ${storage}
- Data Sensitivity: ${sensitivity}

Business Tools in Use:
- Accounting: ${accounting}
- CRM: ${crm}
- HR Platform: ${hr}

AI Readiness:
- Current AI Usage: ${aiUsage}
- Key Pain Points: ${namedPainPoints || 'not specified'}

Budget & Timeline:
- Monthly Budget: ${budget}
- Target Timeline: ${responses.timeline || 'flexible'}
`.trim();
}
