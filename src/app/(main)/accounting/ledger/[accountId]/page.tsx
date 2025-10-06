
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useCurrency } from '@/components/currency-provider';
import React from 'react';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { fetcher } from '@/lib/api';
import type { Account, JournalEntry } from '@/lib/types';

// Mock journal entry data for a single account
const mockLedger: (Omit<JournalEntry, 'lines'> & { debit: number; credit: number })[] = [
    { id: 'JE-001', date: '2023-10-01', narration: 'Monthly rent for September', totalDebit: 1200, totalCredit: 1200, debit: 1200, credit: 0 },
    { id: 'JE-002', date: '2023-10-05', narration: 'Office supplies purchase', totalDebit: 250, totalCredit: 250, debit: 250, credit: 0 },
    { id: 'JE-003', date: '2023-10-15', narration: 'Client payment for invoice #INV-001', totalDebit: 5000, totalCredit: 5000, debit: 0, credit: 5000 },
    { id: 'JE-004', date: '2023-10-20', narration: 'Payment to supplier Global Textiles', totalDebit: 1500, totalCredit: 1500, debit: 1500, credit: 0 },
    { id: 'JE-005', date: '2023-10-25', narration: 'Sale of services', totalDebit: 3000, totalCredit: 3000, debit: 0, credit: 3000 },
];


export default function AccountLedgerPage() {
  const { accountId } = useParams();
  const router = useRouter();
  const { currencySymbol } = useCurrency();
  const { company_id } = useLocation();
  const { toast } = useToast();
  const [account, setAccount] = React.useState<Account | null>(null);
  const [ledgerEntries, setLedgerEntries] = React.useState(mockLedger);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!accountId || !company_id) {
        setIsLoading(false);
        return;
    };
    async function fetchAccountData() {
        setIsLoading(true);
        try {
            const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/finance-accounts?company_id=${company_id}`);
            if (!response.ok) throw new Error('Failed to fetch accounts');
            const data = await response.json();
            const foundAccount = (data.data || []).find((acc: Account) => acc.account_id === accountId);
            
            if (foundAccount) {
                setAccount(foundAccount);
            } else {
                notFound();
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not fetch account data.'
            })
        } finally {
            setIsLoading(false);
        }
    }
    fetchAccountData();
  }, [accountId, company_id, toast]);
  
  let runningBalance = 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
           {isLoading ? (
                <>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-4 w-48" />
                </>
           ) : (
                <>
                    <h1 className="text-3xl font-bold tracking-tight">Ledger for: {account?.account_name}</h1>
                    <p className="text-muted-foreground">A detailed view of all transactions for this account.</p>
                </>
           )}
        </div>
        <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chart of Accounts
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            The running balance is calculated based on the transactions below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="w-[40%]">Narration</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    </TableRow>
                ))
              ) : ledgerEntries.length > 0 ? (
                ledgerEntries.map((entry, index) => {
                    const balanceChange = entry.debit - entry.credit;
                    runningBalance += balanceChange;
                    return (
                        <TableRow key={index}>
                            <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                            <TableCell>{entry.narration}</TableCell>
                            <TableCell className="text-right font-mono">{entry.debit > 0 ? `${currencySymbol}${entry.debit.toFixed(2)}` : '-'}</TableCell>
                            <TableCell className="text-right font-mono">{entry.credit > 0 ? `${currencySymbol}${entry.credit.toFixed(2)}` : '-'}</TableCell>
                            <TableCell className="text-right font-mono">{currencySymbol}{runningBalance.toFixed(2)}</TableCell>
                        </TableRow>
                    )
                })
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No transactions found for this account.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

