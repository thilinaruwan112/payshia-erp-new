
import { InvoiceView } from '@/components/invoice-view';

export default async function PrintInvoicePage({ params }: { params: { id: string } }) {
  return <InvoiceView id={params.id} isPrintView={true} />;
}
