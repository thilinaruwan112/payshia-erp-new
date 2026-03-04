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
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrency } from '@/components/currency-provider';
import type { JournalEntry, Account } from '@/lib/types';
import React from 'react';
import { useLocation } from '@/components/location-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { fetcher } from '@/lib/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Combobox } from '@/components/ui/combobox';

export default function JournalEntriesPage() {
    const { currencySymbol } = useCurrency();
    const { company_id } = useLocation();
    const { toast } = useToast();
    const [journalEntries, setJournalEntries] = React.useState<JournalEntry[]>([]);
    const [accounts, setAccounts] = React.useState<Account[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [date, setDate] = React.useState<DateRange | undefined>(undefined);
    const [accountId, setAccountId] = React.useState<string | undefined>(undefined);
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    React.useEffect(() => {
        if (!company_id) return;
        async function fetchAccounts() {
            try {
                const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/finance-accounts?company_id=${company_id}`);
                if (!response.ok) throw new Error('Failed to fetch chart of accounts');
                const data = await response.json();
                setAccounts(data.data || []);
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch chart of accounts data.'
                })
            }
        }
        fetchAccounts();
    }, [company_id, toast]);
    
    React.useEffect(() => {
        if (!company_id) {
            setIsLoading(false);
            return;
        }
        async function fetchJournalEntries() {
            setIsLoading(true);
            try {
                let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/finance-transactions?company_id=${company_id}`;
                const params = new URLSearchParams();
                if (date?.from) {
                    params.append('start_date', format(date.from, 'yyyy-MM-dd'));
                    const endDate = date.to ? format(date.to, 'yyyy-MM-dd') : format(date.from, 'yyyy-MM-dd');
                    params.append('end_date', endDate);
                }
                if (accountId) {
                    params.append('account_id', accountId);
                    // Use a different endpoint if accountId is specified, assuming it exists
                    url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/finance-transactions/get/by-account`;
                }

                const queryString = params.toString();
                if (queryString) {
                    url += `&${queryString}`;
                }

                const response = await fetcher(url);
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
    }, [company_id, toast, date, accountId]);
    
    const accountOptions = accounts.map(acc => ({ value: acc.account_id, label: `${acc.account_id} - ${acc.account_name}` }));

    const clearFilters = () => {
        setDate(undefined);
        setAccountId(undefined);
    }
    
    const paginatedEntries = React.useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return journalEntries.slice(startIndex, startIndex + itemsPerPage);
    }, [journalEntries, currentPage]);

    const totalPages = Math.ceil(journalEntries.length / itemsPerPage);

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
            A list of recent manual journal entries. Use the filters below to refine your search.
          </CardDescription>
          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <Popover>
                <PopoverTrigger asChild>
                    <Button id="date" variant={"outline"} className={cn("w-full md:w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (date.to ? (<>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</>) : (format(date.from, "LLL dd, y"))) : (<span>Pick a date range</span>)}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
                </PopoverContent>
            </Popover>
             <Combobox
                options={accountOptions}
                value={accountId || ''}
                onChange={setAccountId}
                placeholder="Filter by account..."
                notFoundText="No account found."
            />
            {(date || accountId) && <Button variant="ghost" onClick={clearFilters}><X className="mr-2 h-4 w-4"/>Clear</Button>}
          </div>
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
              ) : paginatedEntries.length > 0 ? (
                paginatedEntries.map((entry) => (
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
        {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                </div>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
