'use client';

import { ExternalLink } from 'lucide-react';

/**
 * Embeds one of the HireWilfred dashboards, which are static HTML copied into
 * public/hirewilfred/ rather than ported to React. They are self-contained —
 * their own styling, charts and state — so an iframe keeps them working
 * exactly as they do on the HireWilfred site while sitting inside this admin
 * shell.
 *
 * Their state persists to localStorage keyed to THIS origin, so figures here
 * are independent of the copy on hirewilfred.ai.
 */
export default function HireWilfredFrame({
    src,
    title,
    blurb,
}: {
    src: string;
    title: string;
    blurb: string;
}) {
    return (
        <main className="pl-0 pr-0 pt-0 pb-0 flex flex-col h-screen">
            <header className="px-8 pt-7 pb-4 border-b border-slate-200 bg-white">
                <div className="flex items-start gap-4">
                    <div className="flex-1">
                        <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-1">
                            HireWilfred
                        </span>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">{title}</h1>
                        <p className="text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">{blurb}</p>
                    </div>
                    <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-[13px] font-bold hover:bg-slate-700 transition-colors"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open full screen
                    </a>
                </div>
            </header>

            <iframe
                src={src}
                title={title}
                className="flex-1 w-full border-0 bg-[#0D0D0D]"
            />
        </main>
    );
}
