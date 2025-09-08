'use client';

import { KotPrintView } from '@/components/kot-print-view';
import { notFound, useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Script from 'next/script';

function KOTPrintPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const invoiceId = typeof params.id === 'string' ? params.id : '';
  const companyId = searchParams.get('company_id');

  if (!invoiceId) {
    notFound();
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KotPrintView invoiceId={invoiceId} companyId={companyId || null} />
    </Suspense>
  );
}

export default function KOTPrintPage() {
  return (
    <>
      <Script
        src="https://unpkg.com/jsprintmanager/JSPrintManager.js"
        strategy="beforeInteractive"
      />
      <Suspense>
        <KOTPrintPageContent />
      </Suspense>
    </>
  );
}
