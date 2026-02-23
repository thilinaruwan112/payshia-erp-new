'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { fetcher } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product, ProductVariant } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer, Pencil } from 'lucide-react';
import { useCurrency } from '@/components/currency-provider';
import Link from 'next/link';

interface RecipeItem {
    id: string;
    product_variant_id: string; // Finished good variant
    main_product: string; // Finished good product
    recipe_product: string; // Ingredient variant
    qty: string;
    created_at: string;
    cost_price: string;
}

interface ProductWithApiResponse {
    product: Product;
    variants: { variant: ProductVariant }[];
}

export default function SavedBOMsPage() {
    const { company_id } = useLocation();
    const { toast } = useToast();
    const [recipes, setRecipes] = useState<RecipeItem[]>([]);
    const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { currencySymbol } = useCurrency();

    useEffect(() => {
        if (!company_id) {
            setIsLoading(false);
            return;
        }

        async function fetchData() {
            setIsLoading(true);
            try {
                const [recipesRes, productsRes] = await Promise.all([
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-recipes/get/filter?company_id=${company_id}`),
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${company_id}`)
                ]);

                if (!recipesRes.ok) throw new Error('Failed to fetch recipes.');
                const recipesData = await recipesRes.json();
                setRecipes(recipesData.data || []);
                
                if (!productsRes.ok) throw new Error('Failed to fetch products.');
                const productsData = await productsRes.json();
                setProducts(productsData.products || []);

            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch data for saved BOMs.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [company_id, toast]);

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

    const handlePrint = () => {
        if (!company_id) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Company ID is not available for printing.',
            });
            return;
        }
        const url = `/production-print/saved-bom/print?company_id=${company_id}`;
        window.open(url, '_blank');
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-9 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
                <Card><CardContent className="pt-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Saved Bills of Materials</h1>
                    <p className="text-muted-foreground">
                        A list of all recipes configured in the system.
                    </p>
                </div>
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Recipes by Finished Good</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="multiple" className="w-full">
                        {Object.entries(groupedRecipes).map(([finishedGoodVariantId, ingredients]) => {
                            const finishedGoodInfo = getProductInfo(finishedGoodVariantId);
                             const totalCost = ingredients.reduce((acc, ingredient) => {
                                const cost = parseFloat(ingredient.cost_price || '0');
                                const qty = parseFloat(ingredient.qty);
                                return acc + (cost * qty);
                            }, 0);
                            return (
                                <AccordionItem value={finishedGoodVariantId} key={finishedGoodVariantId}>
                                    <AccordionTrigger>
                                        <div className="flex justify-between items-center w-full pr-2">
                                            <div className="flex flex-col items-start text-left">
                                                <span className="font-semibold text-base">{finishedGoodInfo.name}</span>
                                                <span className="text-sm text-muted-foreground font-normal">{finishedGoodInfo.sku}</span>
                                            </div>
                                            <Button variant="ghost" size="icon" asChild onClick={(e) => e.stopPropagation()}>
                                                <Link href={`/production/saved-bom/${finishedGoodVariantId}`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Ingredient</TableHead>
                                                    <TableHead>SKU</TableHead>
                                                    <TableHead className="text-right">Quantity</TableHead>
                                                    <TableHead className="text-right">Cost Price</TableHead>
                                                    <TableHead className="text-right">Cost Value</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {ingredients.map(ingredient => {
                                                    const ingredientInfo = getProductInfo(ingredient.recipe_product);
                                                    const costPrice = parseFloat(ingredient.cost_price || '0');
                                                    const quantity = parseFloat(ingredient.qty);
                                                    const costValue = costPrice * quantity;
                                                    return (
                                                        <TableRow key={ingredient.id}>
                                                            <TableCell>{ingredientInfo.name}</TableCell>
                                                            <TableCell>{ingredientInfo.sku}</TableCell>
                                                            <TableCell className="text-right font-mono">{quantity.toFixed(3)} {ingredientInfo.unit}</TableCell>
                                                            <TableCell className="text-right font-mono">{currencySymbol}{costPrice.toFixed(2)}</TableCell>
                                                            <TableCell className="text-right font-mono">{currencySymbol}{costValue.toFixed(2)}</TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                            <TableFooter>
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-right font-bold">Total Recipe Cost</TableCell>
                                                    <TableCell className="text-right font-bold font-mono">{currencySymbol}{totalCost.toFixed(2)}</TableCell>
                                                </TableRow>
                                            </TableFooter>
                                        </Table>
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                    {Object.keys(groupedRecipes).length === 0 && (
                        <div className="text-center text-muted-foreground py-12">
                            <p>No saved recipes found.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
