
'use client';

import {
  Card,
  CardContent,
  CardDescription,
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
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fetcher } from '@/lib/api';
import { OpeningStockForm } from '@/components/opening-stock-form';
import type { Product, ProductVariant, Location as LocationType } from '@/lib/types';
import { useCurrency } from '@/components/currency-provider';

interface OpeningStockEntry {
    id: string;
    product_id: string;
    product_variant_id: string;
    cost_value: string;
    company_id: string;
    location_id: string;
    quantity: string;
    created_at: string;
}

interface ProductWithApiResponse {
    product: Product;
    variants: { variant: ProductVariant }[];
}

export default function OpeningStockPage() {
    const { company_id, availableLocations } = useLocation();
    const { toast } = useToast();
    const { currencySymbol } = useCurrency();
    const [entries, setEntries] = useState<OpeningStockEntry[]>([]);
    const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOpeningStock = async () => {
        if (!company_id) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [stockRes, productsRes] = await Promise.all([
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/opening-stock/filter/by-company?company_id=${company_id}`),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${company_id}`)
            ]);

            if (!stockRes.ok) throw new Error('Failed to fetch opening stock data.');
            const stockData = await stockRes.json();
            setEntries(Array.isArray(stockData) ? stockData : []);
            
            if (!productsRes.ok) throw new Error('Failed to fetch products');
            const productsData = await productsRes.json();
            setProducts(productsData.products || []);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Could not fetch data.';
            toast({
                variant: 'destructive',
                title: 'Error',
                description: errorMessage,
            })
        } finally {
            setIsLoading(false);
        }
    }
    
    useEffect(() => {
        fetchOpeningStock();
    }, [company_id]);

    const getProductDetails = (variantId: string) => {
        for (const p of products) {
            const variant = p.variants.find(v => v.variant.id === variantId);
            if (variant) {
                return `${p.product.name} (${variant.variant.sku})`;
            }
        }
        return `Variant ID: ${variantId}`;
    };

    const getLocationName = (locationId: string) => {
        return availableLocations.find(l => l.location_id === locationId)?.location_name || `ID: ${locationId}`;
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Opening Stock</h1>
                    <p className="text-muted-foreground">
                        Set the initial stock levels for your products.
                    </p>
                </div>
                <OpeningStockForm onStockAdded={fetchOpeningStock}>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Opening Stock
                    </Button>
                </OpeningStockForm>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>Opening Stock History</CardTitle>
                    <CardDescription>
                        A log of all initial stock entries.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead className="hidden md:table-cell">Location</TableHead>
                            <TableHead className="hidden sm:table-cell text-right">Cost Value</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading ? (
                        Array.from({length: 5}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell className="hidden sm:table-cell text-right"><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                            </TableRow>
                        ))
                    ) : entries.length > 0 ? (
                         entries.map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell>{format(new Date(entry.created_at), 'dd MMM, yyyy')}</TableCell>
                                <TableCell className="font-medium">{getProductDetails(entry.product_variant_id)}</TableCell>
                                <TableCell className="hidden md:table-cell">{getLocationName(entry.location_id)}</TableCell>
                                <TableCell className="hidden sm:table-cell text-right font-mono">{currencySymbol}{parseFloat(entry.cost_value).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">{parseFloat(entry.quantity).toFixed(2)}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                         <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No opening stock entries found.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
    );
}
