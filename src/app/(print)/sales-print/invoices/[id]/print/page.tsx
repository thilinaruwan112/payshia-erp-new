
'use client'

import { InvoicePrintView } from '@/components/invoice-print-view';
import { Suspense } from 'react';

function PrintInvoicePageContent({ id, companyId }: { id: string, companyId: string | null }) {
  // We now pass the invoice number instead of the ID
  return <InvoicePrintView id={id} companyId={companyId} />;
}

export default function PrintInvoicePage({ params, searchParams }: { params: { id: string }, searchParams: { company_id?: string } }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PrintInvoicePageContent id={params.id} companyId={searchParams.company_id || null} />
        </Suspense>
    )
}
