
import { InvoiceForm } from '@/components/invoice-form';
import { products, users, orders } from '@/lib/data';

export default function NewInvoicePage() {
  const customers = users.filter(u => u.role === 'Customer');
  return <InvoiceForm products={products} customers={customers} orders={orders} />;
}
