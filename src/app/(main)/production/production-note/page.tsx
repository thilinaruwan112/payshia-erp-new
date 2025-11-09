
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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { ProductionNote, Product, ProductVariant } from '@/lib/types';
import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fetcher } from '@/lib/api';

interface ProductWithDetails {
    product: Product;
    variants: ProductVariant[];
}


export default function ProductionHistoryPage() {
    const { company_id } = useLocation();
    const { toast } = useToast();
    const [notes, setNotes] = useState<ProductionNote[]>([]);
    const [productDetails, setProductDetails] = useState<Record<string, ProductWithDetails>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!company_id) {
            setIsLoading(false);
            return;
        };

        async function fetchData() {
            setIsLoading(true);
            try {
                const notesResponse = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/production-notes?company_id=${company_id}`);

                if (!notesResponse.ok) throw new Error('Failed to fetch production notes');
                const notesData = await notesResponse.json();
                setNotes(notesData || []);

                const productIds = [...new Set((notesData || []).map((note: ProductionNote) => note.product_id))];

                const detailsPromises = productIds.map(id => 
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/details/${id}`)
                        .then(res => res.ok ? res.json() : Promise.reject(`Failed for ID ${id}`))
                );
                
                const results = await Promise.allSettled(detailsPromises);
                
                const detailsMap: Record<string, ProductWithDetails> = {};
                results.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        const productId = productIds[index];
                        const productData = result.value;
                        detailsMap[String(productId)] = {
                            product: productData.product,
                            variants: productData.variants,
                        };
                    } else {
                        console.error(`Failed to fetch details for product ID ${productIds[index]}:`, result.reason);
                    }
                });

                setProductDetails(detailsMap);

            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch production history data.'
                })
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [company_id, toast]);

    const getProductDetails = (productId: string, variantId: string) => {
        const details = productDetails[productId];
        if (!details) return `Variant ID: ${variantId}`;
        
        const variant = details.variants.find(v => v.id === variantId);
        if (!variant) return `${details.product.name} (Variant not found)`;

        return `${details.product.name} (${variant.sku})`;
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                <h1 className="text-3xl font-bold tracking-tight">Production History</h1>
                <p className="text-muted-foreground">
                    A log of all past production notes.
                </p>
                </div>
                 <Button asChild className="w-full sm:w-auto">
                    <Link href="/production/production-note/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Note
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Production Notes</CardTitle>
                    <CardDescription>
                        Browse and review previously created production notes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>PN Number</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                             <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading ? (
                        Array.from({length: 5}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell className="text-center"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                            </TableRow>
                        ))
                    ) : notes.map((note) => (
                        <TableRow key={note.id}>
                            <TableCell className="font-medium">{note.pn_number || `PN-${note.id}`}</TableCell>
                            <TableCell>{getProductDetails(note.product_id, note.product_variant_id)}</TableCell>
                            <TableCell>{format(new Date(note.created_at), 'dd MMM, yyyy')}</TableCell>
                            <TableCell className="text-right font-mono">{parseFloat(note.quantity).toFixed(2)}</TableCell>
                            <TableCell className="text-center">
                                <Badge variant={note.is_active === "1" ? 'default' : 'destructive'} className={note.is_active === "1" ? 'bg-green-100 text-green-800' : ''}>
                                    {note.is_active === "1" ? "Active" : "Cancelled"}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
    );
}
