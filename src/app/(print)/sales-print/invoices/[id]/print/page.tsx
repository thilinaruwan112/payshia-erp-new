
'use client'

import { InvoicePrintView } from '@/components/invoice-print-view';
import { Suspense } from 'react';

function PrintInvoicePageContent({ params, searchParams }: { params: { id: string }, searchParams: { company_id?: string } }) {
  // We now pass the invoice number instead of the ID
  return <InvoicePrintView id={params.id} companyId={searchParams.company_id || null} />;
}

export default function PrintInvoicePage({ params, searchParams }: { params: { id: string }, searchParams: { company_id?: string } }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PrintInvoicePageContent params={params} searchParams={searchParams} />
        </Suspense>
    )
}
