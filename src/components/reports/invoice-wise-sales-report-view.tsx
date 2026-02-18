
'use client'

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCurrency } from '../currency-provider';
import { format } from 'date-fns';

interface InvoiceReportItem {
    invoice_id: string;
    invoice_number: string;
    invoice_date: string;
    customer_code: string;
    customer_first_name: string;
    customer_last_name: string;
    location_name: string;
    total_sales: string;
    discount_amount: string;
    service_charge: string;
    cost_value: string;
    net_amount: string;
    payment_status: string;
    amount_received: string;
    created_by: string;
    gross_profit: string;
}

interface ReportData {
    invoices: InvoiceReportItem[];
    summary: {
        total_invoices: number;
        total_sales: number;
        total_discount: number;
        total_service_charge: number;
        total_cost: number;
        total_net_amount: number;
        total_received: number;
        total_gross_profit: number;
        paid_invoices: number;
        pending_invoices: number;
    };
}

export const InvoiceWiseSalesReportView = ({ reportData }: { reportData: ReportData }) => {
    const { currencySymbol } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredInvoices = useMemo(() => 
        (reportData?.invoices || []).filter(invoice =>
            (invoice.invoice_number && invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (`${invoice.customer_first_name || ''} ${invoice.customer_last_name || ''}`.trim().toLowerCase().includes(searchTerm.toLowerCase()))
    ), [reportData, searchTerm]);


    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const { summary } = reportData || {};

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Invoice Wise Sales Report</CardTitle>
                <CardDescription>A detailed breakdown of sales performance by individual invoice.</CardDescription>
                
                {summary && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Invoices</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">{summary.total_invoices || 0}</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Sales</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">{currencySymbol}{summary.total_sales?.toFixed(2) || '0.00'}</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Cost</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">{currencySymbol}{summary.total_cost?.toFixed(2) || '0.00'}</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Gross Profit</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">{currencySymbol}{summary.total_gross_profit?.toFixed(2) || '0.00'}</p></CardContent>
                        </Card>
                    </div>
                )}
                
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
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">Total Sales</TableHead>
                            <TableHead className="text-right">Discount</TableHead>
                            <TableHead className="text-right">Svc. Charge</TableHead>
                            <TableHead className="text-right">Net Amount</TableHead>
                            <TableHead className="text-right">Cost</TableHead>
                            <TableHead className="text-right">Gross Profit</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedInvoices.map((invoice) => (
                            <TableRow key={invoice.invoice_id}>
                                <TableCell>{invoice.invoice_number}</TableCell>
                                <TableCell>{format(new Date(invoice.invoice_date), 'yyyy-MM-dd')}</TableCell>
                                <TableCell>{invoice.customer_first_name} {invoice.customer_last_name}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(invoice.total_sales).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(invoice.discount_amount).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(invoice.service_charge).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(invoice.net_amount).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(invoice.cost_value).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(invoice.gross_profit).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    {summary && (
                        <TableRow className="font-bold bg-muted/50">
                            <TableCell colSpan={3} className="text-right">Totals</TableCell>
                            <TableCell className="text-right font-mono">{currencySymbol}{summary.total_sales.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono">{currencySymbol}{summary.total_discount.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono">{currencySymbol}{summary.total_service_charge.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono">{currencySymbol}{summary.total_net_amount.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono">{currencySymbol}{summary.total_cost.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono">{currencySymbol}{summary.total_gross_profit.toFixed(2)}</TableCell>
                        </TableRow>
                    )}
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
