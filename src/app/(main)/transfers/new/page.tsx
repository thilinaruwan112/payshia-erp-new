
import { TransferForm } from '@/components/transfer-form';
import { locations, products } from '@/lib/data';

export default function NewTransferPage() {
  return <TransferForm locations={locations} products={products} />;
}
