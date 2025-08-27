
'use client'

import { type Invoice, type User } from '@/lib/types';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCurrency } from '../currency-provider';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Draft':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case 'Sent':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'Paid':
    case 'Active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Overdue':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

const getStatusText = (status: string): string => {
    if (status === '1') return 'Active';
    return status;
}

export const InvoiceReportView = ({ invoices, customers }: { invoices: Invoice[], customers: User[] }) => {
    const { currencySymbol } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const invoicesWithCustomer = useMemo(() => {
        return invoices.map(inv => ({
            ...inv,
            customerName: customers.find(c => c.customer_id === inv.customer_code)?.name || 'Walk-in Customer'
        }));
    }, [invoices, customers]);

    const filteredInvoices = invoicesWithCustomer.filter(invoice =>
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    
    const totals = useMemo(() => {
        return filteredInvoices.reduce((acc, inv) => {
            acc.grandTotal += parseFloat(inv.grand_total || '0');
            return acc;
        }, { grandTotal: 0 });
    }, [filteredInvoices]);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Invoice Report</CardTitle>
                <CardDescription>A list of all invoices in the system for the selected period.</CardDescription>
                <div className="pt-4">
                    <Input
                        placeholder="Search by invoice # or customer name..."
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
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedInvoices.map((invoice) => {
                            const statusText = getStatusText(invoice.invoice_status);
                            return (
                                <TableRow key={invoice.id}>
                                    <TableCell>{invoice.invoice_number}</TableCell>
                                    <TableCell>{invoice.customerName}</TableCell>
                                    <TableCell>{format(new Date(invoice.invoice_date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={cn(getStatusColor(statusText))}>
                                            {statusText}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(invoice.grand_total).toFixed(2)}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                     <TableRow className="font-bold bg-muted/50">
                        <TableCell colSpan={4} className="text-right">Total for filtered period</TableCell>
                        <TableCell className="text-right font-mono">{currencySymbol}{totals.grandTotal.toFixed(2)}</TableCell>
                    </TableRow>
                </Table>
            </CardContent>
             <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {paginatedInvoices.length} of {filteredInvoices.length} invoices.
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
