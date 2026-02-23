
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BinCardReportView } from '@/components/reports/bin-card-report-view';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Loader2, Eye, Printer, ArrowLeft } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fetcher } from '@/lib/api';
import { useLocation } from '@/components/location-provider';
import { useRouter } from 'next/navigation';
import type { Product, ProductVariant } from '@/lib/types';

interface ProductWithApiResponse {
    product: Product;
    variants: { variant: ProductVariant }[];
}

interface ReportData {
    transactions: any[];
    summary: any;
}

export default function BinCardReportPage() {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const { availableLocations, company_id } = useLocation();
    const { toast } = useToast();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
    });
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const router = useRouter();

    const handleFilterChange = (filterName: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [filterName]: value }));
    };

    useEffect(() => {
        async function fetchProducts() {
            if (!company_id) return;
            try {
                const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${company_id}`);
                if (!response.ok) throw new Error("Failed to fetch products");
                const data = await response.json();
                setProducts(data.products || []);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch products.' });
            }
        }
        fetchProducts();
    }, [company_id, toast]);

    const itemOptions = useMemo(() => {
        return products.flatMap(p => 
            (p.variants || []).map(v => ({
                value: v.variant.id,
                label: `${p.product.name} (${v.variant.sku})`
            }))
        );
    }, [products]);

    const handleViewReport = useCallback(async () => {
        setIsFetching(true);
        setReportData(null);

        if (!filterValues['item'] || !dateRange?.from) {
            toast({
                variant: 'destructive',
                title: 'Filters Required',
                description: 'Please select an item and a date range for the Bin Card Report.',
            });
            setIsFetching(false);
            return;
        }

        try {
            if (!company_id) throw new Error("Company ID is missing.");
            
            const selectedProduct = products.find(p => p.variants.some(v => v.variant.id === filterValues['item']));
            const selectedVariant = selectedProduct?.variants.find(v => v.variant.id === filterValues['item'])?.variant;
            if (!selectedProduct || !selectedVariant) throw new Error("Selected item details could not be found.");

            const params = new URLSearchParams({ 
                company_id: String(company_id),
                product_id: selectedProduct.product.id,
                product_variant_id: selectedVariant.id,
                start_date: format(dateRange.from, 'yyyy-MM-dd'),
                end_date: format(dateRange.to || dateRange.from, 'yyyy-MM-dd'),
            });
            
            if (filterValues['location'] && filterValues['location'] !== 'all') {
                params.append('location_id', filterValues['location']);
            }

            const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/bin-card?${params.toString()}`;
            
            const response = await fetcher(url);
            if (!response.ok) throw new Error('Failed to fetch report data');
            
            const data = await response.json();
            setReportData(data.data);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
            setIsFetching(false);
        }
    }, [company_id, dateRange, filterValues, products, toast]);
    
    const handlePrint = () => {
        if (!reportData) {
            toast({ variant: 'destructive', title: 'No data to print', description: 'Please view the report first.' });
            return;
        }

        const selectedProduct = products.find(p => p.variants.some(v => v.variant.id === filterValues['item']));
        const selectedVariant = selectedProduct?.variants.find(v => v.variant.id === filterValues['item'])?.variant;
        if (!selectedProduct || !selectedVariant) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not resolve product details for printing.' });
            return;
        }

        const params = new URLSearchParams({
            company_id: String(company_id),
            product_id: selectedProduct.product.id,
            product_variant_id: selectedVariant.id,
            ...(dateRange?.from && { start_date: format(dateRange.from, 'yyyy-MM-dd') }),
            ...(dateRange?.to && { end_date: format(dateRange.to, 'yyyy-MM-dd') }),
            ...(filterValues['location'] && filterValues['location'] !== 'all' && { location_id: filterValues['location'] }),
        });
        const url = `/reports-print/bin-card/print?${params.toString()}`;
        window.open(url, '_blank');
    };

    const locationOptions = [{ value: 'all', label: 'All Locations' }, ...availableLocations.map(l => ({ value: l.location_id, label: l.location_name }))];

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bin Card Report</h1>
                    <p className="text-muted-foreground">Track the movement of inventory for a specific item.</p>
                 </div>
                 <Button variant="outline" onClick={() => router.push('/reports')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Reports
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                 <div className="space-y-1.5 md:col-span-2">
                    <Label>Item <span className="text-destructive">*</span></Label>
                    <Combobox options={itemOptions} value={filterValues['item'] || ''} onChange={(value) => handleFilterChange('item', value)} placeholder="Select an item..." notFoundText="No items found." />
                </div>
                <div className="space-y-1.5">
                    <Label>Location</Label>
                    <Combobox options={locationOptions} value={filterValues['location'] || ''} onChange={(value) => handleFilterChange('location', value)} placeholder="All Locations" />
                </div>
                <div className="space-y-1.5">
                    <Label>Date Range <span className="text-destructive">*</span></Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal",!dateRange && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>) : (format(dateRange.from, "LLL dd, y"))) : (<span>Pick a date range</span>)}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
             <div className="flex items-center gap-2">
                 <Button onClick={handleViewReport} disabled={isFetching}>
                     {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                     View
                 </Button>
                  <Button variant="outline" onClick={handlePrint} disabled={!reportData}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                </Button>
            </div>
            
            {reportData && (
                <BinCardReportView reportData={reportData} />
            )}
        </div>
    );
}

