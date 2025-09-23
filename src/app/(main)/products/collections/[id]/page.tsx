
'use client'

import { CollectionForm } from '@/components/collection-form';
import { type Collection, type Product } from '@/lib/types';
import { notFound } from 'next/navigation';
import { fetcher } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from '@/components/location-provider';

interface CollectionData extends Collection {
  products: Product[];
}

// This interface is to properly type the response from the association table
interface CollectionProductLink {
    id: string; // This is the collection_product_id
    collection_id: string;
    product_id: string;
    company_id: string;
}

export default function EditCollectionPage({ params }: { params: { id: string } }) {
    const { toast } = useToast();
    const [collection, setCollection] = useState<CollectionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { company_id } = useLocation();
    const { id } = params;
    
    useEffect(() => {
        async function getCollection() {
            if (!id || !company_id) return;
            setIsLoading(true);
            try {
                const [collectionResponse, allProductsResponse] = await Promise.all([
                    fetcher(`https://server-erp.payshia.com/collections/${id}`),
                    fetcher(`https://server-erp.payshia.com/products/get/filter/by-company?company_id=${company_id}`),
                ]);

                if (!collectionResponse.ok) {
                    if (collectionResponse.status === 404) notFound();
                    throw new Error('Failed to fetch collection data');
                }
                const collectionData: Collection = await collectionResponse.json();

                if (!allProductsResponse.ok) throw new Error('Failed to fetch product list');
                const allProducts: Product[] = await allProductsResponse.json();

                const collectionProductsResponse = await fetcher(`https://server-erp.payshia.com/collection-products?collection_id=${id}&company_id=${company_id}`);
                
                let productsInCollection: Product[] = [];
                if (collectionProductsResponse.ok) {
                    const collectionProductLinks: CollectionProductLink[] = await collectionProductsResponse.json();
                    
                    const productIdsInCollection = new Set(
                        collectionProductLinks
                            .filter(link => link.collection_id === id)
                            .map(link => link.product_id)
                    );

                    productsInCollection = allProducts
                        .filter(p => productIdsInCollection.has(p.id))
                        .map(p => {
                            const link = collectionProductLinks.find(l => l.product_id === p.id && l.collection_id === id);
                            return {
                                ...p,
                                collectionProductId: link?.id, // Add the association ID
                            };
                        });
                } else {
                     console.error(`Failed to fetch products for collection ${id}`);
                }
                
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
    }, [id, company_id, toast]);

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-96 w-full" /></div>
  }

  if (!collection) {
    notFound();
  }
  
  return <CollectionForm collection={collection} />;
}
