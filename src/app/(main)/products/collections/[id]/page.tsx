
import { CollectionForm } from '@/components/collection-form';
import { collections } from '@/lib/data';

export default function EditCollectionPage({ params }: { params: { id: string } }) {
  const collection = collections.find(c => c.id === params.id);

  if (!collection) {
    return <div>Collection not found.</div>;
  }
  
  return <CollectionForm collection={collection} />;
}
