
import { GrnView } from '@/components/grn-view';
import { notFound } from 'next/navigation';

export default async function ViewGrnPage({ params }: { params: { id: string } }) {
  if (!params.id) {
    notFound();
  }
  return <GrnView id={params.id} />;
}
