
'use client';

import { KotPrintView } from '@/components/kot-print-view';
import { notFound, useSearchParams } from 'next/navigation';

export default function KOTPrintPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const searchParams = useSearchParams();
    const companyId = searchParams.get('company_id');

    if (!id || !companyId) {
        notFound();
    }

    return <KotPrintView companyId={companyId} invoiceId={id} />;
}
