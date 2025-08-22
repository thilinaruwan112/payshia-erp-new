

'use client';

import { PaymentForm } from '@/components/payment-form';
import type { Account, Supplier } from '@/lib/types';
import { useLocation } from '@/components/location-provider';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

function NewPaymentPageContent() {
  const { company_id } = useLocation();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
        if (!company_id) {
            setIsLoading(false);
            return;
        }
        try {
            const [suppliersRes, accountsRes] = await Promise.all([
                fetch(`https://server-erp.payshia.com/suppliers/filter/by-company?company_id=${company_id}`),
                fetch(`https://server-erp.payshia.com/chart-of-accounts/company?company_id=${company_id}`)
            ]);
            if (!suppliersRes.ok) throw new Error('Failed to fetch suppliers');
            if (!accountsRes.ok) throw new Error('Failed to fetch accounts');
            
            const suppliersData = await suppliersRes.json();
            const accountsData = await accountsRes.json();
            
            setSuppliers(suppliersData);
            setAccounts(accountsData);

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error fetching data',
                description: 'Could not fetch suppliers and accounts.',
            })
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [company_id, toast]);
  

  const paymentAccounts = accounts.filter(acc => acc.type === 'Asset');

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
      paymentAccounts={paymentAccounts}
    />
  );
}

export default function NewPaymentPage() {
    return <NewPaymentPageContent />
}
