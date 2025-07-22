
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
import { users, orders } from '@/lib/data';
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
import type { User } from '@/lib/types';

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
  const customers = users.filter((user) => user.role === 'Customer');

  const customerData = customers.map((customer) => {
    const customerOrders = orders.filter(
      (order) => order.customerName === customer.name
    );
    const totalSpent = customerOrders.reduce(
      (acc, order) => acc + order.total,
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
              {customerData.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={customer.avatar} alt={customer.name} data-ai-hint="profile picture"/>
                        <AvatarFallback>
                          {customer.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{customer.role}</span>
                           <span className="text-xs">&bull;</span>
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
                    ${customer.totalSpent.toFixed(2)}
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
                          <Link href={`/crm/customers/${customer.id}/edit`}>
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
