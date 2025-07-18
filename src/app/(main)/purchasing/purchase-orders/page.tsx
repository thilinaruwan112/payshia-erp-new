
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
import { purchaseOrders } from '@/lib/data';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PurchaseOrder } from '@/lib/types';

const getStatusColor = (status: PurchaseOrder['status']) => {
  switch (status) {
    case 'Draft':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case 'Sent':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'Partial':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'Received':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};


export default function PurchaseOrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Create and manage purchase orders for your suppliers.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/purchasing/purchase-orders/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New PO
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Purchase Orders</CardTitle>
          <CardDescription>
            A list of all POs sent to suppliers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Expected</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">{po.id}</TableCell>
                  <TableCell>{po.supplierName}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary" className={cn(getStatusColor(po.status))}>
                      {po.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{new Date(po.date).toLocaleDateString()}</TableCell>
                  <TableCell className="hidden md:table-cell">{new Date(po.expectedDelivery).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">${po.total.toFixed(2)}</TableCell>
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
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Create GRN</DropdownMenuItem>
                         <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                           <Link href={`/accounting/payments/new?poId=${po.id}&supplierId=${po.supplierId}&amount=${po.total}`}>
                            Record Payment
                           </Link>
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
