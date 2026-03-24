'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, ChevronRight, X,
  BrainCircuit, FileCheck, Target, Lock,
  DollarSign, Phone, Mail, Shield, Cloud, Monitor,
  Zap, TrendingUp, Sparkles, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

/* ─── Animation ─────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' as const },
  }),
};

/* ─── Brand tokens (matching audcomp.com) ───────────────────────── */
const DARK  = '#1a1a2e';
const BLUE  = '#2563EB';

/* ─── Case studies (6) ─────────────────────────────────────────── */
const caseStudies = [
  {
    slug: 'niagara-winery',
    business: 'Niagara Estate Winery',
    industry: 'Winery & Vineyard',
    location: 'Niagara-on-the-Lake, ON',
    employees: 22,
    image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&h=500&fit=crop&q=90',
    result: '34% reduction in inventory waste',
    saving: '$52,800',
    score: 81,
    challenge: 'Seasonal demand swings meant the cellar was either overstocked or running dry on best-sellers during peak tourist season. Manual ordering was costing $40k+ annually in wasted product.',
    solution: 'AI-powered demand forecasting analyzes 3 years of POS data, weather patterns, and tourism calendars to predict weekly bottle movement. Automated reorder triggers keep inventory within 5% of optimal.',
    results: [
      { metric: '34%', label: 'Less inventory waste' },
      { metric: '2.1x', label: 'Faster reorder cycle' },
      { metric: '$52.8k', label: 'Annual savings' },
      { metric: '96%', label: 'Forecast accuracy' },
    ],
    tools: ['Demand Forecasting AI', 'Inventory Optimization', 'POS Integration'],
    timeline: '6 weeks to full deployment',
  },
  {
    slug: 'bright-smile-dental',
    business: 'Bright Smile Dental',
    industry: 'Dental Practice',
    location: 'Mississauga, ON',
    employees: 14,
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=500&fit=crop&q=90',
    result: '28 hrs/week saved on admin',
    saving: '$48,200',
    score: 78,
    challenge: 'Front desk staff spent 60% of their day on phone scheduling, rescheduling no-shows, and manually transcribing clinical notes after each appointment.',
    solution: 'AI scheduling assistant handles booking, confirmations, and waitlist management via SMS. Clinical note AI listens during appointments and generates structured SOAP notes in real time.',
    results: [
      { metric: '28 hrs', label: 'Saved per week' },
      { metric: '67%', label: 'Fewer no-shows' },
      { metric: '$48.2k', label: 'Annual savings' },
      { metric: '3 min', label: 'Note generation time' },
    ],
    tools: ['Scheduling AI', 'Clinical Transcription', 'Patient SMS Bot'],
    timeline: '4 weeks to full deployment',
  },
  {
    slug: 'precision-metalworks',
    business: 'Precision Metal Works',
    industry: 'Manufacturing',
    location: 'Hamilton, ON',
    employees: 48,
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=500&fit=crop&q=90',
    result: '41% fewer defects in QC',
    saving: '$87,400',
    score: 86,
    challenge: 'Quality control relied on manual visual inspections catching only 72% of surface defects. Undetected flaws caused costly rework and a 4.2% rejection rate from clients.',
    solution: 'Computer vision cameras at three production stages flag defects in real time. Predictive maintenance AI monitors machine vibration and temperature to prevent failures before they happen.',
    results: [
      { metric: '41%', label: 'Fewer QC defects' },
      { metric: '87%', label: 'Machine uptime' },
      { metric: '$87.4k', label: 'Annual savings' },
      { metric: '1.1%', label: 'Client rejection rate' },
    ],
    tools: ['Computer Vision QC', 'Predictive Maintenance', 'Production Analytics'],
    timeline: '8 weeks to full deployment',
  },
  {
    slug: 'clearview-accounting',
    business: 'Clearview Accounting Group',
    industry: 'Accounting Firm',
    location: 'Calgary, AB',
    employees: 34,
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=500&fit=crop&q=90',
    result: '$131k annual savings found',
    saving: '$131,000',
    score: 91,
    challenge: 'Senior accountants spent 15+ hours weekly on invoice processing, data entry, and tax research — high-value staff doing low-value repetitive work during a talent shortage.',
    solution: 'AI extracts and categorizes invoice data with 99.2% accuracy. Tax research assistant surfaces relevant rulings and precedents in seconds instead of hours of manual database searching.',
    results: [
      { metric: '$131k', label: 'Annual savings' },
      { metric: '15 hrs', label: 'Saved per accountant/wk' },
      { metric: '99.2%', label: 'Data extraction accuracy' },
      { metric: '8x', label: 'Faster tax research' },
    ],
    tools: ['Invoice Automation', 'Tax Research AI', 'Client Onboarding Bot'],
    timeline: '5 weeks to full deployment',
  },
  {
    slug: 'summit-construction',
    business: 'Summit Construction Ltd.',
    industry: 'General Contractor',
    location: 'Vancouver, BC',
    employees: 62,
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=500&fit=crop&q=90',
    result: '60% faster bid preparation',
    saving: '$39,500',
    score: 74,
    challenge: 'Estimators took 3-5 days per bid, pulling historical costs from spreadsheets manually. The team was losing contracts because competitors responded faster.',
    solution: 'AI bid engine ingests project specs and pulls from 4 years of historical project data to generate accurate estimates in hours. Safety compliance reports auto-generate from site photos.',
    results: [
      { metric: '60%', label: 'Faster bid prep' },
      { metric: '23%', label: 'Higher win rate' },
      { metric: '$39.5k', label: 'Annual savings' },
      { metric: '4 hrs', label: 'Avg. bid turnaround' },
    ],
    tools: ['AI Bid Generation', 'Safety Compliance AI', 'Project Cost Analytics'],
    timeline: '7 weeks to full deployment',
  },
  {
    slug: 'fresh-harvest',
    business: 'Fresh Harvest Market',
    industry: 'Grocery & Retail',
    location: 'Ottawa, ON',
    employees: 28,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=500&fit=crop&q=90',
    result: '45% less food waste',
    saving: '$41,600',
    score: 83,
    challenge: 'As an independent grocer competing with chains, Fresh Harvest was throwing away $80k+ in perishables annually. Static pricing meant markdowns came too late to move aging stock.',
    solution: 'Demand forecasting predicts daily movement for 2,400+ SKUs. Dynamic markdown engine automatically adjusts prices on perishables approaching best-before dates to maximize sell-through.',
    results: [
      { metric: '45%', label: 'Less food waste' },
      { metric: '$41.6k', label: 'Annual savings' },
      { metric: '94%', label: 'Sell-through rate' },
      { metric: '2,400+', label: 'SKUs optimized' },
    ],
    tools: ['Perishable Forecasting', 'Dynamic Pricing Engine', 'Waste Analytics'],
    timeline: '5 weeks to full deployment',
  },
  {
    slug: 'meridian-logistics',
    business: 'Meridian Logistics',
    industry: 'Transportation & Logistics',
    location: 'Halifax, NS',
    employees: 185,
    image: '/images/case-studies/logistics.png',
    result: '18% reduction in fuel costs',
    saving: '$120,400',
    score: 82,
    challenge: 'Inefficient route planning and unexpected maintenance downtime on a fleet of 80 trucks were severely impacting margins as fuel costs rose.',
    solution: 'AI route optimization dynamically adjusts for traffic, weather, and delivery windows. Predictive analytics on vehicle sensor data schedules maintenance before breakdowns occur.',
    results: [
      { metric: '18%', label: 'Less fuel consumed' },
      { metric: '30%', label: 'Fewer breakdowns' },
      { metric: '$120.4k', label: 'Annual savings' },
      { metric: '98%', label: 'On-time delivery' },
    ],
    tools: ['Route Optimization AI', 'Predictive Maintenance', 'Fleet Analytics'],
    timeline: '6 weeks to full deployment',
  },
  {
    slug: 'oakwood-medical',
    business: 'Oakwood Medical Clinic',
    industry: 'Healthcare Clinic',
    location: 'Winnipeg, MB',
    employees: 82,
    image: '/images/case-studies/clinic.png',
    result: '60% less patient intake time',
    saving: '$85,200',
    score: 85,
    challenge: 'Clinic staff were overloaded with patient intake, triaging, and manual data entry, leading to an average waiting time of 40 minutes per patient.',
    solution: 'AI-driven patient intake platform automatically collects and structures medical history via a secure chatbot before arrival, integrating directly into the EMR.',
    results: [
      { metric: '60%', label: 'Faster intake' },
      { metric: '40 min', label: 'Wait time reduced' },
      { metric: '$85.2k', label: 'Annual savings' },
      { metric: '100%', label: 'EMR compliance' },
    ],
    tools: ['Patient Intake Bot', 'Automated Triaging', 'EMR Integration'],
    timeline: '4 weeks to full deployment',
  },
  {
    slug: 'urban-nest-realty',
    business: 'Urban Nest Real Estate',
    industry: 'Real Estate Brokerage',
    location: 'Toronto, ON',
    employees: 240,
    image: '/images/case-studies/real_estate.png',
    result: '20 hrs/week saved per agent',
    saving: '$180,000',
    score: 79,
    challenge: 'Agents spent over 20 hours a week answering repetitive client queries and manually writing property descriptions, taking away from meaningful client interactions.',
    solution: 'GenAI property description generator instantly drafts engaging MLS listings from basic specs. A 24/7 client concierge bot answers standard questions on open houses and neighborhoods.',
    results: [
      { metric: '20 hrs', label: 'Saved per agent/wk' },
      { metric: '3x', label: 'Faster replies' },
      { metric: '$180k', label: 'Annual savings' },
      { metric: '24/7', label: 'Client support' },
    ],
    tools: ['GenAI Listing Generator', 'Client Concierge Bot', 'Market Analytics'],
    timeline: '5 weeks to full deployment',
  },
  {
    slug: 'apex-financial',
    business: 'Apex Financial Partners',
    industry: 'Wealth Management',
    location: 'Montreal, QC',
    employees: 110,
    image: '/images/case-studies/financial.png',
    result: '150% more personalized touchpoints',
    saving: '$145,000',
    score: 88,
    challenge: 'Financial advisors struggled to personalize portfolios for hundreds of clients while keeping up with daily market changes and news.',
    solution: 'AI-assisted market analysis engine scans global news and matches it with client portfolios, generating personalized briefs for advisors to share instantly with clients.',
    results: [
      { metric: '150%', label: 'More client touchpoints' },
      { metric: '4 hrs', label: 'Research saved daily' },
      { metric: '$145k', label: 'Annual savings' },
      { metric: '12%', label: 'Higher client retention' },
    ],
    tools: ['Market Sentiment Analysis', 'Portfolio Personalization', 'Client Brief Generator'],
    timeline: '8 weeks to full deployment',
  },
  {
    slug: 'pioneers-education',
    business: 'Pioneers Education',
    industry: 'Education Technology',
    location: 'Vancouver, BC',
    employees: 150,
    image: '/images/case-studies/education.png',
    result: '40% reduction in grading time',
    saving: '$90,000',
    score: 84,
    challenge: 'Tutors were spending too much time answering the exact same foundational questions and grading standard assignments.',
    solution: 'GenAI tutor assistant answers basic student queries 24/7, and an automated grading system evaluates standard coursework instantly.',
    results: [
      { metric: '40%', label: 'Less grading time' },
      { metric: '24/7', label: 'Tutor availability' },
      { metric: '$90k', label: 'Annual savings' },
      { metric: '95%', label: 'Student satisfaction' },
    ],
    tools: ['GenAI Tutor Assistant', 'Automated Grading Engine', 'Student Analytics'],
    timeline: '7 weeks to full deployment',
  }
];

// Combine and interleave case studies for better distribution of new ones
const displayCaseStudies: typeof caseStudies = [];
for (let i = 0; i < 5; i++) {
  displayCaseStudies.push(caseStudies[i]);
  if (caseStudies[i+5]) {
    displayCaseStudies.push(caseStudies[i+5]);
  }
}

/* ─── Features ──────────────────────────────────────────────────── */
const features = [
  {
    icon: BrainCircuit, tag: 'Assessment',
    title: 'Multi-Dimensional Readiness Score',
    desc: 'Six scored categories — Strategy, Data, Technical, Governance, People, and Operations — benchmarked against 500+ similar Canadian organizations.',
    wide: true,
  },
  {
    icon: FileCheck, tag: 'Reports',
    title: 'Board-Ready PDF Reports',
    desc: 'One-click exports your leadership team can present to stakeholders, investors, or the board without any explanation needed.',
    wide: false,
  },
  {
    icon: DollarSign, tag: 'ROI Engine',
    title: 'Dollar-Precise ROI Calculator',
    desc: 'Quantifies annual savings by role, department, and workflow — actual dollar figures tied to your headcount and cost structure.',
    wide: false,
  },
  {
    icon: Lock, tag: 'Security',
    title: 'Data Never Leaves Your Audit',
    desc: 'Isolated, encrypted sessions. Your answers are never shared with or used to train third-party AI models. SOC 2-aligned practices.',
    wide: false,
  },
  {
    icon: Target, tag: 'Roadmap',
    title: 'Prioritized Implementation Roadmap',
    desc: 'Quick wins in week one. Strategic projects sequenced by impact and implementation effort — calibrated for your exact team size.',
    wide: true,
  },
];

/* ─── Services (matching audcomp.com) ─────────────────────────── */
const services = [
  { icon: Monitor, title: 'Managed IT Services', desc: 'Proactive monitoring, maintenance, and support for your entire IT infrastructure.' },
  { icon: Cloud, title: 'Cloud Solutions', desc: 'Migration, management, and optimization of cloud environments for maximum efficiency.' },
  { icon: Shield, title: 'Cyber Security', desc: 'Multi-layered security solutions protecting your business from evolving threats.' },
  { icon: BrainCircuit, title: 'AI Audit & Readiness', desc: 'Comprehensive assessment of your AI readiness with dollar-precise ROI projections.' },
];

/* ─── Case study detail overlay ────────────────────────────────── */
function CaseStudyDetail({ study, onClose }: { study: typeof caseStudies[number]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <button onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-lg backdrop-blur-sm transition-colors hover:bg-gray-100 hover:text-gray-900">
          <X className="h-4 w-4" />
        </button>

        <div className="relative h-[220px] sm:h-[280px] overflow-hidden rounded-t-2xl">
          <img src={study.image} alt={study.business} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
          <div className="absolute bottom-5 left-6 right-6">
            <div className="mb-2 inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600">
              {study.industry}
            </div>
            <h2 className="text-[26px] sm:text-[32px] font-bold text-white leading-tight">{study.business}</h2>
            <p className="mt-1 text-[13px] text-gray-300">{study.location} · {study.employees} employees</p>
          </div>
        </div>

        <div className="px-6 pb-8 pt-5">
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {study.results.map(r => (
              <div key={r.label} className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center">
                <div className="text-[24px] font-bold text-blue-600">{r.metric}</div>
                <div className="mt-1 text-[11px] text-gray-500">{r.label}</div>
              </div>
            ))}
          </div>

          <div className="mb-8 grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-[14px] font-semibold text-gray-900 flex items-center gap-2">
                <span className="h-5 w-1 rounded-full bg-red-500" />
                The Challenge
              </h3>
              <p className="text-[13px] leading-relaxed text-gray-600">{study.challenge}</p>
            </div>
            <div>
              <h3 className="mb-2 text-[14px] font-semibold text-gray-900 flex items-center gap-2">
                <span className="h-5 w-1 rounded-full bg-blue-600" />
                The AI Solution
              </h3>
              <p className="text-[13px] leading-relaxed text-gray-600">{study.solution}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 p-4">
            <div className="mr-auto">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">AI Tools Deployed</div>
              <div className="flex flex-wrap gap-1.5">
                {study.tools.map(t => (
                  <span key={t} className="rounded-md bg-blue-50 border border-blue-100 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Timeline</div>
              <div className="text-[13px] font-semibold text-gray-900">{study.timeline}</div>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="21" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                <circle cx="26" cy="26" r="21" fill="none" stroke={BLUE} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 21 * (study.score / 100)} ${2 * Math.PI * 21 * (1 - study.score / 100)}`}
                  strokeDashoffset={2 * Math.PI * 21 * 0.25} transform="rotate(-90 26 26)" />
                <text x="26" y="30" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1f2937">{study.score}</text>
              </svg>
              <div>
                <div className="text-[13px] font-semibold text-gray-900">AI Readiness Score</div>
                <div className="text-[11px] text-gray-500">Benchmarked against {study.industry}</div>
              </div>
            </div>
            <Link href="/auth"
              className="group flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-[13px] font-semibold text-white transition-all hover:bg-blue-700">
              Get Your Own Audit
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [selectedStudy, setSelectedStudy] = useState<typeof caseStudies[number] | null>(null);

  return (
    <div className="relative min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Open Sans', 'Arimo', system-ui, sans-serif" }}>

      {/* ══ TOP BAR (dark, matching audcomp.com) ══════════════════════ */}
      <div className="bg-gray-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-[12px]">
          <div className="flex items-center gap-5 text-gray-300">
            <a href="tel:905-304-1775" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="h-3 w-3" /> 905-304-1775
            </a>
            <a href="mailto:info@audcomp.com" className="hidden sm:flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail className="h-3 w-3" /> info@audcomp.com
            </a>
          </div>
          <a href="https://audcomp.myportallogin.com/" target="_blank" rel="noopener noreferrer"
            className="rounded bg-blue-600 px-3.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-blue-500">
            My Audcomp
          </a>
        </div>
      </div>

      {/* ══ NAVIGATION (dark header like audcomp.com) ═════════════════ */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-900 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <img src="/images/AUDCOMP-LOGO.png" alt="AUDCOMP" className="h-10 w-auto" />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {[
              { label: 'About', href: 'https://audcomp.com/about/' },
              { label: 'Services', href: 'https://audcomp.com/managed-it-services/' },
              { label: 'AI Audit', href: '#how-it-works' },
              { label: 'Case Studies', href: '#case-studies' },
              { label: 'Partners', href: 'https://audcomp.com/partners/' },
              { label: 'Contact', href: 'https://audcomp.com/contact/' },
            ].map(item => (
              <Link key={item.label} href={item.href}
                className="text-[14px] font-medium text-gray-300 transition-colors hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/auth"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-blue-700">
              Free AI Audit
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* ══ HERO (light background with image) ═══════════════════════ */}
        <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-20 sm:py-28">
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Left — copy */}
              <div>
                <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}
                  className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[12px] font-semibold text-blue-700">
                  Powered by AUDCOMP Information Technology Solutions
                </motion.div>

                <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}
                  className="text-[36px] font-bold leading-[1.15] tracking-tight text-gray-900 sm:text-[48px] lg:text-[54px]">
                  Know Exactly Where AI Will{' '}
                  <span className="text-blue-600">Save Your Business Money</span>
                </motion.h1>

                <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2}
                  className="mb-8 mt-5 max-w-lg text-[16px] leading-relaxed text-gray-600">
                  A 10-minute assessment gives you a scored AI readiness report, a
                  dollar-precise ROI breakdown, and a prioritized roadmap — free for
                  Canadian businesses under 200 employees.
                </motion.p>

                <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}
                  className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/auth"
                    className="group flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-3.5 text-[14px] font-semibold text-white transition-all hover:bg-blue-700 shadow-lg shadow-blue-600/25">
                    Start Your Free Audit
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link href="/how-it-works"
                    className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-8 py-3.5 text-[14px] font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400">
                    See a Sample Report
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}
                  className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-gray-500">
                  {['No credit card required', 'Results in 10 minutes', 'Free for businesses under 200 employees'].map(t => (
                    <span key={t} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />{t}
                    </span>
                  ))}
                </motion.div>
              </div>

              {/* Right — dashboard image */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}
                className="relative">
                <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
                  {/* Browser bar */}
                  <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-5 py-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400"/>
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400"/>
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400"/>
                    <div className="ml-3 flex h-6 flex-1 items-center justify-center rounded bg-gray-100 text-[11px] text-gray-400">
                      app.audcomp.com/audit/midwest-accounting
                    </div>
                  </div>

                  <div className="flex flex-col bg-[#F4F7FE] p-4 gap-4 overflow-hidden h-full min-h-[460px]">
                    {/* Top Card */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100/50 flex flex-col relative overflow-hidden shrink-0">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <ShieldCheck className="h-40 w-40" />
                      </div>
                      <div className="relative z-10 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-sm">
                            <Zap className="h-2 w-2" /> Action Required
                          </div>
                          <div className="bg-slate-100 text-slate-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                            Expert Review Preview
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-start">
                          <div className="max-w-[55%]">
                            <h3 className="text-[18px] font-black text-slate-900 leading-[1.15] mb-2 tracking-tight">Audit Results Ready for Expert Review</h3>
                            <p className="text-[9px] text-slate-500 leading-relaxed font-medium">
                              Your <span className="text-blue-600 font-bold">98%</span> readiness score is prepared for deep-dive validation. Book your session to review these metrics and capture the identified <span className="text-slate-900 font-bold">$131,719</span> in annual savings.
                            </p>
                          </div>
                          
                          <div className="bg-slate-900 text-white rounded-[14px] py-2.5 px-4 flex flex-col items-center justify-center cursor-pointer shadow-lg shadow-slate-900/20 group transform origin-right scale-90">
                            <div className="flex items-center gap-1.5">
                              <Zap className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 group-hover:scale-110 transition-transform" />
                              <span className="text-[13px] font-black tracking-tight">Capture These Savings</span>
                              <ArrowRight className="h-3.5 w-3.5 text-white/80 group-hover:translate-x-1" />
                            </div>
                            <span className="text-[6.5px] font-black tracking-[0.2em] text-white/50 mt-1.5 uppercase">Instant Strategic Session</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-2">
                          {[
                            {label: 'Strategy', score: '100%'},
                            {label: 'Data', score: '100%'},
                            {label: 'Technical', score: '100%'},
                            {label: 'Governance', score: '90%'},
                            {label: 'Operational', score: '100%'},
                          ].map((c, i) => (
                            <div key={i} className="flex-1 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                              <div className="text-[6.5px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{c.label}</div>
                              <div className="text-[15px] font-black text-slate-900">{c.score}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 flex-1">
                      {/* Recommended Services Card */}
                      <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-slate-100/50 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-600 h-6 w-6 rounded-lg flex items-center justify-center shadow-sm shadow-blue-600/30">
                              <TrendingUp className="h-3.5 w-3.5 text-white" />
                            </div>
                            <h4 className="text-[13px] font-black text-slate-900 tracking-tight">Recommended Services</h4>
                          </div>
                          <span className="text-[7.5px] font-bold uppercase tracking-widest text-slate-400">See all recommendations</span>
                        </div>

                        <div className="flex gap-2.5 flex-1">
                          {[
                            { title: 'Advanced Co-pilot Agents', tag: 'Advanced', icon: Zap, bg: 'bg-sky-50', text: 'text-sky-800' },
                            { title: 'Advanced Multi-agent Consulting', tag: 'Integration', icon: Sparkles, bg: 'bg-blue-50', text: 'text-blue-800' },
                            { title: 'Org-wide AI Implementation', tag: 'Scale', icon: Target, bg: 'bg-indigo-50', text: 'text-indigo-800' }
                          ].map((s, i) => (
                            <div key={i} className={`flex-1 rounded-[14px] p-3 border border-slate-100 flex flex-col ${s.bg}`}>
                              <div className="flex justify-between items-center mb-3">
                                <div className="bg-white h-6 w-6 rounded-lg flex items-center justify-center shadow-sm">
                                  <s.icon className={`h-3 w-3 ${s.text}`} />
                                </div>
                                <span className="bg-white/60 px-1.5 py-0.5 rounded font-black text-[5.5px] tracking-[0.15em] uppercase text-slate-500 border border-slate-900/5">{s.tag}</span>
                              </div>
                              <h5 className={`text-[10px] font-black leading-tight ${s.text} mb-1 tracking-tight pr-2`}>{s.title}</h5>
                              <div className="mt-auto h-0 w-full"></div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Overall Score Card */}
                      <div className="w-[180px] shrink-0 bg-white rounded-2xl p-5 shadow-sm border border-slate-100/50 flex flex-col items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none"><Sparkles className="h-16 w-16" /></div>
                        <div className="w-full flex justify-between items-center mb-1 relative z-10">
                          <h4 className="text-[13px] font-black text-slate-900 tracking-tight">Overall Score</h4>
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <p className="w-full text-[7.5px] font-bold uppercase tracking-widest text-slate-400 mb-6 relative z-10">Verified Readiness Rank</p>
                        
                        <div className="relative h-[110px] w-[110px] flex items-center justify-center relative z-10 mt-auto mb-auto">
                          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full transform -rotate-90">
                            <circle cx="50" cy="50" r="42" fill="transparent" stroke="#F1F5F9" strokeWidth="6" />
                            <circle cx="50" cy="50" r="42" fill="transparent" stroke="#3b82f6" strokeWidth="6" strokeDasharray="264" strokeDashoffset={264 * 0.02} strokeLinecap="round" />
                            <circle cx="50" cy="50" r="32" fill="transparent" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="201" strokeDashoffset={201 * 0.3} strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="relative">
                              <span className="text-[34px] font-black text-slate-900 tracking-tighter">98</span>
                              <span className="text-[12px] font-black text-blue-600/40 absolute top-1 -right-3.5">%</span>
                            </div>
                            <div className="bg-blue-600 text-white text-[5.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest mt-0 shadow-sm shadow-blue-600/20">
                              AI Verified
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══ STATS (dark bar like audcomp.com) ════════════════════════ */}
        <section className="bg-gray-900 py-10">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-2 gap-y-6 text-center lg:grid-cols-4">
              {[
                { n: '39+', s: 'Years in Business' },
                { n: '500+', s: 'Organizations Audited' },
                { n: '$2.4M', s: 'Avg. Annual Savings Identified' },
                { n: '94%', s: 'Readiness Score Accuracy' },
              ].map((stat, i) => (
                <motion.div key={stat.n} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}>
                  <div className="text-[32px] font-bold tracking-tight text-white">{stat.n}</div>
                  <div className="mt-1 text-[13px] text-gray-400">{stat.s}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SERVICES (light, like audcomp.com cards) ═════════════════ */}
        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="mb-4 text-center text-[30px] font-bold tracking-tight text-gray-900 sm:text-[40px]">
              Our Services
            </motion.h2>
            <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}
              className="mx-auto mb-14 max-w-lg text-center text-[15px] leading-relaxed text-gray-600">
              We are more than a service provider. We are your partner.
            </motion.p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((s, i) => (
                <motion.div key={s.title} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
                  className="group rounded-xl border border-gray-200 bg-white p-7 shadow-sm transition-all hover:shadow-lg hover:border-blue-200 hover:-translate-y-1">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                    <s.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="mb-2 text-[16px] font-bold text-gray-900">{s.title}</h3>
                  <p className="text-[13px] leading-relaxed text-gray-600">{s.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-[13px] font-semibold text-blue-600 group-hover:gap-2 transition-all">
                    Learn More <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SCROLLING CASE STUDIES (marquee) ═════════════════════════ */}
        <section id="case-studies" className="bg-gray-50 py-20 sm:py-28 overflow-hidden">
          <div className="mx-auto max-w-7xl px-6">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="mb-3 text-center text-[12px] font-semibold uppercase tracking-widest text-blue-600">
              Case Studies
            </motion.div>

            <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}
              className="mb-4 text-center text-[30px] font-bold tracking-tight text-gray-900 sm:text-[40px]">
              AI Is Already Working for Businesses Like Yours
            </motion.h2>

            <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={2}
              className="mx-auto mb-14 max-w-lg text-center text-[15px] leading-relaxed text-gray-600">
              Real Canadian SMBs. Real savings. Click any card to see the full story.
            </motion.p>
          </div>

          {/* ── Row 1: scrolls left ── */}
          <div className="relative mb-5">
            <div className="scroll-row-left flex w-max gap-5 px-4">
              {[...displayCaseStudies, ...displayCaseStudies].map((study, idx) => (
                <button
                  key={`r1-${idx}`}
                  onClick={() => setSelectedStudy(study)}
                  className="group relative w-[380px] shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 text-left"
                >
                  <div className="relative h-[180px] overflow-hidden">
                    <img src={study.image} alt={study.business}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute left-3 top-3 rounded-md bg-blue-600 px-2.5 py-1 text-[10px] font-semibold text-white">
                      {study.industry}
                    </div>
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="text-[17px] font-bold text-white leading-tight">{study.business}</h3>
                      <p className="mt-0.5 text-[11px] text-gray-300">{study.location}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-100 p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-[12px] font-medium text-gray-800">{study.result}</span>
                      </div>
                      <span className="text-[12px] font-bold text-green-600">{study.saving}/yr</span>
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                      View full case study <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Row 2: scrolls right ── */}
          <div className="relative">
            <div className="scroll-row-right flex w-max gap-5 px-4">
              {[...displayCaseStudies.slice(5), ...displayCaseStudies.slice(0, 5), ...displayCaseStudies.slice(5), ...displayCaseStudies.slice(0, 5)].map((study, idx) => (
                <button
                  key={`r2-${idx}`}
                  onClick={() => setSelectedStudy(study)}
                  className="group relative w-[380px] shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 text-left"
                >
                  <div className="relative h-[180px] overflow-hidden">
                    <img src={study.image} alt={study.business}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute left-3 top-3 rounded-md bg-blue-600 px-2.5 py-1 text-[10px] font-semibold text-white">
                      {study.industry}
                    </div>
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="text-[17px] font-bold text-white leading-tight">{study.business}</h3>
                      <p className="mt-0.5 text-[11px] text-gray-300">{study.location}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-100 p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-[12px] font-medium text-gray-800">{study.result}</span>
                      </div>
                      <span className="text-[12px] font-bold text-green-600">{study.saving}/yr</span>
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                      View full case study <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FEATURES SECTION REMOVED ══ */}

        {/* ══ HOW IT WORKS (light gray bg) ═════════════════════════════ */}
        <section id="how-it-works" className="bg-gray-50 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="mb-3 text-center text-[12px] font-semibold uppercase tracking-widest text-blue-600">
              Process — 10 Minutes
            </motion.div>

            <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}
              className="mb-12 text-center text-[30px] font-bold tracking-tight text-gray-900 sm:text-[40px]">
              From Zero to Roadmap in Three Steps
            </motion.h2>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                { n: '01', title: 'Complete the Audit Survey', body: 'Answer 28 questions about your team, workflows, existing tools, and goals. No technical knowledge required — designed for owners and operations leaders.' },
                { n: '02', title: 'Receive Your Scored Report', body: 'Our engine scores your readiness across 6 dimensions and benchmarks you against 500+ Canadian SMBs in your sector.' },
                { n: '03', title: 'Execute Your Roadmap', body: 'A prioritized, week-by-week action plan with tool recommendations, ROI projections, and quick wins you can start this week.' },
              ].map((step, i) => (
                <motion.div key={step.n} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
                  className="rounded-xl border border-gray-200 bg-white p-7 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-[16px] font-bold text-white">
                      {step.n}
                    </div>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                  <h3 className="mb-2 text-[16px] font-bold text-gray-900">{step.title}</h3>
                  <p className="text-[13px] leading-relaxed text-gray-600">{step.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ BOTTOM CTA (dark section like audcomp.com) ═══════════════ */}
        <section className="bg-gray-900 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <div className="mb-4 text-[12px] font-semibold uppercase tracking-widest text-blue-400">
              Free for Canadian businesses under 200 employees
            </div>

            <h2 className="mb-4 text-[30px] font-bold tracking-tight text-white sm:text-[42px]">
              Elevate Your Business with AI
            </h2>

            <p className="mx-auto mb-8 max-w-md text-[15px] leading-relaxed text-gray-400">
              Join 500+ Canadian organizations that have mapped their path to
              AI-driven growth. Results in 10 minutes.
            </p>

            <Link href="/auth"
              className="group inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-[14px] font-semibold text-white transition-all hover:bg-blue-700 shadow-lg shadow-blue-600/25">
              Get Your Free AI Audit
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </main>

      {/* ══ FOOTER (dark, matching audcomp.com) ═══════════════════════ */}
      <footer className="border-t border-gray-800 bg-gray-950 py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link href="/">
              <img src="/images/AUDCOMP-LOGO.png" alt="AUDCOMP" className="h-8 w-auto opacity-60" />
            </Link>
            <div className="flex flex-wrap justify-center gap-6 text-[12px] text-gray-400">
              {[
                { label: 'Managed IT Services', href: 'https://audcomp.com/managed-it-services/' },
                { label: 'Cyber Security', href: 'https://audcomp.com/security-services/' },
                { label: 'Cloud Solutions', href: 'https://audcomp.com/cloud-solutions/' },
                { label: 'Contact', href: 'https://audcomp.com/contact/' },
              ].map(item => (
                <a key={item.label} href={item.href} className="transition-colors hover:text-gray-200">{item.label}</a>
              ))}
            </div>
          </div>
          <div className="mt-6 border-t border-gray-800 pt-6 text-center text-[11px] text-gray-500">
            © 2026 Audcomp Information Technology Solutions · #100, 611 Tradewind Dr, Ancaster, Ontario L9G 4V5 · 905-304-1775
          </div>
        </div>
      </footer>

      {/* ══ CASE STUDY MODAL ════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedStudy && (
          <CaseStudyDetail study={selectedStudy} onClose={() => setSelectedStudy(null)} />
        )}
      </AnimatePresence>

    </div>
  );
}
