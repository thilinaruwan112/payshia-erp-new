
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useCurrency } from '../currency-provider';
import { format } from 'date-fns';

interface HourlyData {
    hour: string;
    num_invoices: number;
    total_sales: number;
    total_cost: number;
    gross_profit: number;
    invoices: any[];
}

interface ReportData {
    date: string;
    hourly_data: HourlyData[];
}

export const HourlyInvoiceReportView = ({ reportData }: { reportData: ReportData[] }) => {
    const { currencySymbol } = useCurrency();

    if (!reportData || reportData.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    No data found for the selected criteria.
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {reportData.map(dateData => (
                <Card key={dateData.date} className="w-full">
                    <CardHeader>
                        <CardTitle>Date: {format(new Date(dateData.date), 'PPP')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {dateData.hourly_data.map(hourData => (
                                <AccordionItem value={hourData.hour} key={hourData.hour}>
                                    <AccordionTrigger>
                                        <div className="flex justify-between w-full pr-4">
                                            <span className="font-semibold text-lg">{hourData.hour}</span>
                                            <div className="flex gap-4 text-sm">
                                                <span>Invoices: <span className="font-bold">{hourData.num_invoices}</span></span>
                                                <span>Sales: <span className="font-bold">{currencySymbol}{hourData.total_sales.toFixed(2)}</span></span>
                                                <span>Profit: <span className="font-bold">{currencySymbol}{hourData.gross_profit.toFixed(2)}</span></span>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Invoice #</TableHead>
                                                    <TableHead>Time</TableHead>
                                                    <TableHead className="text-right">Sales</TableHead>
                                                    <TableHead className="text-right">Cost</TableHead>
                                                    <TableHead className="text-right">Profit</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {hourData.invoices.map(invoice => (
                                                    <TableRow key={invoice.id}>
                                                        <TableCell>{invoice.invoice_number}</TableCell>
                                                        <TableCell>{format(new Date(invoice.current_time), 'HH:mm:ss')}</TableCell>
                                                        <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(invoice.grand_total).toFixed(2)}</TableCell>
                                                        <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(invoice.cost_value).toFixed(2)}</TableCell>
                                                        <TableCell className="text-right font-mono">{currencySymbol}{(parseFloat(invoice.grand_total) - parseFloat(invoice.cost_value)).toFixed(2)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
