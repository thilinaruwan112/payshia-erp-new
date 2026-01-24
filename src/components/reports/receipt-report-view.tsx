
'use client'

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from '../currency-provider';
import type { User } from '@/lib/types';
import { Badge } from '../ui/badge';

interface Receipt {
    receipt_id: string;
    rec_number: string;
    receipt_date: string;
    now_time: string;
    payment_mode: string;
    amount: string;
    invoice_id: string;
    customer_id: string;
    customerName?: string;
}

interface ReportData {
    summary: {
        total_count: number;
        total_value: number;
    };
    data: Receipt[];
}

const getPaymentMethodText = (type: string) => {
    switch (type) {
        case '0': return 'Cash';
        case '1': return 'Card';
        case '2': return 'Bank Transfer';
        default: return type;
    }
}

export const ReceiptReportView = ({ reportData, customers }: { reportData: ReportData, customers: User[] }) => {
    const { currencySymbol } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const receiptsWithCustomer = useMemo(() => {
        return (reportData?.data || []).map(rec => ({
            ...rec,
            customerName: customers.find(c => c.customer_id === rec.customer_id)?.name || 'Walk-in Customer'
        }));
    }, [reportData, customers]);

    const filteredReceipts = receiptsWithCustomer.filter(receipt =>
        receipt.rec_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
    const paginatedReceipts = filteredReceipts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const { summary } = reportData || { summary: { total_count: 0, total_value: 0 } };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Receipts</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{summary?.total_count || 0}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Value</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{currencySymbol}{parseFloat(String(summary?.total_value || '0')).toFixed(2)}</p></CardContent>
                    </Card>
                </div>
                 <div className="pt-4">
                    <Input
                        placeholder="Search by receipt # or customer name..."
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
                            <TableHead>Receipt #</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Payment Method</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedReceipts.map((receipt) => (
                            <TableRow key={receipt.receipt_id}>
                                <TableCell>{receipt.rec_number}</TableCell>
                                <TableCell>{format(new Date(receipt.now_time), 'yyyy-MM-dd HH:mm')}</TableCell>
                                <TableCell>{receipt.customerName}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{getPaymentMethodText(receipt.payment_mode)}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(receipt.amount).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {paginatedReceipts.length} of {filteredReceipts.length} receipts.
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
                    <span className="text-sm">Page {currentPage} of {totalPages}</span>
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
