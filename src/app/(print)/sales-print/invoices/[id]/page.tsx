

import { InvoicePrintView } from '@/components/invoice-print-view';
import { Suspense } from 'react';

function PrintInvoicePageContent({ params, searchParams }: { params: { id: string }, searchParams: { [key: string]: string | string[] | undefined }}) {
  return <InvoicePrintView id={params.id} companyId={searchParams.company_id as string || null} />;
}

export default function PrintInvoicePage({ params, searchParams }: { params: { id: string }, searchParams: { [key: string]: string | string[] | undefined } }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PrintInvoicePageContent params={params} searchParams={searchParams} />
        </Suspense>
    )
}
