import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildPromptSummary } from '@/lib/advisor-engine';
import { AdvisorResponses } from '@/lib/advisor-questions';

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const responses: AdvisorResponses = body.responses;

        if (!responses) {
            return NextResponse.json({ error: 'Missing responses' }, { status: 400 });
        }

        const summary = buildPromptSummary(responses);

        const message = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 700,
            messages: [
                {
                    role: 'user',
                    content: `You are an expert AI adoption consultant working with SMBs in Canada. You are platform-agnostic — you recommend the best AI tools for each business regardless of vendor.

Based on the following company profile, write a 2-3 paragraph personalized executive insight about their specific AI adoption opportunity. This must feel written for THIS company, not a generic template.

Rules:
- Name their actual tools (e.g. "your QuickBooks subscription", "your HubSpot CRM", "your Google Workspace")
- Reference their specific industry and what AI means for businesses like theirs
- Connect their pain points directly to concrete outcomes (e.g. "eliminating manual invoice entry could save your team X hours per month")
- Be honest about complexity if they are early-stage — don't oversell
- Use plain language, no buzzwords, no bullet points
- Keep it under 280 words
- Write directly to the business owner in second person ("your company", "you can", "your team")

Company Assessment:
${summary}

Write the insight now — start directly with the first sentence, no preamble.`,
                },
            ],
        });

        const narrative = message.content[0].type === 'text' ? message.content[0].text : '';

        return NextResponse.json({ narrative });
    } catch (error: any) {
        console.error('AI Advisor API error:', error);
        // Return fallback narrative instead of error
        return NextResponse.json({
            narrative: 'Based on your profile, your business has a strong foundation for AI adoption. The combination of your existing tools and identified pain points creates clear opportunities to automate repetitive tasks and save significant time each month. Starting with a focused pilot — targeting your highest-volume manual processes first — will build confidence and deliver measurable ROI before expanding further. Your team is closer to meaningful AI adoption than you might think.',
        });
    }
}
