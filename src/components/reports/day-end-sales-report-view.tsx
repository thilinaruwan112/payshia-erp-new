
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrency } from '../currency-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Banknote, CreditCard, Landmark, CircleDollarSign } from 'lucide-react';
import React from 'react';
import type { PaymentMethod } from '@/lib/types';

interface ReportData {
    status: string;
    date: string;
    company_id: string;
    location_id: string;
    payment_method_id: string;
    payment_method_name: string;
    invoice_total: string;
    receipt_total: string;
    return_total: string;
    refund_total: string;
    cash_inhand: number;
    creditsale: number;
    receipts_breakdown: {
        type_name: string; // This is actually the ID
        amount: string;
    }[];
}

const getPaymentIcon = (type: string) => {
    switch (type.toLowerCase()) {
        case 'cash': return <Banknote className="h-5 w-5 text-green-500" />;
        case 'card': return <CreditCard className="h-5 w-5 text-blue-500" />;
        case 'bank': return <Landmark className="h-5 w-5 text-purple-500" />;
        default: return <CircleDollarSign className="h-5 w-5 text-muted-foreground" />;
    }
}


export const DayEndSalesReportView = ({ reportData, paymentMethods }: { reportData: ReportData, paymentMethods: PaymentMethod[] }) => {
    const { currencySymbol } = useCurrency();
    const receiptTotal = parseFloat(reportData.receipt_total || '0');
    const returnTotal = parseFloat(reportData.return_total || '0');
    const cashInHand = reportData.cash_inhand || 0;
    const creditSale = reportData.creditsale || 0;

    const getPaymentMethodNameById = (id: string) => {
        if (id === "0") return "All Methods";
        return paymentMethods.find(pm => pm.id === id)?.method || `ID: ${id}`;
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Day End Sale Report</CardTitle>
                <CardDescription>A summary of all transactions for the selected day.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Sales</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{currencySymbol}{parseFloat(reportData.invoice_total || '0').toFixed(2)}</p></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Receipts</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{currencySymbol}{receiptTotal.toFixed(2)}</p></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Returns</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-destructive">-{currencySymbol}{returnTotal.toFixed(2)}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Credit Sales</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{currencySymbol}{creditSale.toFixed(2)}</p></CardContent>
                    </Card>
                     <Card className="bg-primary/10 border-primary col-span-2 lg:col-span-1">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Cash In Hand</CardTitle></CardHeader>
                        <CardContent><p className="text-3xl font-bold">{currencySymbol}{cashInHand.toFixed(2)}</p></CardContent>
                    </Card>
                </div>
                 <h3 className="text-lg font-semibold mb-4">Receipts by Payment Type</h3>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Payment Method</TableHead>
                            <TableHead className="text-right">Total Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(reportData.receipts_breakdown || []).map(pm => {
                            const methodName = getPaymentMethodNameById(pm.type_name);
                            return (
                                <TableRow key={pm.type_name}>
                                    <TableCell className="flex items-center gap-3 font-medium">
                                        {getPaymentIcon(methodName)}
                                        {methodName}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-lg">{currencySymbol}{parseFloat(pm.amount).toFixed(2)}</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
