
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { Account } from '@/lib/types';
import { useLocation } from '@/components/location-provider';
import { fetcher } from '@/lib/api';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function TransactionSetupPage() {
    const { company_id } = useLocation();
    const { toast } = useToast();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!company_id) {
            setIsLoading(false);
            return;
        }
        async function fetchAccounts() {
            setIsLoading(true);
            try {
                const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/chart-of-accounts/company?company_id=${company_id}`);
                if (!response.ok) throw new Error('Failed to fetch chart of accounts');
                setAccounts(await response.json());
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch accounts.' });
            } finally {
                setIsLoading(false);
            }
        }
        fetchAccounts();
    }, [company_id, toast]);

    const accountOptions = accounts.map(acc => ({
        value: String(acc.code),
        label: `${acc.code} - ${acc.name}`
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Transaction Setup</h1>
                <p className="text-muted-foreground">
                    Map default accounts for automated journal entries.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sales & Receivables</CardTitle>
                    <CardDescription>
                        Configure accounts related to sales invoices and customer payments.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <Label>Default Sales Revenue Account</Label>
                             {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} placeholder="Select a revenue account..." />}
                        </div>
                        <div className="space-y-2">
                             <Label>Default Accounts Receivable</Label>
                             {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} placeholder="Select a receivable account..." />}
                        </div>
                         <div className="space-y-2">
                             <Label>Default Cash/Bank for Receipts</Label>
                             {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} placeholder="Select a cash/bank account..." />}
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Purchasing & Payables</CardTitle>
                    <CardDescription>
                       Configure accounts related to goods received and supplier payments.
                    </CardDescription>
                </CardHeader>
                 <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <Label>Default Inventory Account</Label>
                             {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} placeholder="Select an inventory asset account..." />}
                        </div>
                        <div className="space-y-2">
                             <Label>Default Accounts Payable</Label>
                             {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} placeholder="Select a payable account..." />}
                        </div>
                        <div className="space-y-2">
                             <Label>Default Cash/Bank for Payments</Label>
                             {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} placeholder="Select a cash/bank account..." />}
                        </div>
                    </div>
                </CardContent>
                 <CardContent>
                    <Button disabled>Save Changes</Button>
                     <p className="text-xs text-muted-foreground mt-2">Note: Saving functionality is under development.</p>
                </CardContent>
            </Card>
        </div>
    );
}
