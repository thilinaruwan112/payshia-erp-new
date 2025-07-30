
import { GrnPrintView } from '@/components/grn-print-view';
import { Suspense } from 'react';

function PrintGrnPageContent({ params }: { params: { id: string } }) {
  return <GrnPrintView id={params.id} />;
}

export default function PrintGrnPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PrintGrnPageContent params={params} />
        </Suspense>
    )
}
