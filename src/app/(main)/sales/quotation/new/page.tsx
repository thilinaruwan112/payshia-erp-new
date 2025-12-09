
'use client';

import { QuotationForm } from '@/components/quotation-form';
import { type User } from '@/lib/types';
import { useLocation } from '@/components/location-provider';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { fetcher } from '@/lib/api';

export default function NewQuotationPage() {
    const { company_id } = useLocation();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [customers, setCustomers] = useState<User[]>([]);

    useEffect(() => {
        if (!company_id) {
            setIsLoading(false);
            return;
        };

        async function getCustomers() {
            setIsLoading(true);
            try {
                const customersRes = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/company/filter/?company_id=${company_id}`, { cache: 'no-store' });
                if (!customersRes.ok) {
                    throw new Error('Failed to fetch initial data for quotation form');
                }
                const customersData = await customersRes.json();
                setCustomers(Array.isArray(customersData) ? customersData : []);
            } catch (error) {
                console.error("Failed to fetch quotation data:", error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch data needed to create a quotation.'
                });
                setCustomers([]);
            } finally {
                setIsLoading(false);
            }
        }
        
        getCustomers();
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

  return <QuotationForm customers={customers} />;
}
