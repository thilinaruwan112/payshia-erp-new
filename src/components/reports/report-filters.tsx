
'use client'

import React, { useEffect, useState, Suspense } from 'react';
import type { User, Supplier, Product, ProductVariant, Collection, Color, Size, Brand, PurchaseOrder, Invoice, GoodsReceivedNote } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ArrowLeft, Printer, Eye, Loader2, FileDown } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocation } from '@/components/location-provider';
import { Combobox } from '@/components/ui/combobox';
import { allReports } from '@/lib/report-list';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { fetcher } from '@/lib/api';

interface ProductWithVariants {
    product: Product;
    variants: ProductVariant[];
}
type ReportData = User[] | Supplier[] | ProductWithVariants[] | PurchaseOrder[] | Invoice[] | GoodsReceivedNote[];

interface Category { id: string; name: string };
interface CustomField { id: string; field_name: string; }

export const ReportFilters = ({ reportName, onBack, onShowReport, onPrintReport, onExportCsv, onExportPdf, reportData }: { 
    reportName: string, 
    onBack: () => void, 
    onShowReport: (data: ReportData) => void,
    onPrintReport: () => void,
    onExportCsv: () => void,
    onExportPdf: () => void,
    reportData: ReportData,
}) => {
    const report = allReports.find(r => r.name === reportName);
    const filters = report?.filters || [];
    const { company_id, availableLocations } = useLocation();
    const { toast } = useToast();
    const router = useRouter();
    const [customers, setCustomers] = useState<User[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<ProductWithVariants[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [colors, setColors] = useState<Color[]>([]);
    const [sizes, setSizes] = useState<Size[]>([]);
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    
    // State for filter values
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

    const handleFilterChange = (filterName: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [filterName]: value }));
    };

    useEffect(() => {
        async function fetchDropdownData() {
            if (!company_id) return;
            const fetchData = async (url: string, setData: React.Dispatch<React.SetStateAction<any[]>>, type: string) => {
                 try {
                    const response = await fetcher(url);
                    if (!response.ok) throw new Error(`Failed to fetch ${type}`);
                    const data = await response.json();
                    if (type === 'products') {
                        setData(data.products || []);
                    } else {
                        setData(data || []);
                    }
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Error', description: `Could not fetch ${type} list.`});
                }
            }
            if (filters.includes('customer')) {
                fetchData(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/company/filter/?company_id=${company_id}`, setCustomers, 'customers');
            }
            if (filters.includes('supplier')) {
                fetchData(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/filter/by-company?company_id=${company_id}`, setSuppliers, 'suppliers');
            }
            if (filters.includes('item')) {
                 fetchData(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants?company_id=${company_id}`, setProducts, 'products');
            }
            if (filters.includes('category')) {
                fetchData(`${process.env.NEXT_PUBLIC_API_BASE_URL}/master-categories/company?company_id=${company_id}`, setCategories, 'categories');
            }
            if (filters.includes('brand')) {
                fetchData(`${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/company?company_id=${company_id}`, setBrands, 'brands');
            }
             if (filters.includes('collection')) {
                fetchData(`${process.env.NEXT_PUBLIC_API_BASE_URL}/collections/company?company_id=${company_id}`, setCollections, 'collections');
            }
            if (filters.includes('color')) {
                fetchData(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-colors/company?company_id=${company_id}`, setColors, 'colors');
            }
            if (filters.includes('size')) {
                fetchData(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sizes/filter/company?company_id=${company_id}`, setSizes, 'sizes');
            }
            if (filters.includes('customField')) {
                fetchData(`${process.env.NEXT_PUBLIC_API_BASE_URL}/custom-fields/filter/by-company?company_id=${company_id}`, setCustomFields, 'custom fields');
            }
        }
        fetchDropdownData();
    }, [reportName, filters, company_id, toast]);

    const customerOptions = [{ value: 'all', label: 'All Customers' }, ...customers.map(c => ({
        value: c.customer_id,
        label: `${c.customer_first_name} ${c.customer_last_name}`,
    }))];
     const supplierOptions = [{ value: 'all', label: 'All Suppliers' }, ...suppliers.map(s => ({
        value: s.supplier_id,
        label: s.supplier_name,
    }))];
    const itemOptions = [
        { value: 'all', label: 'All Items' },
        ...products.flatMap(p => 
            (p.variants || []).map(v => ({
                value: v.id,
                label: `${p.product.name} (${v.sku})`
            }))
        )
    ];
    const locationOptions = [{ value: 'all', label: 'All Locations' }, ...availableLocations.map(l => ({ value: l.location_id, label: l.location_name }))];
    const categoryOptions = [{ value: 'all', label: 'All Categories' }, ...categories.map(c => ({ value: c.id, label: c.name }))];
    const brandOptions = [{ value: 'all', label: 'All Brands' }, ...brands.map(b => ({ value: b.id, label: b.name }))];
    const collectionOptions = [{ value: 'all', label: 'All Collections' }, ...collections.map(c => ({ value: c.id, label: c.title }))];
    const colorOptions = [{ value: 'all', label: 'All Colors' }, ...colors.map(c => ({ value: c.id, label: c.name }))];
    const sizeOptions = [{ value: 'all', label: 'All Sizes' }, ...sizes.map(s => ({ value: s.id, label: s.value }))];
    const customFieldOptions = [{ value: 'all', label: 'All Fields' }, ...customFields.map(f => ({ value: f.id, label: f.field_name }))];

    const hasFilter = (filterName: string) => filters.includes(filterName);

    const handleViewReport = async () => {
        setIsFetching(true);
        try {
            let url = '';
            const params = new URLSearchParams({ company_id: String(company_id) });

            if (reportName === 'Customer Master Report') {
                url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/company/filter/`;
            } else if (reportName === 'Supplier Master Report') {
                 url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/filter/by-company`;
            } else if (reportName === 'Item Master Report') {
                 url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants`;
            } else if (reportName === 'Purchase Order Report') {
                url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/filter/`;
            } else if (reportName === 'Sales Summary Report' || reportName === 'Invoice Report') {
                url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/invoices/filter/hold/by-company-status`;
                params.append('invoice_status', '1');
            } else if (reportName === 'GRN Report') {
                 url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/grn/company/${company_id}`;
            }
             else {
                 toast({ title: "Coming Soon", description: "This report is not yet available for viewing." });
                 setIsFetching(false);
                 return;
            }
            
            if (dateRange?.from) {
                params.append('from_date', format(dateRange.from, 'yyyy-MM-dd'));
                params.append('to_date', format(dateRange.to || dateRange.from, 'yyyy-MM-dd'));
            }
            
            const finalUrl = `${url}?${params.toString()}`;
            const response = await fetcher(finalUrl);
            if (!response.ok) throw new Error(`Failed to fetch ${reportName} data`);
            const data = await response.json();
            onShowReport(reportName === 'Item Master Report' ? data.products || [] : data || []);
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: `Could not fetch ${reportName} data.`});
        } finally {
            setIsFetching(false);
        }
    };
    
    const handlePrintReportWithParams = () => {
        if (!company_id) return;
        let printUrl = '';

        if (reportName === 'Customer Master Report') printUrl = `/reports-print/customer-report/print?company_id=${company_id}`;
        else if (reportName === 'Supplier Master Report') printUrl = `/reports-print/supplier-report/print?company_id=${company_id}`;
        else if (reportName === 'Item Master Report') printUrl = `/reports-print/item-master-report/print?company_id=${company_id}`;
        else if (reportName === 'Purchase Order Report') printUrl = `/reports-print/purchase-order-report/print?company_id=${company_id}`;
        else if (reportName === 'GRN Report') printUrl = `/reports-print/grn-report/print?company_id=${company_id}`;
        else if (reportName === 'Invoice Report') printUrl = `/reports-print/invoice-report/print?company_id=${company_id}`;
        else if (reportName === 'Sales Summary Report') {
            const params = new URLSearchParams({ company_id: String(company_id) });
             if (dateRange?.from) params.append('from_date', format(dateRange.from, 'yyyy-MM-dd'));
             if (dateRange?.to) params.append('to_date', format(dateRange.to, 'yyyy-MM-dd'));
             if (filterValues['location'] && filterValues['location'] !== 'all') {
                const loc = availableLocations.find(l => l.location_id === filterValues['location']);
                if (loc) params.append('location', loc.location_name);
             }
             printUrl = `/reports-print/sales-summary/print?${params.toString()}`;
        }
        
        if (printUrl) {
            window.open(printUrl, '_blank');
        } else {
             toast({ title: "Coming Soon", description: "This report is not yet available for printing." });
        }
    }


    return (
        <Card className="flex-1 w-full">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <CardTitle>Filters for: {reportName}</CardTitle>
                        <CardDescription>Set your criteria before viewing the report.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hasFilter('dateRange') && (
                        <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                            <Label>Date Range</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                        {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                    ) : (
                                    <span>Pick a date range</span>
                                    )}
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
                    )}
                     {hasFilter('date') && (
                        <div className="space-y-1.5">
                            <Label>Date</Label>
                            <Popover>
                                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{'Select...'}</Button></PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" /></PopoverContent>
                            </Popover>
                        </div>
                    )}
                    {hasFilter('location') && (
                        <div className="space-y-1.5">
                            <Label>Location</Label>
                            <Combobox options={locationOptions} value={filterValues['location'] || ''} onChange={(value) => handleFilterChange('location', value)} placeholder="Select location..." notFoundText="No locations found." />
                        </div>
                    )}
                     {hasFilter('fromLocation') && (
                        <div className="space-y-1.5">
                            <Label>From Location</Label>
                            <Combobox options={locationOptions} value={filterValues['fromLocation'] || ''} onChange={(value) => handleFilterChange('fromLocation', value)} placeholder="Select location..." notFoundText="No locations found." />
                        </div>
                    )}
                     {hasFilter('toLocation') && (
                        <div className="space-y-1.5">
                            <Label>To Location</Label>
                            <Combobox options={locationOptions} value={filterValues['toLocation'] || ''} onChange={(value) => handleFilterChange('toLocation', value)} placeholder="Select location..." notFoundText="No locations found." />
                        </div>
                    )}
                     {hasFilter('customer') && (
                      <div className="space-y-1.5">
                        <Label>Customer</Label>
                        <Combobox
                            options={customerOptions}
                            value={filterValues['customer'] || ''}
                            onChange={(value) => handleFilterChange('customer', value)}
                            placeholder="Select a customer..."
                            notFoundText="No customers found."
                        />
                    </div>
                    )}
                     {hasFilter('supplier') && (
                      <div className="space-y-1.5">
                        <Label>Supplier</Label>
                         <Combobox
                            options={supplierOptions}
                            value={filterValues['supplier'] || ''}
                            onChange={(value) => handleFilterChange('supplier', value)}
                            placeholder="Select a supplier..."
                            notFoundText="No suppliers found."
                        />
                    </div>
                    )}
                      {hasFilter('user') && (
                      <div className="space-y-1.5">
                        <Label>User</Label>
                        <Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
                      </div>
                    )}
                      {hasFilter('item') && (
                        <div className="space-y-1.5">
                            <Label>Item</Label>
                             <Combobox options={itemOptions} value={filterValues['item'] || ''} onChange={(value) => handleFilterChange('item', value)} placeholder="Select item..." notFoundText="No items found." />
                        </div>
                    )}
                    {hasFilter('category') && (
                         <div className="space-y-1.5">
                            <Label>Category</Label>
                            <Combobox options={categoryOptions} value={filterValues['category'] || ''} onChange={(value) => handleFilterChange('category', value)} placeholder="Select category..." notFoundText="No categories found." />
                        </div>
                    )}
                    {hasFilter('brand') && (
                        <div className="space-y-1.5">
                            <Label>Brand</Label>
                            <Combobox options={brandOptions} value={filterValues['brand'] || ''} onChange={(value) => handleFilterChange('brand', value)} placeholder="Select brand..." notFoundText="No brands found." />
                        </div>
                    )}
                    {hasFilter('collection') && (
                        <div className="space-y-1.5">
                            <Label>Collection</Label>
                             <Combobox options={collectionOptions} value={filterValues['collection'] || ''} onChange={(value) => handleFilterChange('collection', value)} placeholder="Select collection..." notFoundText="No collections found." />
                        </div>
                    )}
                    {hasFilter('color') && (
                        <div className="space-y-1.5">
                            <Label>Color</Label>
                           <Combobox options={colorOptions} value={filterValues['color'] || ''} onChange={(value) => handleFilterChange('color', value)} placeholder="Select color..." notFoundText="No colors found." />
                        </div>
                    )}
                    {hasFilter('size') && (
                        <div className="space-y-1.5">
                            <Label>Size</Label>
                             <Combobox options={sizeOptions} value={filterValues['size'] || ''} onChange={(value) => handleFilterChange('size', value)} placeholder="Select size..." notFoundText="No sizes found." />
                        </div>
                    )}
                     {hasFilter('customField') && (
                        <div className="space-y-1.5">
                            <Label>Custom Field</Label>
                             <Combobox options={customFieldOptions} value={filterValues['customField'] || ''} onChange={(value) => handleFilterChange('customField', value)} placeholder="Select custom field..." notFoundText="No custom fields found." />
                        </div>
                    )}
                      {hasFilter('status') && (
                        <div className="space-y-1.5">
                            <Label>Status</Label>
                            <Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
                        </div>
                    )}
                 </div>
            </CardContent>
            <CardFooter className="gap-2 flex-wrap">
                 <Button onClick={handleViewReport} disabled={isFetching}>
                     {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                     View Report
                 </Button>
                 <Button variant="outline" onClick={handlePrintReportWithParams}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                </Button>
                <Button variant="outline" onClick={onExportCsv} disabled={reportData.length === 0}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
                <Button variant="outline" onClick={onExportPdf} disabled={reportData.length === 0}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export PDF
                </Button>
            </CardFooter>
        </Card>
    )
};
