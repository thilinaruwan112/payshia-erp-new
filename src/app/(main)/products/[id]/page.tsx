
import { EditProductForm } from '@/components/edit-product-form';

export default function EditProductPage({ params }: { params: { id: string } }) {
  return <EditProductForm id={params.id} />;
}
