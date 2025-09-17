'use client'

import { CollectionForm } from '@/components/collection-form';
import { type Collection, type Product } from '@/lib/types';
import { notFound } from 'next/navigation';
import { fetcher } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface CollectionData extends Collection {
  products: Product[];
}

// This interface is to properly type the response from the association table
interface CollectionProductLink {
    id: string; // This is the collection_product_id
    collection_id: string;
    product_id: string;
}

export default function EditCollectionPage({ params }: { params: { id: string } }) {
    const { toast } = useToast();
    const [collection, setCollection] = useState<CollectionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { id } = params;
    
    useEffect(() => {
        async function getCollection() {
            if (!id) return;
            setIsLoading(true);
            try {
                const [collectionResponse, collectionProductsResponse] = await Promise.all([
                    fetcher(`https://server-erp.payshia.com/collections/${id}`),
                    fetcher(`https://server-erp.payshia.com/collection-products/collection/${id}`)
                ]);

                if (!collectionResponse.ok) {
                    if (collectionResponse.status === 404) notFound();
                    throw new Error('Failed to fetch collection data');
                }
                
                const collectionData: Collection = await collectionResponse.json();

                if (!collectionProductsResponse.ok) {
                    console.error(`Failed to fetch products for collection ${id}`);
                    setCollection({ ...collectionData, products: [] });
                    return;
                }

                const collectionProductLinks: CollectionProductLink[] = await collectionProductsResponse.json();
                const productIds = collectionProductLinks.map(p => p.product_id);

                if (productIds.length === 0) {
                    setCollection({ ...collectionData, products: [] });
                    return;
                }

                // Fetch all products and filter locally
                const allProductsResponse = await fetcher(`https://server-erp.payshia.com/products`);
                if (!allProductsResponse.ok) {
                    throw new Error('Failed to fetch all products');
                }
                const allProducts: Product[] = await allProductsResponse.json();
                
                // Map products and add the collectionProductId
                const productsInCollection = allProducts
                    .filter(p => productIds.includes(p.id))
                    .map(p => {
                        const link = collectionProductLinks.find(l => l.product_id === p.id);
                        return {
                            ...p,
                            collectionProductId: link?.id, // Add the association ID
                        };
                    });

                setCollection({ ...collectionData, products: productsInCollection });

            } catch (error) {
                console.error('Failed to get collection:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error loading collection',
                    description: 'Could not fetch data for this collection.'
                })
            } finally {
                setIsLoading(false);
            }
        }
        getCollection();
    }, [id, toast]);

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-96 w-full" /></div>
  }

  if (!collection) {
    notFound();
  }
  
  return <CollectionForm collection={collection} />;
}
