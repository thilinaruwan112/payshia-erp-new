
'use client';

import { InvoiceForm } from '@/components/invoice-form';
import { type User, type Order } from '@/lib/types';
import { useLocation } from '@/components/location-provider';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { fetcher } from '@/lib/api';

export default function NewInvoicePage() {
    const { company_id } = useLocation();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState<{
        customers: User[],
        orders: Order[]
    }>({
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
                const [customersRes] = await Promise.all([
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/company/filter/?company_id=${company_id}`, { cache: 'no-store' }),
                ]);

                if (!customersRes.ok) {
                    throw new Error('Failed to fetch initial data for invoice form');
                }

                const customersData = await customersRes.json();
                const customers: User[] = Array.isArray(customersData) ? customersData : [];
                
                setFormData({ customers, orders: [] });

            } catch (error) {
                console.error("Failed to fetch invoice data:", error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch data needed to create an invoice.'
                });
                setFormData({ customers: [], orders: [] });
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
