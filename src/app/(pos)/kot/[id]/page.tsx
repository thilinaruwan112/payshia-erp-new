
'use client';

import { KotPrintView } from '@/components/kot-print-view';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function KOTPageContent({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const companyId = searchParams.get('company_id');

  return <KotPrintView invoiceId={params.id} companyId={companyId} />;
}

export default function KOTPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<div>Loading KOT...</div>}>
            <KOTPageContent params={params} />
        </Suspense>
    )
}
