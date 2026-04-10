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
import type { Supplier } from '@/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/components/location-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { fetcher } from '@/lib/api';

interface SupplierPayment {
    id: string;
    company_id: string;
    grn_number: string;
    suppliar_id: string;
    date_of_payment: string;
    total_amount: string;
    is_active: string;
    created_at: string;
    updated_at: string;
}

export default function PaymentsPage() {
    const { currencySymbol } = useCurrency();
    const { toast } = useToast();
    const { company_id } = useLocation();
    const [payments, setPayments] = useState<SupplierPayment[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!company_id) {
            setIsLoading(false);
            return;
        }
        async function fetchPaymentsData() {
            setIsLoading(true);
            try {
                const [paymentsRes, suppliersRes] = await Promise.all([
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliar-payment/company?company_id=${company_id}`),
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/filter/by-company?company_id=${company_id}`),
                ]);

                if (!paymentsRes.ok) throw new Error('Failed to fetch payments');
                if (!suppliersRes.ok) throw new Error('Failed to fetch suppliers');
                
                const paymentsData = await paymentsRes.json();
                const suppliersData = await suppliersRes.json();
                
                setPayments(paymentsData || []);
                setSuppliers(suppliersData || []);

            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch payments.' });
            } finally {
                setIsLoading(false);
            }
        }
        fetchPaymentsData();
    }, [company_id, toast]);
    
    const getSupplierName = (supplierId: string) => suppliers.find(s => s.supplier_id === supplierId)?.supplier_name || 'N/A';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Record and manage payments made to suppliers.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/suppliers/payments/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Payment
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>
            A list of recent payments made.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="hidden sm:table-cell">GRN Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))
              ) : payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.date_of_payment).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{getSupplierName(payment.suppliar_id)}</TableCell>
                  <TableCell className="hidden sm:table-cell">{payment.grn_number || 'N/A'}</TableCell>
                  <TableCell className="text-right font-mono">{currencySymbol}{(parseFloat(payment.total_amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
                        <DropdownMenuItem onSelect={() => console.log(`Viewing details for ${payment.id}`)}>View Details</DropdownMenuItem>
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
