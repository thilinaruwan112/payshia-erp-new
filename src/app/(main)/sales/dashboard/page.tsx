
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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
            const [ordersRes, productsRes, invoicesRes] = await Promise.all([
                fetch(`https://server-erp.payshia.com/orders/company?company_id=${company_id}`),
                fetch(`https://server-erp.payshia.com/products/get/filter/by-company?company_id=${company_id}`),
                fetch(`https://server-erp.payshia.com/invoices?company_id=${company_id}`),
            ]);
            if (!ordersRes.ok) throw new Error('Failed to fetch orders');
            if (!productsRes.ok) throw new Error('Failed to fetch products');
            if (!invoicesRes.ok) throw new Error('Failed to fetch invoices');

            setOrders(await ordersRes.json());
            setProducts(await productsRes.json());
            setInvoices(await invoicesRes.json());
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch sales dashboard data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [company_id, toast]);
    
  const salesStats = useMemo(() => {
    const relevantOrders = orders.filter((o) => o.status !== 'Cancelled');
    const totalRevenue = relevantOrders.reduce((acc, order) => acc + (order.total || 0), 0);
    const totalOrders = relevantOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const topSellingProducts = [...orders]
      .flatMap(o => o.items)
      .reduce((acc, item) => {
        const existing = acc.find(p => p.sku === item.sku);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          acc.push({ sku: item.sku, quantity: item.quantity });
        }
        return acc;
      }, [] as { sku: string; quantity: number }[])
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(item => {
        const product = products.find(p => p.variants.some(v => v.sku === item.sku));
        return { ...item, name: product?.name || item.sku };
      });

    return { totalRevenue, totalOrders, avgOrderValue, topSellingProducts };
  }, [orders, products]);
  
  const salesChartData = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    const relevantOrders = orders.filter((order) =>
      isAfter(new Date(order.date), sevenDaysAgo)
    );

    const dailySales = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const date = format(addDays(sevenDaysAgo, i + 1), 'yyyy-MM-dd');
      dailySales.set(date, 0);
    }

    relevantOrders.forEach((order) => {
      if (order.status !== 'Cancelled') {
        const date = format(new Date(order.date), 'yyyy-MM-dd');
        dailySales.set(date, (dailySales.get(date) || 0) + (order.total || 0));
      }
    });

    return Array.from(dailySales.entries()).map(([date, total]) => ({
      name: format(new Date(date), 'MMM d'),
      total,
    }));
  }, [orders]);
  

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
                    {isLoading ? <Skeleton className="h-7 w-32" /> : <div className="text-2xl font-bold">{currencySymbol}{salesStats.totalRevenue.toFixed(2)}</div>}
                    <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">+{salesStats.totalOrders}</div>}
                    <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-7 w-24" /> : <div className="text-2xl font-bold">{currencySymbol}{salesStats.avgOrderValue.toFixed(2)}</div>}
                    <p className="text-xs text-muted-foreground">+19% from last month</p>
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
            <CardContent>
              {isLoading ? <Skeleton className="h-[350px]" /> : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={salesChartData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${currencySymbol}${value}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number) => [value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('$', currencySymbol), "Revenue"]}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Your best-performing products by quantity sold.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Quantity Sold</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? Array.from({length: 5}).map((_, i) => (
                           <TableRow key={i}>
                               <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                               <TableCell className="text-right"><Skeleton className="h-4 w-12" /></TableCell>
                           </TableRow>
                        )) : salesStats.topSellingProducts.map(item => (
                            <TableRow key={item.sku}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
