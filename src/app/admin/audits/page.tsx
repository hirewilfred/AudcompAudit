'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Audit results are surfaced on the main admin Command Center.
// This redirect ensures deep-linking works.
export default function AuditsRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/admin'); }, []);
    return null;
}
