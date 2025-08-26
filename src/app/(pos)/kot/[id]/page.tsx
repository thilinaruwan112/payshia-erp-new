
'use client';

import { KotPrintView } from '@/components/kot-print-view';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

export default function KOTPrintPage({ params, searchParams }: { params: { id: string }, searchParams: { [key: string]: string | string[] | undefined } }) {
    const { id } = params;
    const companyId = searchParams?.company_id;

    if (!id || !companyId) {
        // You might want to return a more user-friendly error message
        return <div>Error: Missing Invoice ID or Company ID</div>;
    }

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <KotPrintView companyId={String(companyId)} invoiceId={id} />
        </Suspense>
    );
}
