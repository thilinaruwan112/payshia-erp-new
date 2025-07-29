
import { InvoicePrintView } from '@/components/invoice-print-view';

export default async function PrintInvoicePage({ params }: { params: { id: string } }) {
  return <InvoicePrintView id={params.id} />;
}
