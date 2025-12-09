
import { QuotationView } from '@/components/quotation-view';
import { notFound } from 'next/navigation';

export default async function ViewQuotationPage({ params }: { params: { id: string } }) {
  if (!params.id) {
    notFound();
  }
  return <QuotationView id={params.id} />;
}
