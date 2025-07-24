
import { CollectionForm } from '@/components/collection-form';
import { type Collection, type Product } from '@/lib/types';
import { notFound } from 'next/navigation';

interface CollectionData extends Collection {
  products: Product[];
}

async function getCollection(id: string): Promise<CollectionData | null> {
    try {
        const response = await fetch(`https://server-erp.payshia.com/collections/${id}`);
        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error('Failed to fetch collection data');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to get collection:', error);
        return null;
    }
}


export default async function EditCollectionPage({ params }: { params: { id: string } }) {
  const collection = await getCollection(params.id);

  if (!collection) {
    notFound();
  }
  
  return <CollectionForm collection={collection} />;
}
