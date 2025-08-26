
'use client';

import { KotPrintView } from '@/components/kot-print-view';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function KOTPageContent({ params }: { params: { id: string } }) {
  return <KotPrintView invoiceId={params.id} />;
}

export default function KOTPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<div>Loading KOT...</div>}>
            <KOTPageContent params={params} />
        </Suspense>
    )
}

    