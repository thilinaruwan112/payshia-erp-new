
'use client'

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
import { Badge } from '@/components/ui/badge';
import type { User } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

type Receipt = {
    id: string;
    rec_number: string;
    type: string;
    is_active: string;
    date: string;
    amount: string;
    created_by: string;
    ref_id: string;
    location_id: string;
    customer_id: string;
    today_invoice: string;
    company_id: string;
    now_time: string;
};

export default function ReceiptsPage() {
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [customers, setCustomers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const [receiptResponse, customerResponse] = await Promise.all([
                    fetch('https://server-erp.payshia.com/receipts/company/1'),
                    fetch('https://server-erp.payshia.com/customers'),
                ]);

                if (!receiptResponse.ok) throw new Error('Failed to fetch receipts');
                if (!customerResponse.ok) throw new Error('Failed to fetch customers');

                const receiptData = await receiptResponse.json();
                const customerData = await customerResponse.json();
                setReceipts(receiptData || []);
                setCustomers(customerData || []);

            } catch (error) {
                 const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                 toast({
                    variant: 'destructive',
                    title: 'Failed to load data',
                    description: errorMessage
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [toast]);
    
    const getCustomerName = (customerId: string) => {
        const customer = customers.find(c => c.customer_id === customerId);
        return customer ? `${customer.customer_first_name} ${customer.customer_last_name}` : `ID: ${customerId}`;
    }

    const getPaymentMethodText = (type: string) => {
        switch (type) {
            case '0': return 'Cash';
            case '1': return 'Card';
            case '2': return 'Bank Transfer';
            default: return type;
        }
    }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Receipts</h1>
          <p className="text-muted-foreground">
            Manage your customer payment receipts.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/sales/receipts/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Receipt
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Receipts</CardTitle>
          <CardDescription>
            A list of all payment receipts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden sm:table-cell">Invoice #</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                    </TableRow>
                ))
              ) : (
                receipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium">{receipt.rec_number}</TableCell>
                    <TableCell>{getCustomerName(receipt.customer_id)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{receipt.ref_id}</TableCell>
                    <TableCell className="hidden md:table-cell">{format(new Date(receipt.date), 'dd MMM, yyyy')}</TableCell>
                    <TableCell className="hidden md:table-cell">
                       <Badge variant="secondary">{getPaymentMethodText(receipt.type)}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">${parseFloat(receipt.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
                          <DropdownMenuItem asChild>
                            <Link href={`/sales/receipts/${receipt.id}`}>View Details</Link>
                          </DropdownMenuItem>
                           <DropdownMenuItem asChild>
                            <Link href={`/sales/receipts/${receipt.id}/print`} target="_blank">Print A4 Receipt</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/pos/receipt/${receipt.id}/print`} target="_blank">Print POS Receipt</Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
               {!isLoading && receipts.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        No receipts found.
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
