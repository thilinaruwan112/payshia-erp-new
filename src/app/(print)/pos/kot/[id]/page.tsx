
'use client';

import { KotPrintView } from '@/components/kot-print-view';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Script from 'next/script';

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
    <>
      <Script
        src="https://unpkg.com/jsprintmanager/JSPrintManager.js"
        strategy="beforeInteractive"
      />
      <Suspense fallback={<div>Loading...</div>}>
        <KotPrintView invoiceId={invoiceId} companyId={companyId || null} />
      </Suspense>
    </>
  );
}
