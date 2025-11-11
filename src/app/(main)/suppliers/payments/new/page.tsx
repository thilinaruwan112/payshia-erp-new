
'use client';

import { PaymentForm } from '@/components/payment-form';
import type { Account, Supplier } from '@/lib/types';
import { useLocation } from '@/components/location-provider';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { fetcher } from '@/lib/api';

function NewPaymentPageContent() {
  const { company_id } = useLocation();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
        if (!company_id) {
            setIsLoading(false);
            return;
        }
        try {
            const suppliersRes = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/filter/by-company?company_id=${company_id}`);
            if (!suppliersRes.ok) throw new Error('Failed to fetch suppliers');
            
            const suppliersData = await suppliersRes.json();
            setSuppliers(suppliersData);

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error fetching data',
                description: 'Could not fetch suppliers.',
            })
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [company_id, toast]);
  

  if (isLoading) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
      )
  }

  return (
    <PaymentForm
      suppliers={suppliers}
    />
  );
}

export default function NewPaymentPage() {
    return <NewPaymentPageContent />
}
