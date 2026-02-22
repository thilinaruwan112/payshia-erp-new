
'use client'

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCurrency } from '../currency-provider';
import type { Product, ProductVariant, Brand } from '@/lib/types';

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

interface ProductWithApiResponse {
    product: Product;
    variants: { variant: ProductVariant }[];
}


export const StockBalanceReportView = ({ reportData, products, brands }: { reportData: ReportData, products: ProductWithApiResponse[], brands: Brand[] }) => {
    const { currencySymbol } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const items = reportData?.data || [];
    const summary = reportData?.summary;
    
    const brandMap = useMemo(() => new Map(brands.map(b => [b.id, b.name])), [brands]);
    const productMap = useMemo(() => new Map(products.map(p => [p.product.id, p.product])), [products]);

    const filteredData = useMemo(() => 
        items.map(item => {
            const productDetails = productMap.get(item.product_id);
            const brandName = productDetails ? brandMap.get(String(productDetails.brand_id)) || 'N/A' : 'N/A';
            return { ...item, brandName };
        }).filter(item =>
            item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.variant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.brandName.toLowerCase().includes(searchTerm.toLowerCase())
    ), [items, searchTerm, productMap, brandMap]);

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
                            <CardContent><p className="text-2xl font-bold">{summary.item_count.toLocaleString()}</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Cost Value</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">{currencySymbol}{summary.grand_total_cost_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Sale Value</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">{currencySymbol}{summary.grand_total_sale_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Potential Profit</CardTitle></CardHeader>
                            <CardContent><p className="text-2xl font-bold">{currencySymbol}{summary.potential_profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></CardContent>
                        </Card>
                    </div>
                )}
                 <div className="pt-4">
                    <Input
                        placeholder="Search by product, variant, or brand..."
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
                            <TableHead>Brand</TableHead>
                            <TableHead className="text-right">Stock Balance</TableHead>
                            <TableHead className="text-right">Line Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                       {paginatedData.map((item) => (
                            <TableRow key={item.product_variant_id}>
                                <TableCell>{item.product_name}</TableCell>
                                <TableCell>{item.variant_name}</TableCell>
                                <TableCell>{item.brandName}</TableCell>
                                <TableCell className="text-right font-mono font-bold">{parseFloat(item.stock_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(item.total_cost_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            </TableRow>
                        ))}
                        {paginatedData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
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
