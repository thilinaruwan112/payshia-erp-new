
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
import { Badge } from '@/components/ui/badge';
import type { User } from '@/lib/types';
import { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from '@/components/location-provider';
import { useCurrency } from '@/components/currency-provider';
import { fetcher } from '@/lib/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface QuotationItem {
  id: string;
  total: string;
}

interface Quotation {
  id: string;
  customer_id: string;
  quatation_date: string;
  expire_date: string;
  is_active: string;
  items: QuotationItem[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case '1':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case '2':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case '3':
       return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  }
};

const getStatusText = (status: string): string => {
    switch (status) {
        case '1': return 'Sent';
        case '2': return 'Accepted';
        case '3': return 'Rejected';
        default: return 'Draft';
    }
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { company_id } = useLocation();
  const { currencySymbol } = useCurrency();

  useEffect(() => {
    async function fetchData() {
        if (!company_id) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [quotationResponse, customerResponse] = await Promise.all([
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/quotations/filter/by-company?company_id=${company_id}&include_items=true`),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers`),
            ]);

            if (!quotationResponse.ok) throw new Error('Failed to fetch quotations');
            if (!customerResponse.ok) throw new Error('Failed to fetch customers');

            const quotationData = await quotationResponse.json();
            const customerData = await customerResponse.json();
            setQuotations(quotationData || []);
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
  }, [toast, company_id]);
  
  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.customer_id === customerId);
    return customer ? `${customer.customer_first_name} ${customer.customer_last_name}` : `ID: ${customerId}`;
  }

  const calculateTotal = (items: QuotationItem[]) => {
      return items.reduce((acc, item) => acc + parseFloat(item.total), 0);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotations</h1>
          <p className="text-muted-foreground">
            Manage your customer price quotations.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/sales/quotation/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Quotation
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Quotations</CardTitle>
          <CardDescription>
            A list of all quotations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
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
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                      </TableRow>
                  ))
                ) : (
                  quotations.map((quote) => {
                    const statusText = getStatusText(quote.is_active);
                    const total = calculateTotal(quote.items || []);
                    return (
                      <TableRow key={quote.id}>
                        <TableCell className="font-medium">QTN-{quote.id}</TableCell>
                        <TableCell>{getCustomerName(quote.customer_id)}</TableCell>
                        <TableCell>{format(new Date(quote.quatation_date), 'dd MMM, yyyy')}</TableCell>
                        <TableCell>{format(new Date(quote.expire_date), 'dd MMM, yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn(getStatusColor(quote.is_active))}>
                            {statusText}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{currencySymbol}{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
                                <Link href={`/sales/quotation/${quote.id}`}>View Details</Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
                 {!isLoading && quotations.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                          No quotations found.
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
