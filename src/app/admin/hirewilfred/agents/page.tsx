import HireWilfredFrame from '@/components/HireWilfredFrame';

export const metadata = { title: 'HireWilfred — Agent Console' };

export default function HireWilfredAgentsPage() {
    return (
        <HireWilfredFrame
            src="/hirewilfred/admin.html"
            title="Agent Console"
            blurb="The agent catalog, agent builder and client-facing quote builder. This is where a new specialist gets specced — role, tier, tools and guardrails — before it is offered to anyone."
        />
    );
}
