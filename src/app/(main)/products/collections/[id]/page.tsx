
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

interface CollectionProductLink {
    id: string; // This is the collection_product_id
    collection_id: string;
    product_id: string;
    company_id: string;
    product_images?: { img_url: string }[];
    product?: Product;
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
                const [collectionResponse, allProductsResponse, collectionProductsResponse] = await Promise.all([
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/collections/${id}`),
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/get/filter/by-company?company_id=${company_id}`),
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/collection-products/get/by?collection_id=${id}&company_id=${company_id}`),
                ]);

                if (!collectionResponse.ok) {
                    if (collectionResponse.status === 404) notFound();
                    throw new Error('Failed to fetch collection data');
                }
                const collectionData: Collection = await collectionResponse.json();

                if (!allProductsResponse.ok) throw new Error('Failed to fetch product list');
                const allProducts: Product[] = (await allProductsResponse.json()) || [];
                
                let productsInCollection: Product[] = [];
                if (collectionProductsResponse.ok) {
                    const linksForThisCollection: CollectionProductLink[] = (await collectionProductsResponse.json()) || [];
                    
                    const productIdsInCollection = new Set(
                        linksForThisCollection.map(link => link.product_id)
                    );

                    productsInCollection = allProducts
                        .filter(p => productIdsInCollection.has(p.id))
                        .map(p => {
                            const link = linksForThisCollection.find(l => l.product_id === p.id);
                            const frontImage = link?.product_images?.find((img: any) => img.image_type === 'front img');
                            
                            return {
                                ...p,
                                collectionProductId: link?.id, // Add the association ID
                                product_image_url: frontImage?.img_url || p.product_image_url,
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
