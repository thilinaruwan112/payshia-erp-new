
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
  Users,
  Star,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useCurrency } from '@/components/currency-provider';
import Link from 'next/link';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import type { Order, User, EmailCampaign, SmsCampaign } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function CrmDashboardPage() {
  const { currencySymbol } = useCurrency();
  const { company_id } = useLocation();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [emailCampaigns, setEmailCampaigns] = useState<EmailCampaign[]>([]);
  const [smsCampaigns, setSmsCampaigns] = useState<SmsCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!company_id) {
        setIsLoading(false);
        return;
    }
    async function fetchData() {
        setIsLoading(true);
        try {
            const [ordersRes, usersRes, emailRes, smsRes] = await Promise.all([
                fetch(`https://server-erp.payshia.com/orders/company?company_id=${company_id}`),
                fetch(`https://server-erp.payshia.com/customers/company/filter/?company_id=${company_id}`),
                // Mocking campaign fetches as endpoints don't exist
                Promise.resolve({ json: () => import('@/lib/mock-data/email-campaigns').then(m => m.emailCampaigns) }),
                Promise.resolve({ json: () => import('@/lib/mock-data/sms-campaigns').then(m => m.smsCampaigns) }),
            ]);

            if (!ordersRes.ok) throw new Error('Failed to fetch orders');
            if (!usersRes.ok) throw new Error('Failed to fetch users');
            
            setOrders(await ordersRes.json());
            setUsers(await usersRes.json());
            setEmailCampaigns(await emailRes.json());
            setSmsCampaigns(await smsRes.json());

        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch CRM dashboard data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [company_id, toast]);
    
  const customerStats = useMemo(() => {
    const totalCustomers = users.filter(u => u.role === 'Customer').length;
    const totalSpent = orders.reduce((acc, order) => acc + (order.total || 0), 0);
    const avgLifetimeValue = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

    const topCustomers = [...orders]
        .reduce((acc, order) => {
            const existing = acc.find((c) => c.name === order.customerName);
            if (existing) {
                existing.totalSpent += (order.total || 0);
            } else {
                acc.push({
                    name: order.customerName,
                    totalSpent: (order.total || 0),
                });
            }
            return acc;
        }, [] as { name: string; totalSpent: number }[])
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);
    
    return { totalCustomers, avgLifetimeValue, topCustomers };
  }, [orders, users]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CRM Dashboard</h1>
        <p className="text-muted-foreground">
          Insights into your customer relationships.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{customerStats.totalCustomers}</div>}
                    <p className="text-xs text-muted-foreground">Total customers in the system</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Lifetime Value</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-7 w-24" /> : <div className="text-2xl font-bold">{currencySymbol}{customerStats.avgLifetimeValue.toFixed(2)}</div>}
                    <p className="text-xs text-muted-foreground">Average total spend per customer</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Email Campaigns</CardTitle>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{emailCampaigns.length}</div>}
                    <p className="text-xs text-muted-foreground">
                       <Link href="/crm/email-campaigns" className="hover:underline">
                            View all campaigns
                        </Link>
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">SMS Campaigns</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{smsCampaigns.length}</div>}
                     <p className="text-xs text-muted-foreground">
                        <Link href="/crm/sms-campaigns" className="hover:underline">
                            View all campaigns
                        </Link>
                    </p>
                </CardContent>
            </Card>
      </div>

       <Card>
            <CardHeader>
                <CardTitle>Top Customers by Spending</CardTitle>
                <CardDescription>Your most valuable customers based on total purchase amount.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">Total Spent</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? Array.from({length: 5}).map((_, i) => (
                           <TableRow key={i}>
                               <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                               <TableCell className="text-right"><Skeleton className="h-4 w-20" /></TableCell>
                           </TableRow>
                        )) : customerStats.topCustomers.map(customer => (
                            <TableRow key={customer.name}>
                                <TableCell className="font-medium">{customer.name}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{customer.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
