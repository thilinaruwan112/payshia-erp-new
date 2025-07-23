
import { SizeForm } from '@/components/size-form';
import { sizes } from '@/lib/data';
import { notFound } from 'next/navigation';

export default function EditSizePage({ params }: { params: { id: string } }) {
  const size = sizes.find((s) => s.id === params.id);

  if (!size) {
    notFound();
  }

  return <SizeForm size={size} />;
}
