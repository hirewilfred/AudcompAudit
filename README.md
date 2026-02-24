# Aura AI | Intelligence Audit & Readiness Dashboard

A premium, futuristic dashboard designed to audit enterprise AI environments. This platform assesses data maturity, technical capabilities, governance, and strategic alignment through an interactive, animated survey.

### 🎨 Branding
- **Logo**: Located at `public/images/logo.png`.
- **Theme**: Corporate Blue (Deep Navy background).
- **Target**: SMBs (Small to Mid-sized Businesses).

### 🗄️ Database Schema
The application uses Supabase with the following tables:
- `profiles`: User information and audit status.
- `audit_responses`: Individual answers to the 10-question audit.
- `audit_scores`: Final calculated scores and category breakdowns.

Migrations are available in `supabase/migrations/`.

## Features

- **Premium Aesthetics**: Dark-themed, glassmorphic design system using Tailwind CSS and Framer Motion.
- **AI Audit Survey**: A multi-step questionnaire that provides real-time feedback and benchmarks.
- **Dynamic Scoring**: Real-time calculation of AI Readiness scores across 5 key categories.
- **Intelligence Dashboard**: Data visualizations (Radar charts, Gauges) to showcase audit results.
- **Conversion Focused**: Integrated CTAs for consulting opportunities and deep-dive audits.

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts
- **Database/Auth**: Supabase (via @supabase/ssr)

## Getting Started

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Setup Environment Variables**:
   Create a `.env.local` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. **Run the development server**:
   ```bash
   npm run dev
   ```

## Audit Categories

- **AI Strategy & Vision**: Executive alignment and budget commitment.
- **Data Infrastructure**: Centralization, quality, and real-time capabilities.
- **Technical Maturity**: Production LLM usage, RAG pipelines, and fine-tuning.
- **Governance & Ethics**: Bias monitoring, red-teaming, and safety policies.
- **Operational Readiness**: Workforce AI literacy and internal cultural adaptation.

---
Built by Antigravity for the future of enterprise AI.
