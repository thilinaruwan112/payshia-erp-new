
'use client';

import { ProductionRunPrintView } from '@/components/production-run-print-view';
import { Suspense } from 'react';
import { useParams } from 'next/navigation';

function PrintProductionRunPageContent() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  
  return <ProductionRunPrintView id={id} />;
}

export default function PrintProductionRunPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PrintProductionRunPageContent />
        </Suspense>
    )
}
