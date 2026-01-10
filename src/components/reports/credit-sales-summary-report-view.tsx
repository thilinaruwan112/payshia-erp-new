
'use client'

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, DollarSign, FileText, TrendingDown, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCurrency } from '../currency-provider';

interface Invoice {
    id: string;
    invoice_number: string;
    invoice_date: string;
    grand_total: string;
    payment_status: string;
    customer_code: string;
    // Assuming customer name will be added to this object later
    customerName?: string; 
}

interface ReportData {
    invoices: Invoice[];
    summary: {
        total_credit_invoices: string;
        total_credit_sales_value: string;
        total_outstanding_amount: string;
        total_discount_on_credit_sales: string;
        total_cost_of_credit_sales: string;
    };
}

export const CreditSalesSummaryReportView = ({ reportData, customers }: { reportData: ReportData, customers: any[] }) => {
    const { currencySymbol } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const invoicesWithCustomer = useMemo(() => {
        return (reportData.invoices || []).map(inv => ({
            ...inv,
            customerName: customers.find(c => c.customer_id === inv.customer_code)?.customer_first_name + ' ' + customers.find(c => c.customer_id === inv.customer_code)?.customer_last_name || 'N/A'
        }));
    }, [reportData.invoices, customers]);


    const filteredInvoices = invoicesWithCustomer.filter(invoice =>
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const { summary } = reportData;

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Credit Sales Summary Report</CardTitle>
                <CardDescription>An overview of all sales made on credit.</CardDescription>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Credit Invoices</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{summary?.total_credit_invoices || 0}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Credit Sales</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{currencySymbol}{parseFloat(summary?.total_credit_sales_value || '0').toFixed(2)}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Cost</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{currencySymbol}{parseFloat(summary?.total_cost_of_credit_sales || '0').toFixed(2)}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Outstanding</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-destructive">{currencySymbol}{parseFloat(summary?.total_outstanding_amount || '0').toFixed(2)}</p></CardContent>
                    </Card>
                </div>
                 <div className="pt-4">
                    <Input
                        placeholder="Search by invoice number or customer name..."
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
                            <TableHead>Payment Status</TableHead>
                            <TableHead className="text-right">Total Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedInvoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell>{invoice.invoice_number}</TableCell>
                                <TableCell>{format(new Date(invoice.invoice_date), 'yyyy-MM-dd')}</TableCell>
                                <TableCell>{invoice.customerName}</TableCell>
                                <TableCell>
                                    <Badge variant={invoice.payment_status === 'Paid' ? 'default' : 'destructive'} className={invoice.payment_status === 'Paid' ? 'bg-green-100 text-green-800' : ''}>
                                        {invoice.payment_status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(invoice.grand_total).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
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
