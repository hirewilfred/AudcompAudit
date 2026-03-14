import { NextResponse } from 'next/server';

const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY!;
const INSTANTLY_BASE = 'https://api.instantly.ai/api/v2';

export async function GET() {
    try {
        const res = await fetch(`${INSTANTLY_BASE}/campaigns?limit=100&status=all`, {
            headers: {
                Authorization: `Bearer ${INSTANTLY_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            const text = await res.text();
            return NextResponse.json({ error: `Instantly error: ${text}` }, { status: res.status });
        }

        const data = await res.json();
        // Return array of { id, name, status }
        const campaigns = (data.items || data || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            status: c.status,
        }));

        return NextResponse.json({ campaigns });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
