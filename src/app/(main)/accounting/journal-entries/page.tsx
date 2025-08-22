

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

const journalEntries: JournalEntry[] = [
    {
        id: 'JE-001',
        date: '2023-10-01',
        narration: 'To record monthly office rent for September.',
        totalDebit: 1200,
        totalCredit: 1200,
        lines: [
            { accountCode: 6100, accountName: 'Rent Expense', debit: 1200, credit: 0 },
            { accountCode: 1010, accountName: 'Cash', debit: 0, credit: 1200 },
        ]
    },
    {
        id: 'JE-002',
        date: '2023-10-05',
        narration: 'To record purchase of office supplies on credit.',
        totalDebit: 250,
        totalCredit: 250,
        lines: [
            { accountCode: 6200, accountName: 'Office Supplies Expense', debit: 250, credit: 0 },
            { accountCode: 2010, accountName: 'Accounts Payable', debit: 0, credit: 250 },
        ]
    },
    {
        id: 'JE-003',
        date: '2023-10-15',
        narration: 'Owner investment into the company.',
        totalDebit: 5000,
        totalCredit: 5000,
        lines: [
            { accountCode: 1010, accountName: 'Cash', debit: 5000, credit: 0 },
            { accountCode: 3010, accountName: 'Owner\'s Equity', debit: 0, credit: 5000 },
        ]
    },
];


export default function JournalEntriesPage() {
    const { currencySymbol } = useCurrency();
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
                <TableHead>Entry ID</TableHead>
                <TableHead className="hidden sm:table-cell">Narration</TableHead>
                <TableHead className="text-right">Debits</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journalEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-mono">{entry.id}</TableCell>
                  <TableCell className="hidden sm:table-cell max-w-sm truncate">{entry.narration}</TableCell>
                  <TableCell className="text-right font-mono">{currencySymbol}{entry.totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right font-mono">{currencySymbol}{entry.totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
                        <DropdownMenuItem onSelect={() => console.log(`Viewing details for ${entry.id}`)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Reverse Entry
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
