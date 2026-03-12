export interface AdvisorField {
    id: string;
    label: string;
    type: 'radio' | 'select' | 'multiselect';
    options: { value: string; label: string; description?: string }[];
}

export interface AdvisorStep {
    id: string;
    title: string;
    subtitle: string;
    fields: AdvisorField[];
}

export const ADVISOR_STEPS: AdvisorStep[] = [
    {
        id: 'company_profile',
        title: 'Tell us about your company',
        subtitle: 'This helps us tailor recommendations to your scale and industry.',
        fields: [
            {
                id: 'company_size',
                label: 'How many employees do you have?',
                type: 'radio',
                options: [
                    { value: '1-10', label: '1–10 employees', description: 'Micro business or startup' },
                    { value: '11-50', label: '11–50 employees', description: 'Small business' },
                    { value: '51-200', label: '51–200 employees', description: 'Mid-size business' },
                    { value: '201-1000', label: '201–1,000 employees', description: 'Larger organization' },
                    { value: '1000+', label: '1,000+ employees', description: 'Enterprise' },
                ],
            },
            {
                id: 'industry',
                label: 'What industry are you in?',
                type: 'select',
                options: [
                    { value: 'professional_services', label: 'Professional Services (Consulting, Legal, Accounting)' },
                    { value: 'manufacturing', label: 'Manufacturing & Industrial' },
                    { value: 'retail', label: 'Retail & E-Commerce' },
                    { value: 'healthcare', label: 'Healthcare & Life Sciences' },
                    { value: 'finance', label: 'Finance & Insurance' },
                    { value: 'logistics', label: 'Logistics & Supply Chain' },
                    { value: 'real_estate', label: 'Real Estate & Construction' },
                    { value: 'technology', label: 'Technology & Software' },
                    { value: 'education', label: 'Education' },
                    { value: 'nonprofit', label: 'Non-Profit / Government' },
                    { value: 'other', label: 'Other' },
                ],
            },
        ],
    },
    {
        id: 'tech_stack',
        title: 'Your current technology setup',
        subtitle: 'Understanding your infrastructure helps us recommend compatible AI solutions.',
        fields: [
            {
                id: 'infrastructure',
                label: 'How would you describe your IT infrastructure?',
                type: 'radio',
                options: [
                    { value: 'on_prem', label: 'Mostly on-premises', description: 'Local servers, physical hardware' },
                    { value: 'hybrid', label: 'Hybrid cloud', description: 'Mix of on-prem and cloud' },
                    { value: 'cloud', label: 'Fully cloud-based', description: 'SaaS apps, no on-prem servers' },
                    { value: 'unsure', label: 'Not sure', description: 'We use what works' },
                ],
            },
            {
                id: 'm365_tier',
                label: 'Which Microsoft 365 plan are you on?',
                type: 'radio',
                options: [
                    { value: 'none', label: 'We don\'t use Microsoft 365', description: 'Google Workspace or other' },
                    { value: 'basic', label: 'Microsoft 365 Business Basic', description: 'Email, Teams, web apps only' },
                    { value: 'standard', label: 'Microsoft 365 Business Standard', description: 'Desktop Office apps included' },
                    { value: 'premium', label: 'Microsoft 365 Business Premium', description: 'Includes Defender & Intune' },
                    { value: 'e3', label: 'Microsoft 365 E3', description: 'Enterprise compliance & security' },
                    { value: 'e5', label: 'Microsoft 365 E5', description: 'Full suite with advanced analytics' },
                    { value: 'unsure', label: 'Not sure / Mixed', description: 'Different plans across users' },
                ],
            },
        ],
    },
    {
        id: 'file_structure',
        title: 'Files, data & storage',
        subtitle: 'Where your data lives determines which AI tools can access and improve it.',
        fields: [
            {
                id: 'file_storage',
                label: 'Where are your business files primarily stored?',
                type: 'radio',
                options: [
                    { value: 'local', label: 'Local PCs or on-prem servers', description: 'Files live on physical machines' },
                    { value: 'sharepoint', label: 'SharePoint / OneDrive', description: 'Microsoft cloud storage' },
                    { value: 'google_drive', label: 'Google Drive / Workspace', description: 'Google cloud storage' },
                    { value: 'mixed', label: 'Mix of local and cloud', description: 'Both locations used' },
                    { value: 'other_cloud', label: 'Other cloud (Dropbox, Box, etc.)', description: 'Third-party cloud storage' },
                ],
            },
            {
                id: 'data_sensitivity',
                label: 'How sensitive is your business data?',
                type: 'radio',
                options: [
                    { value: 'low', label: 'General / public information', description: 'No confidential data' },
                    { value: 'medium', label: 'Confidential client or employee data', description: 'NDAs, PII, contracts' },
                    { value: 'high', label: 'Regulated data (HIPAA, PIPEDA, GDPR)', description: 'Compliance requirements' },
                    { value: 'critical', label: 'Highly sensitive IP or financial data', description: 'Trade secrets, financial records' },
                ],
            },
        ],
    },
    {
        id: 'business_processes',
        title: 'Your key business tools',
        subtitle: 'Tell us what software runs your business so we can recommend AI that integrates directly.',
        fields: [
            {
                id: 'accounting',
                label: 'What accounting / finance software do you use?',
                type: 'select',
                options: [
                    { value: 'quickbooks', label: 'QuickBooks' },
                    { value: 'xero', label: 'Xero' },
                    { value: 'sage', label: 'Sage' },
                    { value: 'sap', label: 'SAP' },
                    { value: 'netsuite', label: 'NetSuite / Oracle' },
                    { value: 'dynamics', label: 'Microsoft Dynamics 365 Finance' },
                    { value: 'wave', label: 'Wave (free accounting)' },
                    { value: 'spreadsheets', label: 'Spreadsheets / Manual' },
                    { value: 'other', label: 'Other' },
                ],
            },
            {
                id: 'crm',
                label: 'What CRM or sales tool do you use?',
                type: 'select',
                options: [
                    { value: 'salesforce', label: 'Salesforce' },
                    { value: 'hubspot', label: 'HubSpot' },
                    { value: 'dynamics_crm', label: 'Microsoft Dynamics 365 CRM' },
                    { value: 'zoho', label: 'Zoho CRM' },
                    { value: 'pipedrive', label: 'Pipedrive' },
                    { value: 'spreadsheets', label: 'Spreadsheets / Manual' },
                    { value: 'none', label: 'No CRM yet' },
                    { value: 'other', label: 'Other' },
                ],
            },
            {
                id: 'hr_platform',
                label: 'What HR or people management tool do you use?',
                type: 'select',
                options: [
                    { value: 'bamboohr', label: 'BambooHR' },
                    { value: 'workday', label: 'Workday' },
                    { value: 'adp', label: 'ADP' },
                    { value: 'rippling', label: 'Rippling' },
                    { value: 'gusto', label: 'Gusto' },
                    { value: 'dynamics_hr', label: 'Microsoft Dynamics 365 HR' },
                    { value: 'spreadsheets', label: 'Spreadsheets / Manual' },
                    { value: 'none', label: 'No HR system yet' },
                    { value: 'other', label: 'Other' },
                ],
            },
        ],
    },
    {
        id: 'pain_points',
        title: 'Where do you lose the most time?',
        subtitle: 'Select all that apply — these are the biggest opportunities for AI to create value.',
        fields: [
            {
                id: 'pain_points',
                label: 'Select your biggest operational pain points',
                type: 'multiselect',
                options: [
                    { value: 'document_processing', label: 'Document-heavy work', description: 'Contracts, invoices, reports, forms' },
                    { value: 'manual_data_entry', label: 'Manual data entry', description: 'Copy-paste between systems' },
                    { value: 'reporting', label: 'Reporting & analytics', description: 'Building dashboards and reports' },
                    { value: 'customer_service', label: 'Customer service response time', description: 'Responding to inquiries and tickets' },
                    { value: 'sales_qualification', label: 'Sales & lead qualification', description: 'Scoring and prioritizing leads' },
                    { value: 'knowledge_sharing', label: 'Internal knowledge sharing', description: 'Finding info, onboarding, wikis' },
                    { value: 'it_support', label: 'IT support & helpdesk', description: 'Repetitive support requests' },
                    { value: 'hr_onboarding', label: 'HR onboarding & compliance', description: 'New hire paperwork and processes' },
                    { value: 'forecasting', label: 'Financial forecasting', description: 'Cash flow, budgeting, projections' },
                    { value: 'email_overload', label: 'Email and meeting overload', description: 'Summarizing, scheduling, follow-ups' },
                ],
            },
        ],
    },
    {
        id: 'ai_maturity',
        title: 'How far along is your AI journey?',
        subtitle: 'Be honest — this helps us recommend the right entry point.',
        fields: [
            {
                id: 'ai_usage',
                label: 'How is AI currently used in your business?',
                type: 'radio',
                options: [
                    { value: 'none', label: 'Not using AI at all', description: 'Starting from scratch' },
                    { value: 'personal', label: 'Some staff use ChatGPT personally', description: 'Informal, no company policy' },
                    { value: 'basic_tools', label: 'We use one or two AI tools', description: 'Like Grammarly or Copilot autocomplete' },
                    { value: 'strategy', label: 'We have a formal AI strategy', description: 'Active rollout in progress' },
                    { value: 'advanced', label: 'We\'re already advanced', description: 'Custom agents or models in production' },
                ],
            },
        ],
    },
    {
        id: 'budget_timeline',
        title: 'Budget & timeline',
        subtitle: 'Help us recommend solutions that fit your reality today.',
        fields: [
            {
                id: 'monthly_budget',
                label: 'What\'s your approximate monthly budget for AI tools?',
                type: 'radio',
                options: [
                    { value: '0-500', label: '$0–$500 / month', description: 'Pilot phase, low commitment' },
                    { value: '500-2000', label: '$500–$2,000 / month', description: 'Committed but cautious' },
                    { value: '2000-5000', label: '$2,000–$5,000 / month', description: 'Serious investment' },
                    { value: '5000+', label: '$5,000+ / month', description: 'Full-scale deployment' },
                    { value: 'unsure', label: 'Not sure yet', description: 'Show me options first' },
                ],
            },
            {
                id: 'timeline',
                label: 'When do you want to see results?',
                type: 'radio',
                options: [
                    { value: 'asap', label: 'ASAP — within 30 days', description: 'Quick wins, fast deployment' },
                    { value: '1-3m', label: '1–3 months', description: 'Structured rollout' },
                    { value: '3-6m', label: '3–6 months', description: 'Careful adoption' },
                    { value: '6m+', label: '6+ months', description: 'Long-term transformation' },
                ],
            },
        ],
    },
];

export type AdvisorResponses = Record<string, string | string[]>;
