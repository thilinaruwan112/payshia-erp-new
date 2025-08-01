
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
import Link from 'next/link';
import type { GoodsReceivedNote, Supplier, SupplierReturn } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supplierReturns } from '@/lib/data';

export default function SupplierReturnsPage() {
  const [grns, setGrns] = useState<GoodsReceivedNote[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [grnResponse, suppliersResponse] = await Promise.all([
          fetch('https://server-erp.payshia.com/grn'),
          fetch('https://server-erp.payshia.com/suppliers')
        ]);

        if (!grnResponse.ok) throw new Error('Failed to fetch GRNs');
        if (!suppliersResponse.ok) throw new Error('Failed to fetch suppliers');

        const grnData = await grnResponse.json();
        const suppliersData = await suppliersResponse.json();
        
        setGrns(grnData || []);
        setSuppliers(suppliersData || []);

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
  }, [toast]);

  const getSupplierName = (supplierId: string) => {
    return suppliers.find(s => s.supplier_id === supplierId)?.supplier_name || `ID: ${supplierId}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supplier Returns</h1>
          <p className="text-muted-foreground">
            Manage returns of goods to your suppliers.
          </p>
        </div>
      </div>
        <Tabs defaultValue="create">
            <TabsList>
                <TabsTrigger value="create">Create Return</TabsTrigger>
                <TabsTrigger value="history">Return History</TabsTrigger>
            </TabsList>
            <TabsContent value="create">
                 <Card>
                    <CardHeader>
                        <CardTitle>Select a GRN to Return</CardTitle>
                        <CardDescription>
                            Choose a Goods Received Note to initiate a return process.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>GRN Number</TableHead>
                            <TableHead>Supplier</TableHead>
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
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-24 rounded-md" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            grns.map((grn) => (
                            <TableRow key={grn.id}>
                                <TableCell className="font-medium">{grn.grn_number}</TableCell>
                                <TableCell>{getSupplierName(grn.supplier_id)}</TableCell>
                                <TableCell className="hidden md:table-cell">{format(new Date(grn.created_at), 'dd MMM, yyyy')}</TableCell>
                                <TableCell className="text-right">${parseFloat(grn.grand_total).toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/suppliers/returns/new?grnId=${grn.id}`}>Create Return</Link>
                                </Button>
                                </TableCell>
                            </TableRow>
                            ))
                        )}
                        {!isLoading && grns.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No GRNs found.
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
                        <CardTitle>Supplier Return History</CardTitle>
                        <CardDescription>A log of all past supplier returns.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Return ID</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>GRN Ref.</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Value</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {supplierReturns.map((sReturn) => (
                                    <TableRow key={sReturn.id}>
                                        <TableCell className="font-medium">{sReturn.id}</TableCell>
                                        <TableCell>{sReturn.supplierName}</TableCell>
                                        <TableCell>{sReturn.grnId}</TableCell>
                                        <TableCell>{new Date(sReturn.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right font-mono">${sReturn.totalValue.toFixed(2)}</TableCell>
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
                                                        <Link href={`/suppliers/returns/${sReturn.id}`}>View Details</Link>
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
            </TabsContent>
        </Tabs>
    </div>
  );
}
