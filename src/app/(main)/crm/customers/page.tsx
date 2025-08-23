
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
import { MoreHorizontal, PlusCircle, Star, Trash2 } from 'lucide-react';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';


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
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);

  useEffect(() => {
    if (!company_id) {
      setIsLoading(false);
      return;
    }
    async function fetchData() {
        setIsLoading(true);
        try {
            const [customersRes] = await Promise.all([
                fetch(`https://server-erp.payshia.com/customers/company/filter/?company_id=${company_id}`),
            ]);
            if (!customersRes.ok) throw new Error('Failed to fetch customers');
            
            const customersData = await customersRes.json();
            setCustomers(customersData || []);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch customer data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [company_id, toast]);
  
  const handleDelete = async () => {
    if (!selectedCustomer) return;
    try {
        const response = await fetch(`https://server-erp.payshia.com/customers/${selectedCustomer.customer_id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete customer');
        }
        setCustomers(customers.filter(c => c.customer_id !== selectedCustomer.customer_id));
        toast({
            title: 'Customer Deleted',
            description: `The customer "${selectedCustomer.customer_first_name}" has been deleted.`
        })
    } catch (error) {
         const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
         toast({
            variant: 'destructive',
            title: 'Error deleting customer',
            description: errorMessage
        });
    } finally {
        setIsConfirmOpen(false);
        setSelectedCustomer(null);
    }
  };


  const customerData = useMemo(() => {
    return customers.map((customer) => {
      const loyaltyTier = getLoyaltyTier(customer.loyaltyPoints || 0);
      return {
        ...customer,
        loyaltyTier,
      };
    });
  }, [customers]);

  return (
    <>
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
                <TableHead className="hidden md:table-cell">
                  Loyalty Tier
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
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
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
                  <TableCell className="hidden md:table-cell">
                     <Badge variant="outline" className={cn('font-semibold', getTierColor(customer.loyaltyTier))}>
                        <Star className="mr-1.5 h-3.5 w-3.5" />
                        {customer.loyaltyTier}
                    </Badge>
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
                        <DropdownMenuItem 
                            className="text-destructive"
                            onSelect={() => {
                                setSelectedCustomer(customer);
                                setIsConfirmOpen(true);
                            }}
                        >
                           <Trash2 className="mr-2 h-4 w-4" />
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
    <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the customer {' '}
                    <span className="font-bold text-foreground">{selectedCustomer?.customer_first_name} {selectedCustomer?.customer_last_name}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedCustomer(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

