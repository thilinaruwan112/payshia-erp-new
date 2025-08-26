import { KotPrintView } from '@/components/kot-print-view';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

export default function KOTPrintPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { id: invoiceId } = params;
  const companyId = searchParams?.company_id as string | undefined;

  if (!invoiceId) {
    notFound();
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KotPrintView invoiceId={invoiceId} companyId={companyId || null} />
    </Suspense>
  );
}
