
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
import { MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PurchaseOrder, Supplier, GoodsReceivedNote } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
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
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};


export default function GrnReceivablePage() {
  const [receivablePOs, setReceivablePOs] = useState<PurchaseOrder[]>([]);
  const [grns, setGrns] = useState<GoodsReceivedNote[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const { company_id } = useLocation();

  useEffect(() => {
    async function fetchData() {
       if (!company_id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [poResponse, suppliersResponse, grnResponse] = await Promise.all([
          fetch(`https://server-erp.payshia.com/purchase-orders/filter/company?company_id=${company_id}`),
          fetch(`https://server-erp.payshia.com/suppliers/filter/by-company?company_id=${company_id}`),
          fetch(`https://server-erp.payshia.com/grn/company/${company_id}`),
        ]);

        if (!poResponse.ok) throw new Error('Failed to fetch purchase orders');
        if (!suppliersResponse.ok) throw new Error('Failed to fetch suppliers');
        if (!grnResponse.ok) throw new Error('Failed to fetch GRNs');

        const poData: PurchaseOrder[] = await poResponse.json();
        const suppliersData: Supplier[] = await suppliersResponse.json();
        const grnData: GoodsReceivedNote[] = await grnResponse.json();
        
        setReceivablePOs(poData);
        setSuppliers(suppliersData);
        setGrns(grnData || []);

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

  const indexOfLastGrn = currentPage * itemsPerPage;
  const indexOfFirstGrn = indexOfLastGrn - itemsPerPage;
  const currentGrns = grns.slice(indexOfFirstGrn, indexOfLastGrn);
  const totalGrnPages = Math.ceil(grns.length / itemsPerPage);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goods Received Notes (GRN)</h1>
          <p className="text-muted-foreground">
            Record incoming inventory and view past GRNs.
          </p>
        </div>
      </div>

      <Tabs defaultValue="receivable">
        <TabsList>
            <TabsTrigger value="receivable">Receivable POs</TabsTrigger>
            <TabsTrigger value="history">GRN History</TabsTrigger>
        </TabsList>
        <TabsContent value="receivable">
            <Card>
                <CardHeader>
                <CardTitle>Receivable Purchase Orders</CardTitle>
                <CardDescription>
                    Select a PO to record the received goods against it.
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
                        receivablePOs.map((po) => (
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
                                    <Link href={`/purchasing/grn/new?poId=${po.id}`}>Create GRN</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={`/purchasing/purchase-orders/${po.id}`}>View Details</Link>
                                </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))
                    )}
                    {!isLoading && receivablePOs.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No receivable purchase orders found.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="history">
            <Card>
                <CardHeader>
                <CardTitle>All GRNs</CardTitle>
                <CardDescription>
                    Browse and review previously created GRNs.
                </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-450px)]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>GRN Number</TableHead>
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
                            currentGrns.map((grn) => (
                            <TableRow key={grn.id}>
                                <TableCell className="font-medium">{grn.grn_number}</TableCell>
                                <TableCell>{getSupplierName(grn.supplier_id)}</TableCell>
                                <TableCell className="hidden sm:table-cell">
                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    {grn.grn_status}
                                </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">{format(new Date(grn.created_at), 'dd MMM, yyyy')}</TableCell>
                                <TableCell className="text-right">${parseFloat(grn.grand_total).toFixed(2)}</TableCell>
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
                                        <Link href={`/purchasing/grn/${grn.id}`}>View Details</Link>
                                    </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                </TableCell>
                            </TableRow>
                            ))
                        )}
                        {!isLoading && grns.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No GRNs found.
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
                 <CardFooter className="flex justify-end items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalGrnPages}
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
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalGrnPages))}
                        disabled={currentPage === totalGrnPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next Page</span>
                    </Button>
                    </div>
                </CardFooter>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    