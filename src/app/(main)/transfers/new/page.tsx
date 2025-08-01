
import { TransferForm } from '@/components/transfer-form';
import { locations } from '@/lib/data';

export default function NewTransferPage() {
  return <TransferForm locations={locations} />;
}
