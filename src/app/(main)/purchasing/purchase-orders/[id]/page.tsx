
import { PurchaseOrderView } from '@/components/purchase-order-view';
import { notFound } from 'next/navigation';

export default async function ViewPurchaseOrderPage({ params }: { params: { id: string } }) {
  // We can directly pass the id to the client component
  // which will handle the data fetching.
  return <PurchaseOrderView id={params.id} />;
}
