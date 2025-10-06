
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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrency } from '@/components/currency-provider';
import type { JournalEntry } from '@/lib/types';
import React from 'react';
import { useLocation } from '@/components/location-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { fetcher } from '@/lib/api';

export default function JournalEntriesPage() {
    const { currencySymbol } = useCurrency();
    const { company_id } = useLocation();
    const { toast } = useToast();
    const [journalEntries, setJournalEntries] = React.useState<JournalEntry[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (!company_id) {
            setIsLoading(false);
            return;
        }
        async function fetchJournalEntries() {
            setIsLoading(true);
            try {
                const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/finance-transactions?company_id=${company_id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch journal entries');
                }
                const data = await response.json();
                setJournalEntries(data.data || []);
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch journal entries.'
                })
            } finally {
                setIsLoading(false);
            }
        }
        fetchJournalEntries();
    }, [company_id, toast]);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journal Entries</h1>
          <p className="text-muted-foreground">
            Record and manage your manual accounting entries.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/accounting/journal-entries/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Journal Entry
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
          <CardDescription>
            A list of recent manual journal entries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Ref Key</TableHead>
                <TableHead className="hidden sm:table-cell">Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))
              ) : journalEntries.length > 0 ? (
                journalEntries.map((entry) => (
                    <TableRow key={entry.transaction_id}>
                    <TableCell>{new Date(entry.transaction_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono">{entry.ref_key}</TableCell>
                    <TableCell className="hidden sm:table-cell max-w-sm truncate">{entry.description}</TableCell>
                    <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(entry.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem disabled>View Details</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" disabled>
                            Reverse Entry
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No journal entries found.
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
