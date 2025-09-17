
'use client';

import { ReceiptForm } from '@/components/receipt-form';
import type { User } from '@/lib/types';
import { fetcher } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


export default function NewReceiptPage() {
    const [customers, setCustomers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function getData() {
            setIsLoading(true);
            try {
                const customerResponse = await fetcher('https://server-erp.payshia.com/customers');
                
                if (!customerResponse.ok) {
                    throw new Error('Failed to fetch data for receipt form');
                }
                
                const customersData = await customerResponse.json();
                setCustomers(customersData || []);

            } catch (error) {
                console.error("Failed to fetch receipt data:", error);
                 toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch customer data.'
                });
            } finally {
                setIsLoading(false);
            }
        }
        getData();
    }, [toast]);

    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    return <ReceiptForm customers={customers} />;
}

