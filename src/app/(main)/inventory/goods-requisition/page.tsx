
'use client';

import { GoodsRequisitionForm } from '@/components/goods-requisition-form';
import type { Location } from '@/lib/types';
import { useLocation } from '@/components/location-provider';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { fetcher } from '@/lib/api';

export default function NewGoodsRequisitionPage() {
  const { company_id } = useLocation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchLocations() {
      if (!company_id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/locations/company?company_id=${company_id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }
        const data = await response.json();
        setLocations(data);
      } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not fetch locations for the selected company.'
        })
      } finally {
        setIsLoading(false);
      }
    }

    fetchLocations();
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

  return <GoodsRequisitionForm locations={locations} />;
}
