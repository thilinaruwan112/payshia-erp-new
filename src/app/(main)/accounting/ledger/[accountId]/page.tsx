
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useCurrency } from '@/components/currency-provider';
import React, { useMemo } from 'react';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { fetcher } from '@/lib/api';
import type { Account, JournalEntry } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format, isWithinInterval, parseISO, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';

// Mock journal entry data for a single account
const mockLedger: (Omit<JournalEntry, 'lines'> & { debit: number; credit: number })[] = [
    { id: 'JE-001', date: '2023-10-01', narration: 'Monthly rent for September', totalDebit: 1200, totalCredit: 1200, debit: 1200, credit: 0 },
    { id: 'JE-002', date: '2023-10-05', narration: 'Office supplies purchase', totalDebit: 250, totalCredit: 250, debit: 250, credit: 0 },
    { id: 'JE-003', date: '2023-10-15', narration: 'Client payment for invoice #INV-001', totalDebit: 5000, totalCredit: 5000, debit: 0, credit: 5000 },
    { id: 'JE-004', date: '2023-10-20', narration: 'Payment to supplier Global Textiles', totalDebit: 1500, totalCredit: 1500, debit: 1500, credit: 0 },
    { id: 'JE-005', date: '2023-10-25', narration: 'Sale of services', totalDebit: 3000, totalCredit: 3000, debit: 0, credit: 3000 },
    // Adding more data to test the filter
    ...Array.from({ length: 25 }, (_, i) => ({
      id: `JE-00${i + 6}`,
      date: format(new Date(2023, 8, 25 - i), 'yyyy-MM-dd'),
      narration: `Transaction ${i + 6}`,
      totalDebit: 100 + i * 10,
      totalCredit: 100 + i * 10,
      debit: i % 2 === 0 ? 100 + i * 10 : 0,
      credit: i % 2 !== 0 ? 100 + i * 10 : 0,
    }))
].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


export default function AccountLedgerPage() {
  const { accountId } = useParams();
  const router = useRouter();
  const { currencySymbol } = useCurrency();
  const { company_id } = useLocation();
  const { toast } = useToast();
  const [account, setAccount] = React.useState<Account | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);

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
  
 const { filteredEntries, balanceForward } = useMemo(() => {
    let entries = mockLedger;
    let balanceBroughtForward = 0;
    let filtered;

    if (date?.from) {
      const from = date.from;
      const to = date.to || from;
      
      const previousEntries = entries.filter(entry => isBefore(parseISO(entry.date), from));
      balanceBroughtForward = previousEntries.reduce((acc, entry) => acc + (entry.debit - entry.credit), 0);
      
      filtered = entries.filter(entry => isWithinInterval(parseISO(entry.date), { start: from, end: to }));
    } else {
      const last20Entries = entries.slice(-20);
      if (last20Entries.length > 0) {
        const firstDate = parseISO(last20Entries[0].date);
        const previousEntries = entries.filter(entry => isBefore(parseISO(entry.date), firstDate));
        balanceBroughtForward = previousEntries.reduce((acc, entry) => acc + (entry.debit - entry.credit), 0);
      }
      filtered = last20Entries;
    }
    
    return { filteredEntries: filtered, balanceForward: balanceBroughtForward };
  }, [date]);

  let runningBalance = balanceForward;
  const closingBalance = filteredEntries.reduce((balance, entry) => {
    const balanceChange = entry.debit - entry.credit;
    return balance + balanceChange;
  }, runningBalance);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
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
        <div className="flex items-center gap-2 w-full sm:w-auto">
             <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-full sm:w-[300px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                        date.to ? (
                            <>
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(date.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                />
                </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {date?.from ? `Showing transactions for the selected period.` : 'Showing the last 20 transactions. Use the date picker to select a specific range.'}
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
              ) : (
                <>
                <TableRow className="font-semibold bg-muted/30">
                    <TableCell colSpan={4}>Balance Forward</TableCell>
                    <TableCell className="text-right font-mono">{currencySymbol}{balanceForward.toFixed(2)}</TableCell>
                </TableRow>
                {filteredEntries.length > 0 ? (
                    filteredEntries.map((entry, index) => {
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
                            No transactions found for this period.
                        </TableCell>
                    </TableRow>
                )}
                </>
              )}
            </TableBody>
            <TableFooter>
                <TableRow className="font-bold text-lg bg-muted/50">
                    <TableCell colSpan={4}>Closing Balance</TableCell>
                    <TableCell className="text-right font-mono">{currencySymbol}{closingBalance.toFixed(2)}</TableCell>
                </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
