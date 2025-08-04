
import { TransferView } from '@/components/transfer-view';
import { notFound } from 'next/navigation';

export default async function ViewTransferPage({ params }: { params: { id: string } }) {
  if (!params.id) {
    notFound();
  }
  return <TransferView id={params.id} />;
}
