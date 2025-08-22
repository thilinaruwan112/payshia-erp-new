
'use client';

import { ExpenseForm } from '@/components/expense-form';
import React from 'react';
import type { Account, Supplier } from '@/lib/types';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewExpensePage() {
  const { company_id } = useLocation();
  const { toast } = useToast();
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!company_id) {
        setIsLoading(false);
        return;
    };
    async function fetchData() {
        setIsLoading(true);
        try {
            const [accountsResponse, suppliersResponse] = await Promise.all([
                fetch(`https://server-erp.payshia.com/chart-of-accounts/company?company_id=${company_id}`),
                fetch(`https://server-erp.payshia.com/suppliers/filter/by-company?company_id=${company_id}`)
            ]);
            if (!accountsResponse.ok) throw new Error('Failed to fetch accounts');
            if (!suppliersResponse.ok) throw new Error('Failed to fetch suppliers');

            const accountsData = await accountsResponse.json();
            const suppliersData = await suppliersResponse.json();
            setAccounts(accountsData);
            setSuppliers(suppliersData);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not fetch necessary data.'
            })
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [company_id, toast]);
  

  const expenseAccounts = accounts.filter(acc => acc.type === 'Expense');
  const paymentAccounts = accounts.filter(acc => acc.type === 'Asset');
  
  const existingPayees = suppliers.map(s => s.supplier_name);

  if (isLoading) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-96 w-full" />
        </div>
    )
  }

  return <ExpenseForm 
            expenseAccounts={expenseAccounts} 
            paymentAccounts={paymentAccounts} 
            payees={existingPayees} 
          />;
}
