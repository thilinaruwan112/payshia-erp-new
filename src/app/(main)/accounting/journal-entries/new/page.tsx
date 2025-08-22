
'use client'
import { JournalEntryForm } from '@/components/journal-entry-form';
import React from 'react';
import type { Account } from '@/lib/types';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewJournalEntryPage() {
  const { company_id } = useLocation();
  const { toast } = useToast();
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!company_id) {
        setIsLoading(false);
        return;
    };
    async function fetchAccounts() {
        setIsLoading(true);
        try {
            const response = await fetch(`https://server-erp.payshia.com/chart-of-accounts/company?company_id=${company_id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch chart of accounts');
            }
            const data = await response.json();
            setAccounts(data);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not fetch chart of accounts data.'
            })
        } finally {
            setIsLoading(false);
        }
    }
    fetchAccounts();
  }, [company_id, toast]);

  if (isLoading) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-96 w-full" />
        </div>
    )
  }

  return <JournalEntryForm accounts={accounts} />;
}
