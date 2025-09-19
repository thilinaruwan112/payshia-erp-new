
import { TransferView } from '@/components/transfer-view';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

function ViewTransferPageContent({ params }: { params: { id: string } }) {
  if (!params.id) {
    notFound();
  }
  return <TransferView id={params.id} />;
}

export default function ViewTransferPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ViewTransferPageContent params={params} />
        </Suspense>
    )
}
