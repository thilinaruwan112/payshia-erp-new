
'use client';

import { KotPrintView } from '@/components/kot-print-view';
import { notFound } from 'next/navigation';

export default function KOTPrintPage({ params }: { params: { company_id: string, invoice_id: string } }) {
    const { company_id, invoice_id } = params;

    if (!invoice_id || !company_id) {
        notFound();
    }

    return <KotPrintView companyId={company_id} invoiceId={invoice_id} />;
}
