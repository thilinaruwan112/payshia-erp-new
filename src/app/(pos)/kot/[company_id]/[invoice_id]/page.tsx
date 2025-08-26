
'use client';

import { KotPrintView } from '@/components/kot-print-view';
import { Suspense } from 'react';

function KOTPageContent({ params }: { params: { company_id: string; invoice_id: string } }) {
  return <KotPrintView companyId={params.company_id} invoiceId={params.invoice_id} />;
}

export default function KOTPage({ params }: { params: { company_id: string; invoice_id: string } }) {
    return (
        <Suspense fallback={<div>Loading KOT...</div>}>
            <KOTPageContent params={params} />
        </Suspense>
    )
}
