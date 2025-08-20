
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
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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
import type { PurchaseOrder, Supplier } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocation } from '@/components/location-provider';

const getStatusText = (status: string) => {
  switch (status) {
    case '0':
      return 'Pending';
    case '1':
      return 'Approved';
    case '2':
      return 'Rejected';
    case '3':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case '0': // Pending
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case '1': // Approved
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case '2': // Rejected
    case '3': // Cancelled
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};


export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const { company_id } = useLocation();
  const itemsPerPage = 15;

  useEffect(() => {
    async function fetchData() {
        if (!company_id) {
            setIsLoading(false);
            return;
        }
      setIsLoading(true);
      try {
        const [poResponse, suppliersResponse] = await Promise.all([
          fetch(`https://server-erp.payshia.com/purchase-orders/filter/?company_id=${company_id}`),
          fetch(`https://server-erp.payshia.com/suppliers/filter/by-company?company_id=${company_id}`)
        ]);

        if (!poResponse.ok) {
          throw new Error('Failed to fetch purchase orders');
        }
        if (!suppliersResponse.ok) {
           throw new Error('Failed to fetch suppliers');
        }

        const poData = await poResponse.json();
        const suppliersData = await suppliersResponse.json();
        
        setPurchaseOrders(Array.isArray(poData) ? poData : []);
        setSuppliers(suppliersData);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
          variant: 'destructive',
          title: 'Failed to load data',
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast, company_id]);

  const getSupplierName = (supplierId: string) => {
    return suppliers.find(s => s.supplier_id === supplierId)?.supplier_name || `ID: ${supplierId}`;
  }
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = purchaseOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(purchaseOrders.length / itemsPerPage);

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
          <ScrollArea className="h-[calc(100vh-350px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
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
                          <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                      </TableRow>
                  ))
                ) : (
                  currentItems.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{getSupplierName(po.supplier_id)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className={cn(getStatusColor(po.po_status))}>
                          {getStatusText(po.po_status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{new Date(po.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">${parseFloat(po.sub_total).toFixed(2)}</TableCell>
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
                              <Link href={`/purchasing/purchase-orders/${po.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            {po.po_status === '1' && ( // Only show if Approved
                              <DropdownMenuItem asChild>
                                <Link href={`/purchasing/grn/new?poId=${po.id}`}>Create GRN</Link>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
         <CardFooter className="flex justify-end items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Page</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                 <span className="sr-only">Next Page</span>
              </Button>
            </div>
          </CardFooter>
      </Card>
    </div>
  );
}
