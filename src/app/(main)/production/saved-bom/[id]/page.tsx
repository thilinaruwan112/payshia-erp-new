'use client'

import { BomForm } from '@/components/bom-form';
import { useToast } from '@/hooks/use-toast';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetcher } from '@/lib/api';
import { useLocation } from '@/components/location-provider';
import type { Product, ProductVariant } from '@/lib/types';

interface RecipeItem {
    id: string;
    product_variant_id: string; // Finished good variant
    main_product: string; // Finished good product
    recipe_product: string; // Ingredient variant
    qty: string;
    created_at: string;
    cost_price: string;
}

// Updated BomData interface
interface BomData {
    finishedGoodId: string;
    items: {
        recipe_product: string; // ingredient variant ID
        quantity: number;
        unit: string;
        cost_price: number;
        name: string;
        sku: string;
    }[];
}

interface ProductWithApiResponse {
    product: Product;
    variants: { variant: ProductVariant }[];
}

export default function EditBomPage() {
    const { id } = useParams();
    const { toast } = useToast();
    const { company_id } = useLocation();
    const [bomData, setBomData] = useState<BomData | null>(null);
    const [allProducts, setAllProducts] = useState<ProductWithApiResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id || !company_id) return;
        
        async function getBomData() {
            setIsLoading(true);
            try {
                const finishedGoodVariantId = Array.isArray(id) ? id[0] : id;
                
                const [productsResponse, recipesResponse] = await Promise.all([
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${company_id}`),
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-recipes/get/filter?company_id=${company_id}&product_variant_id=${finishedGoodVariantId}`)
                ]);

                if (!productsResponse.ok || !recipesResponse.ok) {
                    throw new Error('Failed to fetch data for BOM');
                }

                const productsData = await productsResponse.json();
                const fetchedAllProducts: ProductWithApiResponse[] = productsData.products || [];
                setAllProducts(fetchedAllProducts);

                const recipesData = await recipesResponse.json();
                const recipeItems: RecipeItem[] = recipesData.data || [];

                if (recipeItems.length === 0) {
                    notFound();
                    return;
                }

                const allProductsForLookup = fetchedAllProducts.flatMap(p => 
                    (p.variants || []).map(v => ({
                        id: v.variant.id,
                        name: p.product.name,
                        sku: v.variant.sku,
                        unit: p.product.stock_unit || 'Nos',
                    }))
                );

                const items = recipeItems.map(item => {
                    const ingredientInfo = allProductsForLookup.find(ing => ing.id === item.recipe_product);
                    return {
                        recipe_product: item.recipe_product,
                        quantity: parseFloat(item.qty),
                        unit: ingredientInfo?.unit || 'Nos',
                        cost_price: parseFloat(item.cost_price || '0'),
                        name: ingredientInfo?.name || `Product ID: ${item.recipe_product}`,
                        sku: ingredientInfo?.sku || 'N/A',
                    };
                });
                
                setBomData({
                    finishedGoodId: finishedGoodVariantId,
                    items: items,
                });

            } catch (err) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load BOM data.' });
            } finally {
                setIsLoading(false);
            }
        }
        
        getBomData();

    }, [id, company_id, toast]);
    
    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    if (!bomData) {
        return <div>Could not load Bill of Materials data.</div>
    }

    return <BomForm bomToEdit={bomData} allProducts={allProducts} />;
}
