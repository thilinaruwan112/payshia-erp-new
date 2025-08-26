

import { A4ReceiptPrintView } from '@/components/a4-receipt-print-view';
import { Suspense } from 'react';

function PrintReceiptPageContent({ params }: { params: { id: string } }) {
  return <A4ReceiptPrintView id={params.id} />;
}

export default function PrintReceiptPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PrintReceiptPageContent params={params} />
        </Suspense>
    )
}
