
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
import { suppliers, purchaseOrders, goodsReceivedNotes, payments } from '@/lib/data';
import { useMemo } from 'react';
import { useCurrency } from '@/components/currency-provider';
import Link from 'next/link';

export default function SupplierDashboardPage() {
  const { currencySymbol } = useCurrency();
    
  const supplierStats = useMemo(() => {
    const totalSuppliers = suppliers.length;
    
    // Assuming PO total represents amount owed until a payment is explicitly made against it.
    // In a real system, you'd check payment status.
    const totalOwed = purchaseOrders
        .filter(po => po.status !== 'Received') // A proxy for not fully paid/received
        .reduce((acc, order) => acc + order.total, 0);

    const recentPayments = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    const recentGrns = [...goodsReceivedNotes].sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.date).getTime()).slice(0, 5);
    
    return { totalSuppliers, totalOwed, recentPayments, recentGrns };
  }, []);

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
                    <div className="text-2xl font-bold">{supplierStats.totalSuppliers}</div>
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
                    <div className="text-2xl font-bold">{currencySymbol}{supplierStats.totalOwed.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Across all pending purchase orders</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recent GRNs</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{supplierStats.recentGrns.length}</div>
                    <p className="text-xs text-muted-foreground">
                       In the last 7 days
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recent Payments</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{supplierStats.recentPayments.length}</div>
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
                        {supplierStats.recentPayments.map(payment => (
                            <TableRow key={payment.id}>
                                <TableCell>
                                    <div className="font-medium">{payment.supplierName}</div>
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
                         {supplierStats.recentGrns.map(grn => (
                            <TableRow key={grn.id}>
                                <TableCell>
                                     <div className="font-medium">{grn.supplierName}</div>
                                    <div className="text-sm text-muted-foreground">{grn.id}</div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="secondary">{grn.itemCount}</Badge>
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
