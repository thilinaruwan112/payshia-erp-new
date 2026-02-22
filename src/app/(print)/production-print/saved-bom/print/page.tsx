
'use client'

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense, useMemo } from 'react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { fetcher } from '@/lib/api';
import type { Product, ProductVariant } from '@/lib/types';
import Image from 'next/image';

interface Company {
    id: string;
    company_name: string;
    company_address: string;
    company_city: string;
    company_email: string;
    company_telephone: string;
    org_logo?: string | null;
}

interface RecipeItem {
    id: string;
    product_variant_id: string;
    main_product: string;
    recipe_product: string;
    qty: string;
    created_at: string;
}

interface ProductWithApiResponse {
    product: Product;
    variants: { variant: ProductVariant }[];
}

function PrintViewContent() {
  const searchParams = useSearchParams();
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const companyId = searchParams.get('company_id');

  useEffect(() => {
    async function fetchData() {
        if (!companyId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Company ID is missing.' });
            setIsLoading(false);
            return;
        };

        setIsLoading(true);
        try {
            const [recipesRes, productsRes, companyRes] = await Promise.all([
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-recipes/get/filter?company_id=${companyId}`),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${companyId}`),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies/${companyId}`),
            ]);

            if (!recipesRes.ok) throw new Error('Failed to fetch recipes.');
            const recipesData = await recipesRes.json();
            setRecipes(recipesData.data || []);
            
            if (!productsRes.ok) throw new Error('Failed to fetch products.');
            const productsData = await productsRes.json();
            setProducts(productsData.products || []);
            
            if (companyRes.ok) setCompany(await companyRes.json());

        } catch(error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch report data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [companyId, toast]);

  useEffect(() => {
    if (!isLoading && recipes.length > 0) {
      document.title = `Saved BOMs Report`;
      setTimeout(() => window.print(), 1000);
    }
  }, [isLoading, recipes]);
  
  const getProductInfo = (variantId: string) => {
    for (const p of products) {
        const variant = p.variants.find(v => v.variant.id === variantId);
        if (variant) {
            return {
                name: p.product.name,
                sku: variant.variant.sku,
                unit: p.product.stock_unit || 'Nos'
            };
        }
    }
    return { name: `Variant ID: ${variantId}`, sku: 'N/A', unit: 'Nos' };
  };

  const groupedRecipes = useMemo(() => {
    return recipes.reduce((acc, recipe) => {
        const key = recipe.product_variant_id;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(recipe);
        return acc;
    }, {} as Record<string, RecipeItem[]>);
  }, [recipes]);


  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-[800px] w-full" /></div>;
  }
  
  const logoUrl = company?.org_logo ? `${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${company.org_logo}` : null;

  return (
    <div className="bg-white text-black font-sans text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8">
        <header className="flex justify-between items-start pb-4 border-b">
            <div>
                {logoUrl && <Image src={logoUrl} alt="Company Logo" width={60} height={60} />}
                <h1 className="text-lg font-bold mt-2">{company?.company_name || "Your Company"}</h1>
                <p>{company?.company_address}</p>
                <p>{company?.company_telephone}</p>
            </div>
            <div className="text-right">
                <h2 className="text-2xl font-bold uppercase">Saved Bills of Materials</h2>
                <p className="text-xs text-gray-500">Report generated on {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>
            </div>
        </header>

        <main className="mt-6 space-y-6">
            {Object.entries(groupedRecipes).map(([finishedGoodVariantId, ingredients]) => {
                const finishedGoodInfo = getProductInfo(finishedGoodVariantId);
                return (
                    <div key={finishedGoodVariantId} className="page-break-before:always">
                        <div className="p-2 bg-gray-100 rounded-md mb-2">
                           <h3 className="text-md font-semibold">Finished Good: {finishedGoodInfo.name} <span className="font-normal text-gray-600">({finishedGoodInfo.sku})</span></h3>
                        </div>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="p-2 border border-gray-300">Ingredient</th>
                                    <th className="p-2 border border-gray-300">SKU</th>
                                    <th className="p-2 border border-gray-300 text-right">Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ingredients.map(ingredient => {
                                    const ingredientInfo = getProductInfo(ingredient.recipe_product);
                                    return (
                                        <tr key={ingredient.id} className="border-b">
                                            <td className="p-2 border border-gray-300">{ingredientInfo.name}</td>
                                            <td className="p-2 border border-gray-300">{ingredientInfo.sku}</td>
                                            <td className="p-2 border border-gray-300 text-right font-mono">{parseFloat(ingredient.qty).toFixed(3)} {ingredientInfo.unit}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )
            })}
             {Object.keys(groupedRecipes).length === 0 && (
                <div className="text-center text-gray-500 py-12">
                    <p>No saved recipes found.</p>
                </div>
            )}
        </main>
    </div>
  )
}

export default function PrintSavedBOMsPage() {
    return (
        <Suspense fallback={<div>Loading report...</div>}>
            <PrintViewContent />
        </Suspense>
    )
}
