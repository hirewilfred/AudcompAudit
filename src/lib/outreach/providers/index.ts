import { instantlyAdapter } from './instantly';
import { apifyAdapter } from './apify';
import { phantombusterAdapter } from './phantombuster';
import type { OutreachProvider } from './types';

export const providerRegistry = {
    instantly: instantlyAdapter,
    apify: apifyAdapter,
    phantombuster: phantombusterAdapter,
} as const;

export function getProvider(name: 'instantly'): OutreachProvider {
    if (name === 'instantly') return instantlyAdapter;
    throw new Error(`Unknown outreach provider: ${name}`);
}

export type { OutreachProvider, PushLead, PushResult, ProviderStats } from './types';
