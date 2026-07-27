import HireWilfredFrame from '@/components/HireWilfredFrame';

export const metadata = { title: 'HireWilfred — Ops Console (Live)' };

export default function HireWilfredLivePage() {
    return (
        <HireWilfredFrame
            src="/hirewilfred/ops.html?data=live"
            title="Ops Console — Live book"
            blurb="The real book: signed clients billed by phase, and projected work still to close. Separate storage from the demo, so nothing typed into a walkthrough can reach these numbers."
        />
    );
}
