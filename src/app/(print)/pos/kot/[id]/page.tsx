
'use client';

import { KotPrintView } from '@/components/kot-print-view';
import { notFound } from 'next/navigation';

export default function KOTPrintPage({ params }: { params: { id: string } }) {
    const { id } = params;

    if (!id) {
        notFound();
    }

    return <KotPrintView invoiceId={id} />;
}
