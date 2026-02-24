'use client';

import { motion } from 'framer-motion';
import { Shield, BarChart3, Zap, ArrowRight, BrainCircuit, Users, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050B1A] text-white">
      {/* Dynamic Background Shapes */}
      <div className="absolute top-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[130px]" />
      <div className="absolute bottom-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-blue-400/5 blur-[130px]" />

      <header className="fixed top-0 z-50 flex w-full items-center justify-between px-8 py-6 backdrop-blur-md border-b border-white/5">
        <Link href="/" className="flex items-center">
          <img
            src="/images/AUDCOMP-LOGO.png"
            alt="AUDCOMP"
            className="h-10 w-auto"
          />
        </Link>
        <Link
          href="/auth"
          className="rounded-full bg-blue-600/10 border border-blue-500/20 px-6 py-2 text-sm font-medium transition-colors hover:bg-blue-600/20"
        >
          Client Login
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-sm font-medium text-blue-400 backdrop-blur-xl">
            <TrendingUp className="h-4 w-4" />
            Empowering SMBs with Smarter AI Solutions
          </div>

          <h1 className="mb-8 text-5xl font-bold tracking-tight sm:text-7xl">
            Is Your Business Ready <br />
            <span className="text-blue-500">For The AI Revolution?</span>
          </h1>

          <p className="mx-auto mb-12 max-w-2xl text-lg text-slate-400 sm:text-xl leading-relaxed">
            Stop guessing and start optimizing. Get a professional AI readiness score
            and a custom roadmap to save hours every week.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth"
              className="group flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-5 text-lg font-black text-white transition-all hover:bg-blue-700 hover:scale-105 shadow-xl shadow-blue-600/20"
            >
              Start Free AI Audit
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <button className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-semibold backdrop-blur-sm transition-all hover:bg-white/10">
              How It Works
            </button>
          </div>
        </motion.div>

        {/* Feature Grid for SMBs */}
        <div className="mt-32 grid gap-8 sm:grid-cols-3">
          {[
            {
              icon: Clock,
              title: "Save 10+ Hours/Week",
              desc: "Identify repetitive tasks that AI can handle instantly so you can focus on growth."
            },
            {
              icon: Shield,
              title: "Secure Your Data",
              desc: "Learn how to use AI tools safely without risking your client's private information."
            },
            {
              icon: Users,
              title: "SMB Focused",
              desc: "No corporate jargon. Practical, actionable advice tailored for small to mid-sized businesses."
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="glass rounded-2xl p-8 border border-white/5 bg-slate-900/40 hover:border-blue-500/30 transition-all group"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/10 group-hover:bg-blue-600/20 transition-colors">
                <feature.icon className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
              <p className="text-slate-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="mt-20 border-t border-white/5 py-12 text-center text-sm text-slate-500 bg-black/20">
        © 2026 AUDCOMP Information Technology Solutions. Supporting SMB Excellence.
      </footer>
    </div>
  );
}
