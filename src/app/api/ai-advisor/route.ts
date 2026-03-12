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
            max_tokens: 600,
            messages: [
                {
                    role: 'user',
                    content: `You are an expert Microsoft AI adoption consultant working with SMBs in Canada.

Based on the following company profile, write a 2-3 paragraph personalized insight about their AI adoption opportunity.
Be specific, practical, and encouraging. Reference their specific tools, industry, and pain points.
Focus on the biggest wins they can achieve quickly and the realistic journey ahead.
Use plain language — no jargon. Do not use bullet points. Keep it under 250 words.

Company Assessment:
${summary}

Write directly to the business owner in second person ("your company", "you can", "your team").`,
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
