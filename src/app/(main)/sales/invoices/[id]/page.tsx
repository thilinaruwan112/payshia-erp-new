

import { InvoiceView } from '@/components/invoice-view';

export default async function ViewInvoicePage({ params }: { params: { id: string } }) {
  // We now pass the invoice number instead of the ID
  return <InvoiceView id={params.id} />;
}
