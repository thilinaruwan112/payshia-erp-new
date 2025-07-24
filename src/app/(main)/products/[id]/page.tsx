
import { EditProductForm } from '@/components/edit-product-form';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  // We can directly pass the id to the client component
  // which will handle the data fetching.
  return <EditProductForm id={params.id} />;
}
