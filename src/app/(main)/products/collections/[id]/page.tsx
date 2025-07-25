
import { CollectionForm } from '@/components/collection-form';
import { type Collection, type Product } from '@/lib/types';
import { notFound } from 'next/navigation';

interface CollectionData extends Collection {
  products: Product[];
}

async function getCollection(id: string): Promise<CollectionData | null> {
    try {
        const [collectionResponse, collectionProductsResponse] = await Promise.all([
             fetch(`https://server-erp.payshia.com/collections/${id}`),
             fetch(`https://server-erp.payshia.com/collection-products/collection/${id}`)
        ]);

        if (!collectionResponse.ok) {
            if (collectionResponse.status === 404) return null;
            throw new Error('Failed to fetch collection data');
        }
        
        const collectionData: Collection = await collectionResponse.json();

        if (!collectionProductsResponse.ok) {
            console.error(`Failed to fetch products for collection ${id}`);
            // Return collection data without products if the second call fails
            return { ...collectionData, products: [] };
        }

        const collectionProducts: { product_id: string }[] = await collectionProductsResponse.json();
        const productIds = collectionProducts.map(p => p.product_id);

        if (productIds.length === 0) {
            return { ...collectionData, products: [] };
        }

        // Fetch all products and filter locally
        const allProductsResponse = await fetch(`https://server-erp.payshia.com/products`);
        if (!allProductsResponse.ok) {
            throw new Error('Failed to fetch all products');
        }
        const allProducts: Product[] = await allProductsResponse.json();
        
        const productsInCollection = allProducts.filter(p => productIds.includes(p.id));

        return { ...collectionData, products: productsInCollection };

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
