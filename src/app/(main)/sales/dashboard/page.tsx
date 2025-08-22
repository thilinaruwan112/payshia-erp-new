
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
import {
  DollarSign,
  ShoppingCart,
  CreditCard,
  FileText
} from 'lucide-react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { addDays, format, isAfter, subDays } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';
import { useCurrency } from '@/components/currency-provider';
import Link from 'next/link';
import type { Order, Product, Invoice } from '@/lib/types';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


export default function SalesDashboardPage() {
  const { currencySymbol } = useCurrency();
  const { company_id } = useLocation();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!company_id) {
        setIsLoading(false);
        return;
    }
    async function fetchData() {
        setIsLoading(true);
        try {
            const [invoicesRes] = await Promise.all([
                fetch(`https://server-erp.payshia.com/invoices?company_id=${company_id}`),
            ]);
            if (!invoicesRes.ok) throw new Error('Failed to fetch invoices');

            setInvoices(await invoicesRes.json());
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch sales dashboard data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [company_id, toast]);
    
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Dashboard</h1>
        <p className="text-muted-foreground">
          An overview of your sales performance.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-7 w-32" /> : <div className="text-2xl font-bold">{currencySymbol}0.00</div>}
                    <p className="text-xs text-muted-foreground">Order data unavailable</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">0</div>}
                    <p className="text-xs text-muted-foreground">Order data unavailable</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-7 w-24" /> : <div className="text-2xl font-bold">{currencySymbol}0.00</div>}
                    <p className="text-xs text-muted-foreground">Order data unavailable</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{invoices.length}</div>}
                    <p className="text-xs text-muted-foreground">
                        <Link href="/sales/invoices" className="hover:underline">View all invoices</Link>
                    </p>
                </CardContent>
            </Card>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Sales Over Time</CardTitle>
                <CardDescription>Revenue from the past 7 days.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[350px] text-muted-foreground">
              {isLoading ? <Skeleton className="h-[350px]" /> : <p>Order data is currently unavailable.</p>}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Your best-performing products by quantity sold.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[350px] text-muted-foreground">
                {isLoading ? <Skeleton className="h-[350px]" /> : <p>Order data is currently unavailable.</p>}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
