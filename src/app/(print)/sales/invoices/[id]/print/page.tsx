

import { InvoicePrintView } from '@/components/invoice-print-view';
import { Suspense } from 'react';

function PrintInvoicePageContent({ params }: { params: { id: string } }) {
  return <InvoicePrintView id={params.id} />;
}

export default function PrintInvoicePage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PrintInvoicePageContent params={params} />
        </Suspense>
    )
}
