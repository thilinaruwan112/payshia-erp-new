
'use client'

import { type PurchaseOrder } from '@/lib/types';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCurrency } from '../currency-provider';

const getStatusText = (status: string) => {
  switch (status) {
    case '0': return 'Pending';
    case '1': return 'Approved';
    case '2': return 'Rejected';
    case '3': return 'Cancelled';
    default: return 'Unknown';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case '0': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case '1': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case '2': case '3': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

export const PurchaseOrderReportView = ({ purchaseOrders }: { purchaseOrders: PurchaseOrder[] }) => {
    const { currencySymbol } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredPOs = purchaseOrders.filter(po =>
        po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredPOs.length / itemsPerPage);
    const paginatedPOs = filteredPOs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Purchase Order Report</CardTitle>
                <CardDescription>A list of all purchase orders in the system.</CardDescription>
                <div className="pt-4">
                    <Input
                        placeholder="Search by PO number or supplier name..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="max-w-sm"
                    />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>PO Number</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedPOs.map((po) => (
                            <TableRow key={po.id}>
                                <TableCell>{po.po_number}</TableCell>
                                <TableCell>{po.supplierName || `ID: ${po.supplier_id}`}</TableCell>
                                <TableCell>{format(new Date(po.created_at), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className={cn(getStatusColor(po.po_status))}>
                                        {getStatusText(po.po_status)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(po.sub_total).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {paginatedPOs.length} of {filteredPOs.length} purchase orders.
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                        Page {currentPage} of {totalPages}
                    </span>
                     <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};
