import { NextRequest, NextResponse } from 'next/server';
import { fetchRecentReviews, isSmileBackConfigured } from '@/lib/smileback/client';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    if (!isSmileBackConfigured()) {
        return NextResponse.json({ ok: false, error: 'SmileBack not configured' }, { status: 200 });
    }
    const days = parseInt(new URL(req.url).searchParams.get('days') || '30', 10);
    try {
        const data = await fetchRecentReviews(days);
        const reviews = data.results ?? [];
        const total = reviews.length;
        const positive = reviews.filter(r => r.rating === 'positive').length;
        const neutral = reviews.filter(r => r.rating === 'neutral').length;
        const negative = reviews.filter(r => r.rating === 'negative').length;
        const csat = total ? Math.round((positive / total) * 100) : null;
        return NextResponse.json({
            ok: true,
            days,
            total,
            positive,
            neutral,
            negative,
            csat_percent: csat,
            recent: reviews.slice(0, 10),
        });
    } catch (err) {
        return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 502 });
    }
}
