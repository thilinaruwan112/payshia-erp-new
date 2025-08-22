
'use client';

import { PurchaseOrderForm } from '@/components/purchase-order-form';
import type { Supplier } from '@/lib/types';
import { useLocation } from '@/components/location-provider';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

function NewPurchaseOrderPageContent() {
  const { company_id } = useLocation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function getSuppliers() {
      if (!company_id) {
          setIsLoading(false);
          return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`https://server-erp.payshia.com/suppliers/filter/by-company?company_id=${company_id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch suppliers');
        }
        const data = await response.json();
        setSuppliers(data);
      } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not fetch suppliers for the selected company.'
        })
      } finally {
        setIsLoading(false);
      }
    }

    getSuppliers();
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

  return <PurchaseOrderForm suppliers={suppliers} />;
}


export default function NewPurchaseOrderPage() {
  return <NewPurchaseOrderPageContent />;
}
