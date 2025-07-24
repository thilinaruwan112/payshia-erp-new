
import { EditProductForm } from '@/components/edit-product-form';
import { use } from 'react';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <EditProductForm id={id} />;
}
