import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { expertEmail, expertName, userName, userEmail, userOrg, score, categoryScores, answers } = body;

        if (!expertEmail) {
            return NextResponse.json({ error: 'No expert email provided' }, { status: 400 });
        }

        // Build category breakdown HTML
        const categoryRows = (categoryScores ?? []).map((cat: any) => `
            <tr>
                <td style="padding:8px 12px; font-size:13px; color:#475569; font-weight:600; border-bottom:1px solid #f1f5f9;">${cat.category}</td>
                <td style="padding:8px 12px; border-bottom:1px solid #f1f5f9;">
                    <div style="background:#e2e8f0; border-radius:99px; height:8px; width:100%; overflow:hidden;">
                        <div style="background:#3b82f6; height:100%; width:${cat.score}%; border-radius:99px;"></div>
                    </div>
                </td>
                <td style="padding:8px 12px; font-size:13px; font-weight:900; color:#1e293b; border-bottom:1px solid #f1f5f9; text-align:right;">${cat.score}%</td>
            </tr>
        `).join('');

        // Build answers HTML
        const answersHtml = (answers ?? []).map((a: any, i: number) => `
            <div style="padding:16px 0; border-bottom:1px solid #f1f5f9;">
                <p style="font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:0.1em; color:#94a3b8; margin:0 0 4px 0;">${a.category || 'General'}</p>
                <p style="font-size:14px; font-weight:700; color:#1e293b; margin:0 0 6px 0;">${a.question}</p>
                <p style="font-size:14px; color:#3b82f6; font-weight:800; margin:0;">${a.answer}</p>
            </div>
        `).join('');

        const tierLabel = score >= 65 ? 'Advanced (Tier 1)' : 'Foundation (Tier 2)';
        const tierColor = score >= 65 ? '#10b981' : '#f59e0b';

        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width:640px; margin:40px auto; background:white; border-radius:24px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 4px 24px rgba(0,0,0,0.06);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg, #1e293b, #0f172a); padding:40px 40px 32px; color:white;">
      <p style="font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:0.2em; color:#94a3b8; margin:0 0 12px 0;">AI Readiness Audit</p>
      <h1 style="font-size:28px; font-weight:900; margin:0 0 8px 0; line-height:1.2;">Audit Results for ${userName}</h1>
      <p style="font-size:14px; color:#94a3b8; margin:0;">${userOrg || userEmail || ''}</p>
    </div>

    <!-- Score -->
    <div style="padding:32px 40px; background:#f8fafc; border-bottom:1px solid #f1f5f9; display:flex; gap:24px; align-items:center;">
      <div style="background:white; border-radius:16px; padding:20px; text-align:center; min-width:100px; border:2px solid #e2e8f0; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <p style="font-size:36px; font-weight:900; color:#1e293b; margin:0; line-height:1;">${score}%</p>
        <p style="font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:0.1em; color:#94a3b8; margin:4px 0 0 0;">Overall</p>
      </div>
      <div>
        <span style="display:inline-block; background:${tierColor}20; color:${tierColor}; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:0.1em; padding:4px 12px; border-radius:99px; border:1px solid ${tierColor}40;">${tierLabel}</span>
        <p style="font-size:14px; color:#475569; font-weight:600; margin:10px 0 0 0;">This user has been assigned to you for follow-up. Please review their audit results below and book a strategy session.</p>
      </div>
    </div>

    <!-- Category Breakdown -->
    <div style="padding:32px 40px; border-bottom:1px solid #f1f5f9;">
      <h2 style="font-size:16px; font-weight:900; color:#1e293b; margin:0 0 20px 0;">Category Breakdown</h2>
      <table style="width:100%; border-collapse:collapse;">
        ${categoryRows}
      </table>
    </div>

    <!-- Answers -->
    <div style="padding:32px 40px; border-bottom:1px solid #f1f5f9;">
      <h2 style="font-size:16px; font-weight:900; color:#1e293b; margin:0 0 4px 0;">Audit Responses</h2>
      <p style="font-size:13px; color:#94a3b8; margin:0 0 20px 0;">${(answers ?? []).length} questions answered</p>
      ${answersHtml}
    </div>

    <!-- Footer -->
    <div style="padding:24px 40px; background:#f8fafc; text-align:center;">
      <p style="font-size:12px; color:#94a3b8; margin:0;">Sent via <strong style="color:#1e293b;">AudComp AI Audit</strong> platform</p>
    </div>
  </div>
</body>
</html>`;

        const { data, error } = await resend.emails.send({
            from: 'AudComp <onboarding@resend.dev>',
            to: [expertEmail],
            subject: `AI Audit Results — ${userName}${score ? ` (${score}%)` : ''}`,
            html,
        });

        if (error) {
            console.error('Resend error:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, id: data?.id });
    } catch (err: any) {
        console.error('Email route error:', err);
        return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
    }
}
