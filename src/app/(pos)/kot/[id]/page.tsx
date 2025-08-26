
'use client';

import { KotPrintView } from '@/components/kot-print-view';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function KOTPrintPageContent({ params }: { params: { id: string } }) {
    const searchParams = useSearchParams();
    const companyId = searchParams.get('company_id');

    if (!params.id) {
        notFound();
    }

    return <KotPrintView invoiceId={params.id} companyId={companyId} />;
}


export default function KOTPrintPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <KOTPrintPageContent params={params} />
        </Suspense>
    );
}
