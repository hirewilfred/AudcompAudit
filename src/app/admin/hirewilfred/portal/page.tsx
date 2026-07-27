import HireWilfredFrame from '@/components/HireWilfredFrame';

export const metadata = { title: 'HireWilfred — Client Portal' };

export default function HireWilfredPortalPage() {
    return (
        <HireWilfredFrame
            src="/hirewilfred/dashboard.html"
            title="Client Portal"
            blurb="What the client sees: their agents, hours saved, items waiting on their approval, change requests and plan usage. Useful for checking how a change reads from their side before you ship it."
        />
    );
}
