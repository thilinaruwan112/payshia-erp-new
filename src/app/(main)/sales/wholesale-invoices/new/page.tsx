
import { WholesaleInvoiceForm } from '@/components/wholesale-invoice-form';
import { products, users, orders } from '@/lib/data';

export default function NewWholesaleInvoicePage() {
  const customers = users.filter(u => u.role === 'Customer');
  return <WholesaleInvoiceForm products={products} customers={customers} orders={orders} />;
}
