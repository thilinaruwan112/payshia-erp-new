
import { BrandForm } from '@/components/brand-form';
import { brands } from '@/lib/data';
import { notFound } from 'next/navigation';

export default function EditBrandPage({ params }: { params: { id: string } }) {
  const brand = brands.find((b) => b.id === params.id);

  if (!brand) {
    notFound();
  }

  return <BrandForm brand={brand} />;
}
