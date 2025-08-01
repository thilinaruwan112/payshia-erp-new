
import { ReceiptView } from '@/components/receipt-view';

export default function ViewReceiptPage({ params }: { params: { id: string } }) {
  return <ReceiptView id={params.id} />;
}
