
'use client'

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCurrency } from '../currency-provider';

interface ReportDataItem {
    product_id: string;
    product_name: string;
    product_variant_id: string;
    variant_sku: string;
    total_quantity: string;
    total_sales: string;
    total_cost: string;
    total_discount: string;
    gross_profit: string;
}

interface ReportData {
    items: ReportDataItem[];
    summary: {
        total_items: number;
        total_quantity: number;
        total_sales: number;
        total_cost: number;
        total_discount: number;
        total_gross_profit: number;
    };
}

export const ItemWiseSalesReportView = ({ reportData }: { reportData: ReportData }) => {
    const { currencySymbol } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredItems = useMemo(() => 
        (reportData.items || []).filter(item =>
            (item.product_name && item.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.variant_sku && item.variant_sku.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [reportData.items, searchTerm]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const { summary } = reportData;

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Item Wise Sales Report</CardTitle>
                <CardDescription>A summary of sales performance for each item within the selected period.</CardDescription>
                <div className="pt-4">
                    <Input
                        placeholder="Search by product name or SKU..."
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
                            <TableHead>Product Name</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="text-right">Qty Sold</TableHead>
                            <TableHead className="text-right">Total Sales</TableHead>
                            <TableHead className="text-right">Total Cost</TableHead>
                            <TableHead className="text-right">Gross Profit</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedItems.map((item) => (
                            <TableRow key={item.product_variant_id}>
                                <TableCell>{item.product_name}</TableCell>
                                <TableCell>{item.variant_sku}</TableCell>
                                <TableCell className="text-right">{parseFloat(item.total_quantity).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(item.total_sales).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(item.total_cost).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(item.gross_profit).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                     {summary && (
                        <TableRow className="font-bold bg-muted/50">
                            <TableCell colSpan={2} className="text-right">Totals</TableCell>
                            <TableCell className="text-right">{summary.total_quantity.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono">{currencySymbol}{summary.total_sales.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono">{currencySymbol}{summary.total_cost.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono">{currencySymbol}{summary.total_gross_profit.toFixed(2)}</TableCell>
                        </TableRow>
                    )}
                </Table>
            </CardContent>
             <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {paginatedItems.length} of {filteredItems.length} items.
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
