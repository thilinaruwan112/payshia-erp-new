
'use client'

import { TransferForm } from '@/components/transfer-form';
import type { Location } from '@/lib/types';
import { useLocation } from '@/components/location-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function NewTransferPage() {
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
        const response = await fetch(`https://server-erp.payshia.com/locations/company?company_id=${company_id}`);
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

  return <TransferForm locations={locations} />;
}
