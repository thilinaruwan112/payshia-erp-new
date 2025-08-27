
'use client'

import { type Invoice, type User } from '@/lib/types';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from '../currency-provider';
import { useLocation } from '../location-provider';

export const SalesSummaryReportView = ({ invoices, customers }: { invoices: Invoice[], customers: User[] }) => {
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
            acc.subTotal += parseFloat(inv.inv_amount || '0');
            acc.discount += parseFloat(inv.discount_amount || '0');
            acc.charge += parseFloat(inv.service_charge || '0');
            acc.grandTotal += parseFloat(inv.grand_total || '0');
            return acc;
        }, { subTotal: 0, discount: 0, charge: 0, grandTotal: 0, return: 0 });
    }, [filteredInvoices]);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Sales Summary Report</CardTitle>
                <CardDescription>A list of all sales invoices for the selected period.</CardDescription>
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
                            <TableHead>Date</TableHead>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">Grand Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedInvoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell>{format(new Date(invoice.invoice_date), 'yyyy-MM-dd')}</TableCell>
                                <TableCell>{invoice.invoice_number}</TableCell>
                                <TableCell>{invoice.customerName}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(invoice.grand_total).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableRow className="font-bold bg-muted/50">
                        <TableCell colSpan={3} className="text-right">Total for filtered period</TableCell>
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
