

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
import type { Expense } from '@/lib/types';
import React from 'react';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExpensesPage() {
    const { currencySymbol } = useCurrency();
    const { company_id } = useLocation();
    const { toast } = useToast();
    const [expenses, setExpenses] = React.useState<Expense[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (!company_id) {
            setIsLoading(false);
            return;
        }
        async function fetchExpenses() {
            setIsLoading(true);
            try {
                const response = await fetch(`https://server-erp.payshia.com/expenses/company?company_id=${company_id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch expenses');
                }
                const data = await response.json();
                setExpenses(data);
            } catch (error) {
                 toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch expenses data.'
                })
            } finally {
                setIsLoading(false);
            }
        }
        fetchExpenses();
    }, [company_id, toast]);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Record and manage your business expenses.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/accounting/expenses/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Expense
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>
            A list of recent business expenses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Payee</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
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
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))
              ) : expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{expense.payee}</TableCell>
                  <TableCell className="hidden sm:table-cell">{expense.expenseAccountName}</TableCell>
                  <TableCell className="text-right font-mono">{currencySymbol}{(expense.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete
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
