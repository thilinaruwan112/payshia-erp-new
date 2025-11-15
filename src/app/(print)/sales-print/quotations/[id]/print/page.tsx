
'use client';

import { QuotationPrintView } from '@/components/quotation-print-view';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';

function PrintQuotationPageContent() {
    const params = useParams();
    const id = typeof params.id === 'string' ? params.id : '';

    return <QuotationPrintView id={id} />;
}


export default function PrintQuotationPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PrintQuotationPageContent />
        </Suspense>
    )
}
