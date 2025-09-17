

'use client'

import { InvoicePrintView } from '@/components/invoice-print-view';
import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

function PrintInvoicePageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const companyId = searchParams.get('company_id');

  // We now pass the invoice number instead of the ID
  return <InvoicePrintView id={id} companyId={companyId} />;
}

export default function PrintInvoicePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PrintInvoicePageContent />
        </Suspense>
    )
}
