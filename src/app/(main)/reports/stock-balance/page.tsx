
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from '@/components/location-provider';
import { fetcher } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/components/currency-provider';

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
}

export default function StockBalancePage() {
    const { company_id, availableLocations } = useLocation();
    const { toast } = useToast();
    const { currencySymbol } = useCurrency();
    const [reportData, setReportData] = useState<StockBalanceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLocation, setSelectedLocation] = useState('all');
    const itemsPerPage = 15;

    useEffect(() => {
        if (!company_id) {
            setIsLoading(false);
            return;
        };

        async function fetchStockBalance() {
            setIsLoading(true);
            try {
                let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stock-balance?company_id=${company_id}`;
                if (selectedLocation !== 'all') {
                    url += `&location_id=${selectedLocation}`;
                }
                const response = await fetcher(url);
                if (!response.ok) {
                    throw new Error('Failed to fetch stock balance report');
                }
                const data = await response.json();
                setReportData(data.data || []);
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch stock balance data.'
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchStockBalance();
    }, [company_id, selectedLocation, toast]);

    const filteredData = useMemo(() => {
        return reportData.filter(item =>
            item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.variant_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [reportData, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stock Balance Report</h1>
        <p className="text-muted-foreground">
          View current stock levels for all products.
        </p>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Stock Details</CardTitle>
            <CardDescription>An overview of your current inventory levels.</CardDescription>
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by product or variant name..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-9"
                    />
                </div>
                 <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Select Location" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {availableLocations.map(loc => (
                            <SelectItem key={loc.location_id} value={loc.location_id}>{loc.location_name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Variant Name</TableHead>
                            <TableHead className="text-right">Sale Price</TableHead>
                            <TableHead className="text-right">Cost Price</TableHead>
                            <TableHead className="text-right">Stock In</TableHead>
                            <TableHead className="text-right">Stock Out</TableHead>
                            <TableHead className="text-right font-bold">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                       {paginatedData.map((item) => (
                            <TableRow key={item.product_variant_id}>
                                <TableCell>{item.product_name}</TableCell>
                                <TableCell>{item.variant_name}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(item.sale_price).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(item.cost_price).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono text-green-600">{parseFloat(item.total_in).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono text-red-600">{parseFloat(item.total_out).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono font-bold">{parseFloat(item.stock_balance).toFixed(2)}</TableCell>
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
            )}
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
    </div>
  );
}
