
import { InvoiceView } from '@/components/invoice-view';

export default async function ViewInvoicePage({ params }: { params: { id: string } }) {
  // We can directly pass the id to the client component
  // which will handle the data fetching.
  return <InvoiceView id={params.id} isPrintView={false} />;
}
