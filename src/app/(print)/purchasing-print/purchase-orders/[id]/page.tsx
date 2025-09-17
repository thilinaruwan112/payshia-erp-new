
import { PurchaseOrderPrintView } from '@/components/purchase-order-print-view';
import { Suspense } from 'react';

function PrintPurchaseOrderPageContent({ params }: { params: { id: string } }) {
  // We can directly pass the id to the client component
  // which will handle the data fetching.
  return <PurchaseOrderPrintView id={params.id} />;
}

export default function PrintPurchaseOrderPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PrintPurchaseOrderPageContent params={params} />
        </Suspense>
    )
}
