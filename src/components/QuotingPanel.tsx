import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Search, X, Check, Briefcase, Mail, UserCheck, Download,
    FileText, Plus, Minus, ChevronDown, ChevronUp, Loader2, Copy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ─── Package data ───────────────────────────────────────────────────────── */

interface QuotePackage {
    id: string;
    category: 'ai' | 'web' | 'managed' | 'addon';
    name: string;
    price: string;
    priceNum: number;
    timeline: string;
    billing: 'one-time' | 'monthly';
    bestFor: string;
    deliverables: string[];
    outcomes: string[];
}

const ALL_PACKAGES: QuotePackage[] = [
    // AI Consulting
    {
        id: 'ai-foundation', category: 'ai', name: 'Foundation Essentials', price: '$2,500', priceNum: 2500,
        timeline: '2 Weeks', billing: 'one-time',
        bestFor: 'Businesses wanting quick wins and light automation without system overhauls.',
        deliverables: ['AI Readiness Assessment', 'Redesign of 2 priority workflows', '1 Custom AI Agent (Single Tool)', 'Light knowledge base (20 docs)', 'Basic governance template', 'Training for up to 10 staff'],
        outcomes: ['5-10 hours/week saved instantly', 'Better client engagement', 'Faster task turnaround'],
    },
    {
        id: 'ai-catalyst', category: 'ai', name: 'Operational Catalyst', price: '$6,500', priceNum: 6500,
        timeline: '4-6 Weeks', billing: 'one-time',
        bestFor: 'Organizations ready to automate multiple repetitive processes across a department.',
        deliverables: ['Deep workflow discovery (4-6 workflows)', '2-3 Custom AI Agents', 'Integrations with core tools (CRM/Ticketing)', 'Expanded knowledge base (100 docs)', 'Multi-Agent Collaboration', 'Analytics dashboard', 'Governance + AI usage policies'],
        outcomes: ['20-40% reduction in admin workload', 'More sales activity without hiring', 'Improved service response times', 'Consistency and fewer errors'],
    },
    {
        id: 'ai-workforce', category: 'ai', name: 'Digital Workforce', price: '$12,500+', priceNum: 12500,
        timeline: '8-12 Weeks', billing: 'one-time',
        bestFor: 'Businesses looking to deploy AI as a true digital workforce across multiple functions.',
        deliverables: ['Redesign of 8-12 business processes', '4-7 Custom AI Agents', 'Full multi-agent system (Coordinator + Specialists)', 'Full CRM + ERP + HR integrations', 'Vector knowledge base (Unlimited)', 'AgentOps monitoring dashboard', 'Monthly optimization for 3 months'],
        outcomes: ['40-60% reduction in low-impact tasks', 'Scale without adding headcount', 'Faster back-office operations', 'Reduced cost to serve clients'],
    },
    // Web Dev
    {
        id: 'web-starter', category: 'web', name: 'Starter: Web & MVP App', price: '$2,500', priceNum: 2500,
        timeline: '2-4 Weeks', billing: 'one-time',
        bestFor: 'Businesses needing a professional web presence or a simple MVP application.',
        deliverables: ['Responsive Website Design (up to 5 pages)', 'Basic CMS Setup', 'Contact Forms & Lead Capture', 'Mobile-Optimized Layout'],
        outcomes: ['Strong Digital Presence', 'Increased Lead Generation'],
    },
    {
        id: 'web-growth', category: 'web', name: 'Growth: Custom Platform', price: '$6,500', priceNum: 6500,
        timeline: '6-8 Weeks', billing: 'one-time',
        bestFor: 'Growing businesses that need web applications with dynamic content and database integrations.',
        deliverables: ['Custom Web Application', 'Database Architecture & Setup', 'User Authentication', 'API Integrations (e.g., Stripe, CRM)'],
        outcomes: ['Streamlined Operations', 'Scalable Growth Platform'],
    },
    {
        id: 'web-pro', category: 'web', name: 'Pro: Enterprise Apps', price: '$12,500+', priceNum: 12500,
        timeline: '10-14 Weeks', billing: 'one-time',
        bestFor: 'Businesses needing comprehensive, cross-platform apps (Web, iOS, Android) with complex workflows.',
        deliverables: ['Cross-Platform Mobile App (iOS & Android)', 'Advanced Web Application Dashboard', 'Complex Database Architecture', 'Custom Admin Panel'],
        outcomes: ['Complete Digital Ecosystem', 'Enhanced Customer Engagement & Retention'],
    },
    // Managed Service
    {
        id: 'ops-essentials', category: 'managed', name: 'AgentOps Essentials', price: '$750/mo', priceNum: 750,
        timeline: 'Ongoing', billing: 'monthly',
        bestFor: 'Post-deployment monitoring and light optimization.',
        deliverables: ['Monitoring for up to 2 agents', 'Monthly tuning + improvements', 'Error handling review', 'AI training refresh', 'Efficiency reports'],
        outcomes: ['Continuous improvement', 'Reduced downtime'],
    },
    {
        id: 'ops-professional', category: 'managed', name: 'AgentOps Professional', price: '$1,500/mo', priceNum: 1500,
        timeline: 'Ongoing', billing: 'monthly',
        bestFor: 'Active optimization across multiple agents and integrations.',
        deliverables: ['Up to 5 agents', 'Weekly optimization cycles', 'Full CRM/ERP support', 'Advanced analytics dashboard', 'SLA: 24-48h turnaround', 'Quarterly workflow redesign'],
        outcomes: ['Faster iteration', 'Proactive issue resolution'],
    },
    {
        id: 'ops-premium', category: 'managed', name: 'AgentOps Premium', price: '$2,500/mo', priceNum: 2500,
        timeline: 'Ongoing', billing: 'monthly',
        bestFor: 'Mission-critical deployments requiring dedicated support.',
        deliverables: ['Up to 10 agents', 'Real-time monitoring', 'Dedicated AI specialist', 'Custom workflows + retraining', '4-hour SLA', 'Full quarterly impact assessment'],
        outcomes: ['Enterprise-grade uptime', 'Strategic partnership'],
    },
    // Add-ons
    { id: 'addon-agents', category: 'addon', name: 'Extra AI Agents', price: '$1k-$3.5k', priceNum: 2000, timeline: 'Varies', billing: 'one-time', bestFor: 'Complex integration focus', deliverables: ['Additional custom AI agents'], outcomes: [] },
    { id: 'addon-integrations', category: 'addon', name: 'System Integrations', price: '$500-$2k', priceNum: 1000, timeline: 'Varies', billing: 'one-time', bestFor: 'New platform hooks', deliverables: ['New system integrations'], outcomes: [] },
    { id: 'addon-knowledge', category: 'addon', name: 'Knowledge Build-Out', price: '$1k-$3k', priceNum: 1500, timeline: 'Varies', billing: 'one-time', bestFor: 'Deep document ingestion', deliverables: ['Extended knowledge base'], outcomes: [] },
    { id: 'addon-compliance', category: 'addon', name: 'Compliance Package', price: '$1.5k-$4k', priceNum: 2500, timeline: 'Varies', billing: 'one-time', bestFor: 'Security & Governance', deliverables: ['Full compliance audit + policy docs'], outcomes: [] },
];

const CATEGORY_LABELS: Record<string, string> = { ai: 'AI Consulting', web: 'Web & App Development', managed: 'AgentOps Managed Service', addon: 'Add-Ons' };

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface CRMCompanyOption {
    id: string;
    name: string;
    industry: string;
    location: string;
    domain: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactTitle?: string;
    contactId?: string;
}

interface LineItem {
    packageId: string;
    quantity: number;
    customPrice?: number;
    notes?: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const fmt = (n: number) => '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const quoteNumber = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `CW-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
};

/* ─── Logo as base64 (loaded at runtime) ─────────────────────────────────── */

let cachedLogo: string | null = null;
const loadLogo = (): Promise<string> => {
    if (cachedLogo) return Promise.resolve(cachedLogo);
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            cachedLogo = canvas.toDataURL('image/png');
            resolve(cachedLogo);
        };
        img.onerror = () => resolve('');
        img.src = '/logos/ClarityWorks_logo.png';
    });
};

/* ─── PDF Generator ──────────────────────────────────────────────────────── */

interface QuoteData {
    quoteNum: string;
    date: string;
    validUntil: string;
    company: CRMCompanyOption | null;
    clientName: string;
    items: { pkg: QuotePackage; qty: number; customPrice?: number; notes?: string }[];
    oneTimeTotal: number;
    monthlyTotal: number;
    notes: string;
}

const generatePDF = async (data: QuoteData): Promise<jsPDF> => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = 18;

    // Colors
    const brandBlue = [23, 92, 211] as [number, number, number];
    const darkGray = [30, 41, 59] as [number, number, number];
    const medGray = [100, 116, 139] as [number, number, number];
    const lightBg = [248, 250, 252] as [number, number, number];

    // ── Header bar ──
    doc.setFillColor(...brandBlue);
    doc.rect(0, 0, pageWidth, 4, 'F');

    // Logo
    const logo = await loadLogo();
    if (logo) {
        doc.addImage(logo, 'PNG', margin, y, 45, 18);
    } else {
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...brandBlue);
        doc.text('Audcomp', margin, y + 12);
    }

    // Quote title block (right side)
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text('QUOTE', pageWidth - margin, y + 6, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...medGray);
    doc.text(`#${data.quoteNum}`, pageWidth - margin, y + 13, { align: 'right' });
    doc.text(`Date: ${data.date}`, pageWidth - margin, y + 18, { align: 'right' });
    doc.text(`Valid until: ${data.validUntil}`, pageWidth - margin, y + 23, { align: 'right' });

    y += 34;

    // ── Divider ──
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // ── From / To columns ──
    const colW = contentWidth / 2;

    // FROM
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...brandBlue);
    doc.text('FROM', margin, y);
    y += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text('Audcomp', margin, y);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...medGray);
    doc.text('Toronto, ON, Canada', margin, y + 5);
    doc.text('hello@audcomp.com', margin, y + 10);
    doc.text('audcomp.com', margin, y + 15);

    // TO
    const toX = margin + colW + 8;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...brandBlue);
    doc.text('PREPARED FOR', toX, y - 5);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text(data.clientName || 'Client', toX, y);

    let toY = y + 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...medGray);
    if (data.company) {
        if (data.company.contactName) { doc.text(`Attn: ${data.company.contactName}`, toX, toY); toY += 5; }
        if (data.company.contactTitle) { doc.text(data.company.contactTitle, toX, toY); toY += 5; }
        if (data.company.contactEmail) { doc.text(data.company.contactEmail, toX, toY); toY += 5; }
        if (data.company.contactPhone) { doc.text(data.company.contactPhone, toX, toY); toY += 5; }
        if (data.company.industry) { doc.text(`Industry: ${data.company.industry}`, toX, toY); toY += 5; }
        if (data.company.location) { doc.text(data.company.location, toX, toY); toY += 5; }
    }

    y += 26;

    // ── Line items table ──
    const tableBody = data.items.map(item => [
        item.pkg.name,
        item.pkg.timeline,
        item.pkg.billing === 'monthly' ? 'Monthly' : 'One-time',
        String(item.qty),
        fmt(item.customPrice ?? item.pkg.priceNum),
        fmt((item.customPrice ?? item.pkg.priceNum) * item.qty),
    ]);

    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Service', 'Timeline', 'Billing', 'Qty', 'Unit Price', 'Amount']],
        body: tableBody,
        headStyles: {
            fillColor: brandBlue,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8.5,
            cellPadding: 4,
        },
        bodyStyles: {
            textColor: darkGray,
            fontSize: 8.5,
            cellPadding: 3.5,
        },
        alternateRowStyles: {
            fillColor: lightBg,
        },
        columnStyles: {
            0: { cellWidth: 55 },
            3: { halign: 'center', cellWidth: 15 },
            4: { halign: 'right', cellWidth: 28 },
            5: { halign: 'right', cellWidth: 28 },
        },
        theme: 'grid',
        styles: {
            lineColor: [226, 232, 240],
            lineWidth: 0.2,
        },
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // ── Totals box ──
    const totalsX = pageWidth - margin - 70;
    const totalsW = 70;

    doc.setFillColor(...lightBg);
    doc.roundedRect(totalsX, y, totalsW, data.monthlyTotal > 0 && data.oneTimeTotal > 0 ? 34 : 22, 2, 2, 'F');

    let tY = y + 7;
    if (data.oneTimeTotal > 0) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...medGray);
        doc.text('One-time Total:', totalsX + 4, tY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkGray);
        doc.text(fmt(data.oneTimeTotal) + ' CAD', totalsX + totalsW - 4, tY, { align: 'right' });
        tY += 7;
    }
    if (data.monthlyTotal > 0) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...medGray);
        doc.text('Monthly Total:', totalsX + 4, tY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkGray);
        doc.text(fmt(data.monthlyTotal) + '/mo CAD', totalsX + totalsW - 4, tY, { align: 'right' });
        tY += 7;
    }

    // Grand total line
    const grandTotal = data.oneTimeTotal + data.monthlyTotal;
    doc.setDrawColor(...brandBlue);
    doc.setLineWidth(0.4);
    doc.line(totalsX + 4, tY - 2, totalsX + totalsW - 4, tY - 2);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...brandBlue);
    doc.text('Total:', totalsX + 4, tY + 4);
    doc.text(fmt(grandTotal) + ' CAD', totalsX + totalsW - 4, tY + 4, { align: 'right' });

    y = tY + 14;

    // ── Deliverables detail ──
    for (const item of data.items) {
        if (y > 250) { doc.addPage(); y = 20; }

        doc.setFillColor(23, 92, 211);
        doc.roundedRect(margin, y, 3, 3, 0.5, 0.5, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkGray);
        doc.text(item.pkg.name, margin + 6, y + 3);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...medGray);
        doc.text(item.pkg.bestFor, margin + 6, y + 8);
        y += 13;

        // Deliverables
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...brandBlue);
        doc.text('DELIVERABLES', margin + 6, y);
        y += 4;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkGray);
        for (const d of item.pkg.deliverables) {
            if (y > 275) { doc.addPage(); y = 20; }
            doc.setFontSize(8);
            doc.text('\u2022  ' + d, margin + 8, y);
            y += 4.5;
        }

        // Outcomes
        if (item.pkg.outcomes.length > 0) {
            y += 2;
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...brandBlue);
            doc.text('EXPECTED OUTCOMES', margin + 6, y);
            y += 4;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(16, 185, 129);
            for (const o of item.pkg.outcomes) {
                if (y > 275) { doc.addPage(); y = 20; }
                doc.setFontSize(8);
                doc.text('\u2192  ' + o, margin + 8, y);
                y += 4.5;
            }
        }

        if (item.notes) {
            y += 2;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(...medGray);
            const lines = doc.splitTextToSize('Note: ' + item.notes, contentWidth - 14);
            doc.text(lines, margin + 6, y);
            y += lines.length * 4.5;
        }

        y += 6;
    }

    // ── Notes section ──
    if (data.notes) {
        if (y > 245) { doc.addPage(); y = 20; }
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...brandBlue);
        doc.text('ADDITIONAL NOTES', margin, y);
        y += 5;
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkGray);
        const noteLines = doc.splitTextToSize(data.notes, contentWidth);
        doc.text(noteLines, margin, y);
        y += noteLines.length * 4.5 + 6;
    }

    // ── Terms ──
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...brandBlue);
    doc.text('TERMS & CONDITIONS', margin, y);
    y += 5;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...medGray);
    const terms = [
        'This quote is valid for 30 days from the date of issue.',
        'All prices are in Canadian Dollars (CAD) and exclude applicable taxes.',
        'Payment terms: 50% upon project commencement, 50% upon completion.',
        'Monthly services are billed at the start of each billing period.',
        'Project timelines begin after signed agreement and initial payment.',
    ];
    for (const t of terms) {
        doc.text('\u2022  ' + t, margin, y);
        y += 4;
    }

    // ── Footer ──
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFillColor(...brandBlue);
        doc.rect(0, pageH - 4, pageWidth, 4, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...medGray);
        doc.text('Audcomp  |  audcomp.com  |  hello@audcomp.com', pageWidth / 2, pageH - 8, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageH - 8, { align: 'right' });
    }

    return doc;
};

/* ─── Component ──────────────────────────────────────────────────────────── */

const QuotingPanel: React.FC = () => {
    const { user } = useAuth();

    // Company selector
    const [companies, setCompanies] = useState<CRMCompanyOption[]>([]);
    const [companiesLoading, setCompaniesLoading] = useState(true);
    const [companySearch, setCompanySearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<CRMCompanyOption | null>(null);
    const [clientName, setClientName] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Line items
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [notes, setNotes] = useState('');
    const [quoteNum] = useState(quoteNumber);

    // Actions
    const [generating, setGenerating] = useState(false);
    const [creatingDeal, setCreatingDeal] = useState(false);
    const [dealCreated, setDealCreated] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Load CRM companies
    useEffect(() => {
        const load = async () => {
            if (!supabase) return;
            setCompaniesLoading(true);
            const { data: companyRows } = await supabase.from('crm_companies').select('id, name, industry, location, domain').order('name');
            const { data: contactRows } = await supabase.from('crm_contacts').select('id, company_id, first_name, last_name, email, phone, title').order('created_at', { ascending: true });
            const contactMap = new Map<string, { id: string; name: string; email: string; phone: string; title: string }>();
            (contactRows || []).forEach((c: any) => {
                if (c.company_id && !contactMap.has(c.company_id)) {
                    contactMap.set(c.company_id, {
                        id: c.id,
                        name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
                        email: c.email || '',
                        phone: c.phone || '',
                        title: c.title || '',
                    });
                }
            });
            setCompanies((companyRows || []).map((co: any) => {
                const contact = contactMap.get(co.id);
                return {
                    id: co.id, name: co.name, industry: co.industry || '', location: co.location || '', domain: co.domain || '',
                    contactId: contact?.id, contactName: contact?.name, contactEmail: contact?.email, contactPhone: contact?.phone, contactTitle: contact?.title,
                };
            }));
            setCompaniesLoading(false);
        };
        load();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
        c.industry.toLowerCase().includes(companySearch.toLowerCase()) ||
        (c.contactName || '').toLowerCase().includes(companySearch.toLowerCase())
    );

    const selectCompany = (co: CRMCompanyOption) => {
        setSelectedCompany(co);
        setClientName(co.name);
        setCompanySearch('');
        setShowDropdown(false);
    };

    const clearCompany = () => {
        setSelectedCompany(null);
        setClientName('');
    };

    // Line item management
    const togglePackage = (pkgId: string) => {
        setLineItems(prev => {
            const exists = prev.find(li => li.packageId === pkgId);
            if (exists) return prev.filter(li => li.packageId !== pkgId);
            return [...prev, { packageId: pkgId, quantity: 1 }];
        });
        setDealCreated(false);
    };

    const updateLineItem = (pkgId: string, updates: Partial<LineItem>) => {
        setLineItems(prev => prev.map(li => li.packageId === pkgId ? { ...li, ...updates } : li));
    };

    // Computed
    const selectedItems = lineItems.map(li => {
        const pkg = ALL_PACKAGES.find(p => p.id === li.packageId)!;
        return { ...li, pkg };
    }).filter(li => li.pkg);

    const oneTimeTotal = selectedItems.filter(i => i.pkg.billing === 'one-time').reduce((s, i) => s + (i.customPrice ?? i.pkg.priceNum) * i.quantity, 0);
    const monthlyTotal = selectedItems.filter(i => i.pkg.billing === 'monthly').reduce((s, i) => s + (i.customPrice ?? i.pkg.priceNum) * i.quantity, 0);

    const today = new Date();
    const validDate = new Date(today);
    validDate.setDate(validDate.getDate() + 30);
    const dateStr = today.toLocaleDateString('en-CA');
    const validStr = validDate.toLocaleDateString('en-CA');

    const buildQuoteData = (): QuoteData => ({
        quoteNum,
        date: dateStr,
        validUntil: validStr,
        company: selectedCompany,
        clientName: clientName || 'Client',
        items: selectedItems.map(i => ({ pkg: i.pkg, qty: i.quantity, customPrice: i.customPrice, notes: i.notes })),
        oneTimeTotal,
        monthlyTotal,
        notes,
    });

    // Download PDF
    const handleDownload = useCallback(async () => {
        setGenerating(true);
        try {
            const doc = await generatePDF(buildQuoteData());
            doc.save(`Quote_${quoteNum}_${clientName.replace(/\s+/g, '_') || 'Client'}.pdf`);
        } finally {
            setGenerating(false);
        }
    }, [selectedItems, selectedCompany, clientName, notes, quoteNum, oneTimeTotal, monthlyTotal]);

    // Preview PDF
    const handlePreview = useCallback(async () => {
        setGenerating(true);
        try {
            const doc = await generatePDF(buildQuoteData());
            const blob = doc.output('blob');
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            setShowPreview(true);
        } finally {
            setGenerating(false);
        }
    }, [selectedItems, selectedCompany, clientName, notes, quoteNum, oneTimeTotal, monthlyTotal]);

    // Quote Now — create deal in CRM pipeline
    const handleQuoteNow = useCallback(async () => {
        if (!supabase || !user) return;
        setCreatingDeal(true);
        try {
            // 1. Generate and download the PDF
            const doc = await generatePDF(buildQuoteData());
            doc.save(`Quote_${quoteNum}_${clientName.replace(/\s+/g, '_') || 'Client'}.pdf`);

            // 2. Create the deal in CRM at "proposal" stage
            const dealTitle = `Quote ${quoteNum} - ${clientName || 'Client'}`;
            const totalValue = oneTimeTotal + monthlyTotal;
            const pkgNames = selectedItems.map(i => i.pkg.name).join(', ');
            const dealNotes = [
                `Quote #${quoteNum}`,
                `Packages: ${pkgNames}`,
                oneTimeTotal > 0 ? `One-time: ${fmt(oneTimeTotal)} CAD` : '',
                monthlyTotal > 0 ? `Monthly: ${fmt(monthlyTotal)}/mo CAD` : '',
                notes ? `Notes: ${notes}` : '',
            ].filter(Boolean).join('\n');

            const { error } = await supabase.from('crm_deals').insert({
                owner_id: user.id,
                title: dealTitle,
                value: totalValue,
                currency: 'CAD',
                stage: 'proposal',
                priority: totalValue >= 10000 ? 'high' : totalValue >= 5000 ? 'medium' : 'low',
                contact_id: selectedCompany?.contactId || null,
                company_id: selectedCompany?.id || null,
                notes: dealNotes,
                expected_close_date: validStr,
            });

            if (error) throw error;

            // 3. Log an activity for the deal
            setDealCreated(true);
        } catch (e: any) {
            console.error('Failed to create deal:', e);
            alert('Quote PDF downloaded but failed to create CRM deal: ' + e.message);
        } finally {
            setCreatingDeal(false);
        }
    }, [selectedItems, selectedCompany, clientName, notes, quoteNum, oneTimeTotal, monthlyTotal, user]);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-8">
            {/* Header + Client Selector */}
            <div className="backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-white/5 p-6">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                        <div>
                            <h2 className="text-xl font-black text-white">Quote Builder</h2>
                            <p className="text-xs text-slate-400 mt-1">Build a professional quote, preview the PDF, and push it into the CRM pipeline.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                #{quoteNum}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {companies.length} companies
                            </span>
                        </div>
                    </div>

                    {/* Company selector */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="relative" ref={dropdownRef}>
                            <div className="relative">
                                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    value={selectedCompany ? selectedCompany.name : companySearch}
                                    onChange={e => {
                                        if (selectedCompany) clearCompany();
                                        setCompanySearch(e.target.value);
                                        setShowDropdown(true);
                                    }}
                                    onFocus={() => !selectedCompany && setShowDropdown(true)}
                                    placeholder={companiesLoading ? 'Loading CRM companies...' : 'Search CRM companies...'}
                                    className={`w-full bg-white/5 border rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors ${selectedCompany ? 'border-blue-500/50 bg-blue-600/10' : 'border-white/10 focus:border-blue-500/50'}`}
                                />
                                {selectedCompany && (
                                    <button onClick={clearCompany} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {showDropdown && !selectedCompany && (
                                <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#0d1626] shadow-2xl">
                                    {filteredCompanies.length === 0 ? (
                                        <div className="px-4 py-6 text-center text-sm text-slate-500">
                                            {companySearch ? 'No matching companies' : 'Type to search or scroll'}
                                        </div>
                                    ) : (
                                        filteredCompanies.map(co => (
                                            <button
                                                key={co.id}
                                                onClick={() => selectCompany(co)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-b-0"
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black shrink-0">
                                                    {co.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-white truncate">{co.name}</div>
                                                    <div className="text-[10px] text-slate-500 truncate">
                                                        {[co.industry, co.location, co.contactName].filter(Boolean).join(' \u00B7 ')}
                                                    </div>
                                                </div>
                                                {co.contactEmail && (
                                                    <div className="text-[10px] text-slate-500 truncate max-w-[150px] shrink-0">{co.contactEmail}</div>
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <input
                            type="text"
                            value={clientName}
                            onChange={e => { setClientName(e.target.value); if (selectedCompany) setSelectedCompany(null); }}
                            placeholder="Or type company name manually..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50"
                        />
                    </div>

                    {/* Selected company details */}
                    {selectedCompany && (
                        <div className="flex flex-wrap items-center gap-3 px-1">
                            {selectedCompany.industry && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                                    <Briefcase className="h-3 w-3 text-blue-400" />
                                    {selectedCompany.industry}
                                </span>
                            )}
                            {selectedCompany.location && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                                    {selectedCompany.location}
                                </span>
                            )}
                            {selectedCompany.contactName && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                                    <UserCheck className="h-3 w-3 text-emerald-400" />
                                    {selectedCompany.contactName}
                                    {selectedCompany.contactTitle && <span className="text-slate-500 normal-case">({selectedCompany.contactTitle})</span>}
                                </span>
                            )}
                            {selectedCompany.contactEmail && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                                    <Mail className="h-3 w-3 text-blue-400" />
                                    {selectedCompany.contactEmail}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Package categories */}
            {(['ai', 'web', 'managed', 'addon'] as const).map(cat => (
                <div key={cat} className="space-y-3">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xs font-black uppercase tracking-[0.25em] text-blue-400">{CATEGORY_LABELS[cat]}</h3>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <div className={`grid gap-3 ${cat === 'addon' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 lg:grid-cols-3'}`}>
                        {ALL_PACKAGES.filter(p => p.category === cat).map(pkg => {
                            const lineItem = lineItems.find(li => li.packageId === pkg.id);
                            const isSelected = !!lineItem;
                            return (
                                <div
                                    key={pkg.id}
                                    className={`rounded-2xl border p-5 transition-all ${isSelected ? 'border-blue-500/50 bg-blue-600/10 shadow-lg shadow-blue-600/10' : 'border-white/10 bg-slate-900/40 hover:border-white/20'}`}
                                >
                                    {/* Click header to toggle */}
                                    <div className="cursor-pointer" onClick={() => togglePackage(pkg.id)}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="text-sm font-black text-white">{pkg.name}</div>
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">{pkg.timeline}</div>
                                            </div>
                                            <div className={`flex h-5 w-5 items-center justify-center rounded-md border text-[10px] transition-all ${isSelected ? 'border-blue-500 bg-blue-600 text-white' : 'border-white/20 bg-white/5'}`}>
                                                {isSelected && <Check className="h-3 w-3" />}
                                            </div>
                                        </div>
                                        <div className="text-2xl font-black text-white mb-1">{pkg.price}</div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            {pkg.billing === 'monthly' ? 'per month' : 'one-time'}
                                        </div>
                                    </div>

                                    {/* Quantity + custom price when selected */}
                                    {isSelected && (
                                        <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-8">Qty</span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => updateLineItem(pkg.id, { quantity: Math.max(1, (lineItem?.quantity || 1) - 1) })}
                                                        className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="text-sm font-bold text-white w-8 text-center">{lineItem?.quantity || 1}</span>
                                                    <button
                                                        onClick={() => updateLineItem(pkg.id, { quantity: (lineItem?.quantity || 1) + 1 })}
                                                        className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-8">$</span>
                                                <input
                                                    type="number"
                                                    value={lineItem?.customPrice ?? pkg.priceNum}
                                                    onChange={e => updateLineItem(pkg.id, { customPrice: Number(e.target.value) || undefined })}
                                                    className="w-28 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500/50"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Deliverables */}
                                    {cat !== 'addon' && (
                                        <>
                                            <div className="mt-3 pt-3 border-t border-white/5">
                                                <div className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Deliverables</div>
                                                <ul className="space-y-1">
                                                    {pkg.deliverables.slice(0, 4).map((d, i) => (
                                                        <li key={i} className="flex items-start gap-1.5 text-xs text-slate-400">
                                                            <span className="text-blue-400 mt-0.5">{'\u2022'}</span>
                                                            {d}
                                                        </li>
                                                    ))}
                                                    {pkg.deliverables.length > 4 && (
                                                        <li className="text-[10px] text-slate-500 italic">+{pkg.deliverables.length - 4} more</li>
                                                    )}
                                                </ul>
                                            </div>
                                            {pkg.outcomes.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-white/5">
                                                    <div className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Outcomes</div>
                                                    <ul className="space-y-1">
                                                        {pkg.outcomes.map((o, i) => (
                                                            <li key={i} className="text-xs text-emerald-400/80 italic">{'\u2192'} {o}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Notes */}
            {selectedItems.length > 0 && (
                <div className="backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-white/5 p-6">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">Additional Notes</label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Custom terms, scope details, discount notes..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 resize-none"
                    />
                </div>
            )}

            {/* Sticky action bar */}
            {selectedItems.length > 0 && (
                <div className="sticky bottom-6 z-40">
                    <div className="backdrop-blur-xl bg-[#0d1626]/95 rounded-2xl border border-blue-500/30 p-5 shadow-2xl shadow-blue-600/20">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-6">
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Selected</div>
                                    <div className="text-lg font-black text-white">{selectedItems.length} package{selectedItems.length > 1 ? 's' : ''}</div>
                                </div>
                                {oneTimeTotal > 0 && (
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">One-time</div>
                                        <div className="text-lg font-black text-white">{fmt(oneTimeTotal)}</div>
                                    </div>
                                )}
                                {monthlyTotal > 0 && (
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Monthly</div>
                                        <div className="text-lg font-black text-white">{fmt(monthlyTotal)}/mo</div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => { setLineItems([]); setDealCreated(false); }}
                                    className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={handlePreview}
                                    disabled={generating}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-bold text-white transition-all"
                                >
                                    <FileText className="h-4 w-4" />
                                    Preview
                                </button>
                                <button
                                    onClick={handleDownload}
                                    disabled={generating}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-bold text-white transition-all"
                                >
                                    <Download className="h-4 w-4" />
                                    PDF
                                </button>
                                <button
                                    onClick={handleQuoteNow}
                                    disabled={creatingDeal || dealCreated || generating}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${
                                        dealCreated
                                            ? 'bg-emerald-600'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                >
                                    {creatingDeal ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : dealCreated ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <Briefcase className="h-4 w-4" />
                                    )}
                                    {creatingDeal ? 'Creating...' : dealCreated ? 'Deal Created' : 'Quote Now'}
                                </button>
                            </div>
                        </div>

                        {dealCreated && (
                            <div className="mt-3 pt-3 border-t border-white/10 text-xs text-emerald-400 font-bold">
                                PDF downloaded and deal created in CRM pipeline at "Proposal" stage.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PDF Preview Modal */}
            <AnimatePresence>
                {showPreview && previewUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowPreview(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0d1626] rounded-2xl border border-white/10 shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                                <h3 className="text-sm font-black text-white">Quote Preview</h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleDownload}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold text-white transition-all"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Download PDF
                                    </button>
                                    <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-white">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-800">
                                <iframe src={previewUrl} className="w-full h-full" title="Quote Preview" />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default QuotingPanel;

