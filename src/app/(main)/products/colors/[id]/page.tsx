
import { ColorForm } from '@/components/color-form';
import { colors } from '@/lib/data';
import { notFound } from 'next/navigation';

export default function EditColorPage({ params }: { params: { id: string } }) {
  const color = colors.find((c) => c.id === params.id);

  if (!color) {
    notFound();
  }

  return <ColorForm color={color} />;
}
