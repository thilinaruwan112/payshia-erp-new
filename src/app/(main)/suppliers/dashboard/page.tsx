

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
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FileText,
  Truck,
  DollarSign
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useCurrency } from '@/components/currency-provider';
import Link from 'next/link';
import type { Supplier, PurchaseOrder, GoodsReceivedNote, PaymentReceipt } from '@/lib/types';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function SupplierDashboardPage() {
  const { currencySymbol } = useCurrency();
  const { company_id } = useLocation();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [grns, setGrns] = useState<GoodsReceivedNote[]>([]);
  const [payments, setPayments] = useState<PaymentReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!company_id) {
        setIsLoading(false);
        return;
    }
    async function fetchData() {
        setIsLoading(true);
        try {
            const [suppliersRes, poRes, grnRes] = await Promise.all([
                fetch(`https://server-erp.payshia.com/suppliers/filter/by-company?company_id=${company_id}`),
                fetch(`https://server-erp.payshia.com/purchase-orders/filter/?company_id=${company_id}`),
                fetch(`https://server-erp.payshia.com/grn/company/${company_id}`),
            ]);

            if (!suppliersRes.ok || !poRes.ok || !grnRes.ok) {
                throw new Error('Failed to fetch supplier dashboard data');
            }

            setSuppliers(await suppliersRes.json());
            setPurchaseOrders(await poRes.json());
            setGrns(await grnRes.json());
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch supplier dashboard data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [company_id, toast]);
    
  const supplierStats = useMemo(() => {
    const totalSuppliers = suppliers.length;
    
    // This is a simplified calculation. A real system would have better payment tracking.
    const totalOwed = purchaseOrders
        .filter(po => po.po_status !== '3') // Assuming not cancelled
        .reduce((acc, order) => acc + parseFloat(order.sub_total || '0'), 0);

    const recentGrns = grns.slice(0, 5);
    
    return { totalSuppliers, totalOwed, recentGrns };
  }, [suppliers, purchaseOrders, grns]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Supplier Dashboard</h1>
        <p className="text-muted-foreground">
          An overview of your supplier relationships and activities.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{supplierStats.totalSuppliers}</div>}
                    <p className="text-xs text-muted-foreground">
                         <Link href="/suppliers" className="hover:underline">
                            Manage all suppliers
                        </Link>
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Due Balance</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-7 w-24" /> : <div className="text-2xl font-bold">{currencySymbol}{supplierStats.totalOwed.toFixed(2)}</div>}
                    <p className="text-xs text-muted-foreground">Across all pending purchase orders</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recent GRNs</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{supplierStats.recentGrns.length}</div>}
                    <p className="text-xs text-muted-foreground">
                       Total Goods Received Notes
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recent Payments</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{payments.length}</div>}
                    <p className="text-xs text-muted-foreground">
                        <Link href="/accounting/payments" className="hover:underline">
                            View all payments
                        </Link>
                    </p>
                </CardContent>
            </Card>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>A list of the most recent payments made to suppliers.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Supplier</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? Array.from({length: 5}).map((_, i) => <TableRow key={i}><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell></TableRow>) : payments.map(payment => (
                            <TableRow key={payment.id}>
                                <TableCell>
                                    <div className="font-medium">{suppliers.find(s => s.id === payment.id)?.supplier_name}</div>
                                    <div className="text-sm text-muted-foreground">{new Date(payment.date).toLocaleDateString()}</div>
                                </TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{payment.amount.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Recent Goods Received Notes (GRN)</CardTitle>
                <CardDescription>A list of recently received shipments from suppliers.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Supplier</TableHead>
                             <TableHead className="text-right">Items</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {isLoading ? Array.from({length: 5}).map((_, i) => <TableRow key={i}><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-6 w-12 rounded-full ml-auto" /></TableCell></TableRow>) : supplierStats.recentGrns.map(grn => (
                            <TableRow key={grn.id}>
                                <TableCell>
                                     <div className="font-medium">{suppliers.find(s => s.supplier_id === grn.supplier_id)?.supplier_name}</div>
                                    <div className="text-sm text-muted-foreground">{grn.grn_number}</div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="secondary">{grn.items?.length || 0}</Badge>
                                </TableCell>
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

    