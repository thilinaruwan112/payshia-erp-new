
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
import { Badge } from '@/components/ui/badge';
import { Printer, Loader2 } from 'lucide-react';
import type { Product, ProductVariant } from '@/lib/types';
import React, { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/components/currency-provider';
import { useLocation } from '@/components/location-provider';
import { fetcher } from '@/lib/api';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';

interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

interface SelectableVariant {
    id: string;
    name: string;
    sku: string;
    price: number;
    barcode: string;
}


export default function BarcodePrintPage() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariants, setSelectedVariants] = useState<SelectableVariant[]>([]);
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  const { company_id } = useLocation();

  const fetchProducts = useCallback(async () => {
    if (!company_id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const productsResponse = await fetcher(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/get/filter/by-company?company_id=${company_id}`
      );
      if (!productsResponse.ok) throw new Error('Failed to fetch products');
      const productsData: Product[] = await productsResponse.json();
      
      const productsWithDetails = await Promise.all(
        productsData.map(async (p) => {
          const detailsResponse = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/details/${p.id}`);
          if (!detailsResponse.ok) return { ...p, variants: [] };
          const detailsData = await detailsResponse.json();
          return { ...p, variants: detailsData.variants || [] };
        })
      );
      
      setProducts(productsWithDetails);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to load products',
        description: 'Could not fetch products from the server.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [company_id, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSelectVariant = (product: Product, variant: ProductVariant, isSelected: boolean) => {
     const selectableVariant: SelectableVariant = {
        id: variant.id,
        name: product.name,
        sku: variant.sku,
        price: Number(variant.price),
        barcode: variant.barcode || variant.sku,
    };
    setSelectedVariants(prev => {
        if (isSelected) {
            return [...prev, selectableVariant];
        } else {
            return prev.filter(v => v.id !== variant.id);
        }
    });
  };
  
  const handlePrint = () => {
    if (selectedVariants.length === 0) {
        toast({ title: 'No items selected', description: 'Please select at least one item to print.', variant: 'destructive' });
        return;
    }
    const dataToPrint = encodeURIComponent(JSON.stringify(selectedVariants));
    window.open(`/barcode-print/print?data=${dataToPrint}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Barcode Printing</h1>
          <p className="text-muted-foreground">
            Select products and variants to print barcode labels.
          </p>
        </div>
        <Button onClick={handlePrint} disabled={selectedVariants.length === 0}>
          <Printer className="mr-2 h-4 w-4" />
          Print Selected ({selectedVariants.length})
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            Check the boxes for the product variants you want to print labels for.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Product / Variant</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-md" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                products.map((product) =>
                  product.variants.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell>
                        <Checkbox
                          onCheckedChange={(checked) => handleSelectVariant(product, variant, !!checked)}
                          checked={selectedVariants.some(v => v.id === variant.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                           <Image
                                alt={product.name}
                                className="aspect-square rounded-md object-cover"
                                src={product.product_image_url ? `${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${product.product_image_url}` : "https://placehold.co/64x64.png"}
                                width={40}
                                height={40}
                                data-ai-hint="product photo"
                            />
                            <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">
                                    SKU: {variant.sku}
                                </div>
                            </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className={product.status === 'active' ? 'bg-green-100 text-green-800' : ''}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {currencySymbol}{(Number(variant.price)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
