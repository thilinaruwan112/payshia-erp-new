
'use client'

import React, { useEffect, useState } from 'react';
import type { User, Supplier, Product, ProductVariant, Collection, Color, Size, Brand } from '@/lib/types';
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
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ArrowLeft, Printer, Eye, Loader2, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocation } from '@/components/location-provider';
import { Combobox } from '@/components/ui/combobox';
import { allReports } from '@/lib/report-list';

interface ProductWithVariants {
    product: Product;
    variants: ProductVariant[];
}
type ReportData = User[] | Supplier[] | ProductWithVariants[];

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
    const { company_id } = useLocation();
    const { toast } = useToast();
    const [customers, setCustomers] = useState<User[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [colors, setColors] = useState<Color[]>([]);
    const [sizes, setSizes] = useState<Size[]>([]);
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        async function fetchDropdownData() {
            if (!company_id) return;
            const fetchData = async (url: string, setData: React.Dispatch<React.SetStateAction<any[]>>, type: string) => {
                 try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`Failed to fetch ${type}`);
                    const data = await response.json();
                    setData(data || []);
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Error', description: `Could not fetch ${type} list.`});
                }
            }
            if (filters.includes('customer')) {
                fetchData(`https://server-erp.payshia.com/customers/company/filter/?company_id=${company_id}`, setCustomers, 'customers');
            }
            if (filters.includes('supplier')) {
                fetchData(`https://server-erp.payshia.com/suppliers/filter/by-company?company_id=${company_id}`, setSuppliers, 'suppliers');
            }
            if (filters.includes('category')) {
                fetchData(`https://server-erp.payshia.com/master-categories/company?company_id=${company_id}`, setCategories, 'categories');
            }
            if (filters.includes('brand')) {
                fetchData(`https://server-erp.payshia.com/brands/company?company_id=${company_id}`, setBrands, 'brands');
            }
             if (filters.includes('collection')) {
                fetchData(`https://server-erp.payshia.com/collections/company?company_id=${company_id}`, setCollections, 'collections');
            }
            if (filters.includes('color')) {
                fetchData(`https://server-erp.payshia.com/product-colors/company?company_id=${company_id}`, setColors, 'colors');
            }
            if (filters.includes('size')) {
                fetchData(`https://server-erp.payshia.com/sizes/filter/company?company_id=${company_id}`, setSizes, 'sizes');
            }
            if (filters.includes('customField')) {
                fetchData(`https://server-erp.payshia.com/custom-fields/filter/by-company?company_id=${company_id}`, setCustomFields, 'custom fields');
            }
        }
        fetchDropdownData();
    }, [reportName, filters, company_id, toast]);

    const customerOptions = customers.map(c => ({
        value: c.customer_id,
        label: `${c.customer_first_name} ${c.customer_last_name}`,
    }));
     const supplierOptions = suppliers.map(s => ({
        value: s.supplier_id,
        label: s.supplier_name,
    }));
    const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));
    const brandOptions = brands.map(b => ({ value: b.id, label: b.name }));
    const collectionOptions = collections.map(c => ({ value: c.id, label: c.title }));
    const colorOptions = colors.map(c => ({ value: c.id, label: c.name }));
    const sizeOptions = sizes.map(s => ({ value: s.id, label: s.value }));
    const customFieldOptions = customFields.map(f => ({ value: f.id, label: f.field_name }));

    const hasFilter = (filterName: string) => filters.includes(filterName);

    const handleViewReport = async () => {
        setIsFetching(true);
        try {
            let url = '';
            if (reportName === 'Customer Master Report') {
                url = `https://server-erp.payshia.com/customers/company/filter/?company_id=${company_id}`;
            } else if (reportName === 'Supplier Master Report') {
                 url = `https://server-erp.payshia.com/suppliers/filter/by-company?company_id=${company_id}`;
            } else if (reportName === 'Item Master Report') {
                 url = `https://server-erp.payshia.com/products/with-variants?company_id=${company_id}`;
            } else {
                 toast({ title: "Coming Soon", description: "This report is not yet available for viewing." });
                 setIsFetching(false);
                 return;
            }
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch ${reportName} data`);
            const data = await response.json();
            onShowReport(reportName === 'Item Master Report' ? data.products || [] : data || []);
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: `Could not fetch ${reportName} data.`});
        } finally {
            setIsFetching(false);
        }
    };

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
                        <>
                        <div className="space-y-1.5">
                            <Label>From Date</Label>
                            <Popover>
                                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{'Select...'}</Button></PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" /></PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-1.5">
                            <Label>To Date</Label>
                            <Popover>
                                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{'Select...'}</Button></PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" /></PopoverContent>
                            </Popover>
                        </div>
                        </>
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
                            <Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
                        </div>
                    )}
                     {hasFilter('fromLocation') && (
                        <div className="space-y-1.5">
                            <Label>From Location</Label>
                            <Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
                        </div>
                    )}
                     {hasFilter('toLocation') && (
                        <div className="space-y-1.5">
                            <Label>To Location</Label>
                            <Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
                        </div>
                    )}
                     {hasFilter('customer') && (
                      <div className="space-y-1.5">
                        <Label>Customer</Label>
                        <Combobox
                            options={customerOptions}
                            value={''}
                            onChange={() => {}}
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
                            value={''}
                            onChange={() => {}}
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
                            <Input placeholder="Search Item" />
                        </div>
                    )}
                    {hasFilter('category') && (
                         <div className="space-y-1.5">
                            <Label>Category</Label>
                            <Combobox options={categoryOptions} value="" onChange={() => {}} placeholder="Select category..." notFoundText="No categories found." />
                        </div>
                    )}
                    {hasFilter('brand') && (
                        <div className="space-y-1.5">
                            <Label>Brand</Label>
                            <Combobox options={brandOptions} value="" onChange={() => {}} placeholder="Select brand..." notFoundText="No brands found." />
                        </div>
                    )}
                    {hasFilter('collection') && (
                        <div className="space-y-1.5">
                            <Label>Collection</Label>
                             <Combobox options={collectionOptions} value="" onChange={() => {}} placeholder="Select collection..." notFoundText="No collections found." />
                        </div>
                    )}
                    {hasFilter('color') && (
                        <div className="space-y-1.5">
                            <Label>Color</Label>
                           <Combobox options={colorOptions} value="" onChange={() => {}} placeholder="Select color..." notFoundText="No colors found." />
                        </div>
                    )}
                    {hasFilter('size') && (
                        <div className="space-y-1.5">
                            <Label>Size</Label>
                             <Combobox options={sizeOptions} value="" onChange={() => {}} placeholder="Select size..." notFoundText="No sizes found." />
                        </div>
                    )}
                     {hasFilter('customField') && (
                        <div className="space-y-1.5">
                            <Label>Custom Field</Label>
                             <Combobox options={customFieldOptions} value="" onChange={() => {}} placeholder="Select custom field..." notFoundText="No custom fields found." />
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
                 <Button variant="outline" onClick={onPrintReport}>
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
