
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Order, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/components/location-provider';
import { Skeleton } from '@/components/ui/skeleton';

const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'Processing':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'Shipped':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
    case 'Delivered':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

export default function OrdersPage() {
    const { toast } = useToast();
    const { company_id } = useLocation();
    const [orders, setOrders] = useState<Order[]>([]);
    const [customers, setCustomers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!company_id) {
            setIsLoading(false);
            return;
        }

        async function fetchData() {
            setIsLoading(true);
            try {
                const [ordersResponse, customersResponse] = await Promise.all([
                    fetch(`https://server-erp.payshia.com/orders/company?company_id=${company_id}`),
                    fetch('https://server-erp.payshia.com/customers')
                ]);

                if (!ordersResponse.ok) throw new Error('Failed to fetch orders');
                if (!customersResponse.ok) throw new Error('Failed to fetch customers');

                const ordersData = await ordersResponse.json();
                const customersData = await customersResponse.json();

                setOrders(ordersData || []);
                setCustomers(customersData || []);

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
    }, [company_id, toast]);

    const getCustomerName = (customerId: string) => {
        const customer = customers.find(c => c.customer_id === customerId);
        return customer ? `${customer.customer_first_name} ${customer.customer_last_name}` : customerId;
    }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Processing</h1>
          <p className="text-muted-foreground">
            View and manage orders from all sales channels.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            A list of the most recent orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
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
                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))
                ) : orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium">{order.id}</div>
                      <div className="text-sm text-muted-foreground">{getCustomerName(order.customerName)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn(getStatusColor(order.status))}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.channel}</Badge>
                    </TableCell>
                    <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      ${(order.total || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => console.log(`Viewing details for ${order.id}`)}>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Process Shipment</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-4">
             {isLoading ? (
                 Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
            ) : orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{order.id}</CardTitle>
                      <CardDescription>{getCustomerName(order.customerName)}</CardDescription>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => console.log(`Viewing details for ${order.id}`)}>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Process Shipment</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                   <Badge variant="secondary" className={cn(getStatusColor(order.status))}>
                      {order.status}
                    </Badge>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Channel</span>
                      <span><Badge variant="outline">{order.channel}</Badge></span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date</span>
                      <span>{new Date(order.date).toLocaleDateString()}</span>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/50 p-4">
                  <div className="flex justify-between w-full font-semibold">
                      <span>Total</span>
                      <span>${(order.total || 0).toFixed(2)}</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    