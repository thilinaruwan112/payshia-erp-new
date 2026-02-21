
'use client'

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCurrency } from '../currency-provider';

interface StockBalanceItem {
    product_id: string;
    product_variant_id: string;
    product_name: string;
    variant_name: string;
    sale_price: string;
    cost_price: string;
    total_in: string;
    total_out: string;
    stock_balance: string;
    total_cost_value: string;
    total_sale_value: string;
}

interface ReportData {
    data: StockBalanceItem[];
    summary: {
        grand_total_cost_value: number;
        grand_total_sale_value: number;
        potential_profit: number;
        item_count: number;
    };
}

export const StockBalanceReportView = ({ reportData }: { reportData: ReportData }) => {
    const { currencySymbol } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const items = reportData?.data || [];
    const summary = reportData?.summary;

    const filteredData = useMemo(() => 
        items.filter(item =>
            item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.variant_name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [items, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Stock Balance Report</CardTitle>
                <CardDescription>A detailed view of stock levels for all products based on your filters.</CardDescription>
                {summary && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Items</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">{summary.item_count}</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Stock Value (Cost)</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">{currencySymbol}{summary.grand_total_cost_value.toFixed(2)}</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Stock Value (Sale)</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">{currencySymbol}{summary.grand_total_sale_value.toFixed(2)}</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Potential Profit</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">{currencySymbol}{summary.potential_profit.toFixed(2)}</p></CardContent>
                        </Card>
                    </div>
                )}
                 <div className="pt-4">
                    <Input
                        placeholder="Search by product or variant name..."
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
                            <TableHead>Variant Name</TableHead>
                            <TableHead className="text-right">Sale Price</TableHead>
                            <TableHead className="text-right">Cost Price</TableHead>
                            <TableHead className="text-right font-bold">Balance</TableHead>
                            <TableHead className="text-right">Total Cost Value</TableHead>
                            <TableHead className="text-right">Total Sale Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                       {paginatedData.map((item) => (
                            <TableRow key={item.product_variant_id}>
                                <TableCell>{item.product_name}</TableCell>
                                <TableCell>{item.variant_name}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(item.sale_price).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(item.cost_price).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono font-bold">{parseFloat(item.stock_balance).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(item.total_cost_value).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(item.total_sale_value).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                        {paginatedData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No stock data available for the selected criteria.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {paginatedData.length} of {filteredData.length} items.
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
