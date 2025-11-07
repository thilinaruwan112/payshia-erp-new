
import { GoodsRequisitionView } from '@/components/goods-requisition-view';
import { notFound } from 'next/navigation';

export default async function ViewGoodsRequisitionPage({ params }: { params: { id: string } }) {
  if (!params.id) {
    notFound();
  }
  return <GoodsRequisitionView id={params.id} />;
}
