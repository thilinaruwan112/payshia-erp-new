
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
import { MoreHorizontal, PlusCircle, Star } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { User, Order } from '@/lib/types';
import { useCurrency } from '@/components/currency-provider';
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const getLoyaltyTier = (points: number) => {
  if (points >= 500) return 'Platinum';
  if (points >= 250) return 'Gold';
  if (points >= 100) return 'Silver';
  return 'Bronze';
};

type LoyaltyTier = ReturnType<typeof getLoyaltyTier>;

const getTierColor = (tier: LoyaltyTier) => {
  switch (tier) {
    case 'Platinum':
      return 'bg-purple-200 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700';
    case 'Gold':
      return 'bg-yellow-200 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700';
    case 'Silver':
      return 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600';
    default: // Bronze
      return 'bg-orange-200 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700';
  }
};


export default function CustomersPage() {
  const { currencySymbol } = useCurrency();
  const { company_id } = useLocation();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!company_id) {
      setIsLoading(false);
      return;
    }
    async function fetchData() {
        setIsLoading(true);
        try {
            const [customersRes, ordersRes] = await Promise.all([
                fetch(`https://server-erp.payshia.com/customers/company/filter/?company_id=${company_id}`),
                fetch(`https://server-erp.payshia.com/orders/company?company_id=${company_id}`)
            ]);
            if (!customersRes.ok) throw new Error('Failed to fetch customers');
            if (!ordersRes.ok) throw new Error('Failed to fetch orders');
            
            const customersData = await customersRes.json();
            const ordersData = await ordersRes.json();
            setCustomers(customersData || []);
            setOrders(ordersData || []);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch customer data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [company_id, toast]);


  const customerData = useMemo(() => {
    return customers.map((customer) => {
      const customerOrders = orders.filter(
        (order) => order.customerName === customer.customer_id
      );
      const totalSpent = customerOrders.reduce(
        (acc, order) => acc + (order.total || 0),
        0
      );
      const loyaltyTier = getLoyaltyTier(customer.loyaltyPoints || 0);
      return {
        ...customer,
        orderCount: customerOrders.length,
        totalSpent,
        loyaltyTier,
      };
    });
  }, [customers, orders]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer database and loyalty program.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/crm/customers/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Customer
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            A list of all customers in your system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Total Orders
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Loyalty Tier
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Total Spent
                </TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-12 rounded-full mx-auto" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))
              ) : customerData.map((customer) => (
                <TableRow key={customer.customer_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={customer.avatar} alt={customer.name} data-ai-hint="profile picture"/>
                        <AvatarFallback>
                          {customer.customer_first_name?.charAt(0)}{customer.customer_last_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{customer.customer_first_name} {customer.customer_last_name}</p>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                           <span className={cn("font-semibold", getTierColor(customer.loyaltyTier).split(' ')[1])}>{customer.loyaltyTier}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-center">
                    <Badge variant="secondary">{customer.orderCount}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                     <Badge variant="outline" className={cn('font-semibold', getTierColor(customer.loyaltyTier))}>
                        <Star className="mr-1.5 h-3.5 w-3.5" />
                        {customer.loyaltyTier}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono">
                    {currencySymbol}{customer.totalSpent.toFixed(2)}
                  </TableCell>
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
                          <Link href={`/crm/customers/${customer.customer_id}/edit`}>
                            Edit
                          </Link>
                        </DropdownMenuItem>
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
