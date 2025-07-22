
import { ReceiptForm } from '@/components/receipt-form';
import { users, invoices } from '@/lib/data';

export default function NewReceiptPage() {
  const customers = users.filter(u => u.role === 'Customer');
  return <ReceiptForm customers={customers} invoices={invoices} />;
}
