
'use client';

import { InvoiceForm } from '@/components/invoice-form';
import { type Product, type User, type Order, type ProductVariant } from '@/lib/types';
import { orders } from '@/lib/data';
import { useLocation } from '@/components/location-provider';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface ProductWithVariants {
    product: Product;
    variants: ProductVariant[];
}

export default function NewInvoicePage() {
    const { company_id } = useLocation();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState<{
        productsWithVariants: ProductWithVariants[],
        customers: User[],
        orders: Order[]
    }>({
        productsWithVariants: [],
        customers: [],
        orders: [],
    });

    useEffect(() => {
        if (!company_id) {
            setIsLoading(false);
            return;
        };

        async function getData() {
            setIsLoading(true);
            try {
                const [productsRes, customersRes] = await Promise.all([
                    fetch(`https://server-erp.payshia.com/products/with-variants?company_id=${company_id}`, { cache: 'no-store' }),
                    fetch(`https://server-erp.payshia.com/customers/company/filter/?company_id=${company_id}`, { cache: 'no-store' }),
                ]);

                if (!productsRes.ok || !customersRes.ok) {
                    throw new Error('Failed to fetch initial data for invoice form');
                }

                const productsData = await productsRes.json();
                const customersData = await customersRes.json();

                const productsWithVariants: ProductWithVariants[] = Array.isArray(productsData.products) ? productsData.products : [];
                const customers: User[] = Array.isArray(customersData) ? customersData : [];
                
                setFormData({ productsWithVariants, customers, orders });

            } catch (error) {
                console.error("Failed to fetch invoice data:", error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch data needed to create an invoice.'
                });
                setFormData({ productsWithVariants: [], customers: [], orders: [] });
            } finally {
                setIsLoading(false);
            }
        }
        
        getData();
    }, [company_id, toast]);
  

  if (isLoading) {
    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <Skeleton className="h-10 w-1/3" />
                <div className="flex gap-2"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-24" /></div>
            </div>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    )
  }

  return <InvoiceForm {...formData} />;
}
