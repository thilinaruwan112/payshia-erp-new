'use client';

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import type { User, Supplier, Brand, Product, ProductVariant } from '@/lib/types';
import { format } from 'date-fns';
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
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLocation } from '@/components/location-provider';
import { Combobox } from '@/components/ui/combobox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const reportCategories = [
    { 
        name: 'Master', 
        reports: [
            { name: 'Customer Master Report', href: '/reports/customer-report', filters: ['customer'] },
            { name: 'Supplier Master Report', href: '/reports/supplier-report', filters: ['supplier'] },
            { name: 'Item Master Report', href: '/reports/stock-balance', filters: ['item', 'category', 'brand', 'collection', 'color', 'size', 'customField'] },
        ]
    },
    {
        name: 'Purchasing',
        reports: [
            { name: 'Purchase Order Report', href: '/purchasing/purchase-orders', filters: ['dateRange', 'supplier', 'status'] },
            { name: 'GRN Report', href: '/purchasing/grn', filters: ['dateRange', 'supplier'] },
        ]
    },
    { 
        name: 'Stock', 
        reports: [
            { name: 'Stock Balance Report', href: '/reports/stock-balance', filters: ['location', 'category', 'brand', 'item'] },
            { name: 'Stock Transfer Report', href: '/transfers', filters: ['dateRange', 'fromLocation', 'toLocation'] },
            { name: 'Bin Card Report', href: '/reports/bin-card', filters: ['dateRange', 'location', 'item'] },
            { name: 'Stock Movement Report', href: '/reports/bin-card', filters: ['dateRange', 'location', 'item'] },
        ]
    },
    { 
        name: 'Sale', 
        reports: [
            { name: 'Credit Sales Summary Report', href: '/reports/credit-sales-summary', filters: ['dateRange', 'customer', 'location'] },
            { name: 'Customer Order Report', href: '/reports/customer-report', filters: ['dateRange', 'customer'] },
            { name: 'Day End Sale Report', href: '/reports/sales-summary', filters: ['dateRange', 'location'] },
            { name: 'Hourly Sales Report', href: '/reports/sales-summary', filters: ['dateRange', 'location'] },
            { name: 'Invoice Report', href: '/reports/invoice-report', filters: ['dateRange', 'customer', 'status'] },
            { name: 'Item Wise Sales', href: '#', filters: ['dateRange', 'item', 'category', 'brand', 'location'] },
            { name: 'Receipt Report', href: '/sales/receipts', filters: ['dateRange', 'customer'] },
            { name: 'Sales Summary Report', href: '/reports/sales-summary', filters: ['dateRange', 'location', 'user'] },
        ]
    },
    { 
        name: 'Management',
        reports: [
            { name: 'Profit & Loss Statement', href: '#', filters: ['dateRange'] },
            { name: 'Balance Sheet', href: '#', filters: ['date'] },
            { name: 'Trial Balance', href: '#', filters: ['date'] },
        ]
    },
];

const allReports = reportCategories.flatMap(cat => cat.reports);

type Category = { id: string; name: string };
interface ProductWithVariants {
    product: Product;
    variants: ProductVariant[];
}
type ReportData = User[] | Supplier[] | ProductWithVariants[];

const CustomerReportView = ({ customers }: { customers: User[] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredCustomers = customers.filter(customer =>
        `${customer.customer_first_name} ${customer.customer_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email_address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Customer Master Report</CardTitle>
                <CardDescription>A list of all customers in the system.</CardDescription>
                <div className="pt-4">
                    <Input
                        placeholder="Search customers by name, phone, or email..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1); // Reset to first page on search
                        }}
                        className="max-w-sm"
                    />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer Name</TableHead>
                            <TableHead>Phone Number</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Address</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedCustomers.map((customer) => (
                            <TableRow key={customer.customer_id}>
                                <TableCell>{customer.customer_first_name} {customer.customer_last_name}</TableCell>
                                <TableCell>{customer.phone_number}</TableCell>
                                <TableCell>{customer.email_address}</TableCell>
                                <TableCell>{customer.address_line1}, {customer.city}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {paginatedCustomers.length} of {filteredCustomers.length} customers.
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

const SupplierReportView = ({ suppliers }: { suppliers: Supplier[] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
    const paginatedSuppliers = filteredSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Supplier Master Report</CardTitle>
                <CardDescription>A list of all suppliers in the system.</CardDescription>
                <div className="pt-4">
                    <Input
                        placeholder="Search suppliers by name, contact, or email..."
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
                            <TableHead>Supplier Name</TableHead>
                            <TableHead>Contact Person</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Email</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedSuppliers.map((supplier) => (
                            <TableRow key={supplier.supplier_id}>
                                <TableCell>{supplier.supplier_name}</TableCell>
                                <TableCell>{supplier.contact_person}</TableCell>
                                <TableCell>{supplier.telephone}</TableCell>
                                <TableCell>{supplier.email}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {paginatedSuppliers.length} of {filteredSuppliers.length} suppliers.
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

const ItemMasterReportView = ({ products }: { products: ProductWithVariants[] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const allVariants = products.flatMap(p => p.variants.map(v => ({ ...v, productName: p.product.name, category: p.product.category, brand: 'N/A' })));

    const filteredItems = allVariants.filter(item =>
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Item Master Report</CardTitle>
                <CardDescription>A list of all product variants in the system.</CardDescription>
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
                            <TableHead>Category</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedItems.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.productName}</TableCell>
                                <TableCell>{item.sku}</TableCell>
                                <TableCell>{item.category}</TableCell>
                                <TableCell>{item.brand}</TableCell>
                                <TableCell className="text-right">{item.stock || 0}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
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


const ReportFilters = ({ reportName, onBack, onShowReport, onPrintReport, onExportCsv, onExportPdf, reportData }: { 
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
                            <Input placeholder="Not implemented" disabled />
                        </div>
                    )}
                    {hasFilter('color') && (
                        <div className="space-y-1.5">
                            <Label>Color</Label>
                           <Input placeholder="Not implemented" disabled />
                        </div>
                    )}
                    {hasFilter('size') && (
                        <div className="space-y-1.5">
                            <Label>Size</Label>
                            <Input placeholder="Not implemented" disabled />
                        </div>
                    )}
                     {hasFilter('customField') && (
                        <div className="space-y-1.5">
                            <Label>Custom Field</Label>
                           <Input placeholder="Not implemented" disabled />
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
}

const ReportList = ({ reports, selectedReport, onSelectReport }: { 
    reports: {name: string, href: string, filters: string[]}[];
    selectedReport: string | null;
    onSelectReport: (name: string) => void;
}) => (
     <div className="flex flex-col">
        {reports.map((report) => (
            <button key={report.name} onClick={() => onSelectReport(report.name)}
                className={cn(
                    "text-left py-3 px-4 rounded-md text-sm transition-colors",
                    selectedReport === report.name ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                )}
            >
                {report.name}
            </button>
        ))}
    </div>
)


export default function ReportsPage() {
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [reportData, setReportData] = useState<ReportData>([]);
    const { company_id } = useLocation();
    const { toast } = useToast();

    const handleShowReport = (data: ReportData) => {
        setReportData(data);
    };
    
    const handleSelectReport = (name: string) => {
        setSelectedReport(name);
        setReportData([]);
    }
    
    const handlePrintReport = () => {
        if (!company_id) return;
        let url = '';
        if (selectedReport === 'Customer Master Report') {
            url = `/reports-print/customer-report/print?company_id=${company_id}`;
        } else if (selectedReport === 'Supplier Master Report') {
            url = `/reports-print/supplier-report/print?company_id=${company_id}`;
        } else if (selectedReport === 'Item Master Report') {
             url = `/reports-print/item-master-report/print?company_id=${company_id}`;
        }
        
        if (url) {
            window.open(url, '_blank');
        } else {
             toast({ title: "Coming Soon", description: "This report is not yet available for printing." });
        }
    };

    const handleExportCSV = () => {
        if (reportData.length === 0) {
            toast({ variant: 'destructive', title: 'No data', description: 'Please view the report first to export.' });
            return;
        }

        let headers: string[] = [];
        let rows: string[][] = [];
        let filename = 'report.csv';

        if(selectedReport === 'Customer Master Report' && reportData.length > 0 && 'customer_first_name' in reportData[0]) {
            headers = ["Customer Name", "Phone Number", "Email", "Address"];
            rows = (reportData as User[]).map(customer => [
                `"${customer.customer_first_name} ${customer.customer_last_name}"`,
                customer.phone_number || '',
                customer.email_address || '',
                `"${customer.address_line1 || ''}, ${customer.city || ''}"`
            ]);
            filename = 'customer_report.csv';
        } else if (selectedReport === 'Supplier Master Report' && reportData.length > 0 && 'supplier_name' in reportData[0]) {
             headers = ["Supplier Name", "Contact Person", "Phone", "Email"];
            rows = (reportData as Supplier[]).map(supplier => [
                `"${supplier.supplier_name}"`,
                `"${supplier.contact_person}"`,
                supplier.telephone,
                supplier.email
            ]);
            filename = 'supplier_report.csv';
        }

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    const handleExportPdf = () => {
        if (reportData.length === 0) {
            toast({ variant: 'destructive', title: 'No data', description: 'Please view the report first to export.' });
            return;
        }
        
        const doc = new jsPDF();
        doc.text(selectedReport || 'Report', 14, 16);

        let head: string[][] = [];
        let body: (string | number)[][] = [];
        let filename = 'report.pdf';

        if(selectedReport === 'Customer Master Report' && reportData.length > 0 && 'customer_first_name' in reportData[0]) {
            head = [['Customer Name', 'Phone Number', 'Email', 'Address']];
            body = (reportData as User[]).map(customer => [
                `${customer.customer_first_name} ${customer.customer_last_name}`,
                customer.phone_number || '',
                customer.email_address || '',
                `${customer.address_line1 || ''}, ${customer.city || ''}`
            ]);
            filename = 'customer_report.pdf';
        } else if (selectedReport === 'Supplier Master Report' && reportData.length > 0 && 'supplier_name' in reportData[0]) {
            head = [['Supplier Name', 'Contact Person', 'Phone', 'Email']];
            body = (reportData as Supplier[]).map(supplier => [
                supplier.supplier_name,
                supplier.contact_person,
                supplier.telephone,
                supplier.email,
            ]);
            filename = 'supplier_report.pdf';
        }

        autoTable(doc, { head, body, startY: 25 });
        doc.save(filename);
    }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports Center</h1>
        <p className="text-muted-foreground">
          Access all your business analytics and insights from one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        <div className={cn("md:col-span-1", selectedReport && "hidden md:block")}>
           <Accordion type="single" collapsible className="w-full space-y-4 md:space-y-0 md:border-0 md:p-0">
            {reportCategories.map((category, index) => (
              <AccordionItem value={`item-${index}`} key={category.name} className="border-b-0 md:border-b">
                <Card className="md:shadow-none md:border-0 md:rounded-none">
                    <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline">
                        {category.name}
                    </AccordionTrigger>
                    <AccordionContent className="p-2 pt-0 md:p-0 md:pb-4">
                        <ReportList 
                            reports={category.reports}
                            selectedReport={selectedReport}
                            onSelectReport={handleSelectReport}
                        />
                    </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
           </Accordion>
        </div>

        <div className={cn("md:col-span-3 w-full", !selectedReport && "hidden md:flex")}>
            <div className="w-full space-y-8">
                {selectedReport ? (
                     <div className="w-full space-y-8">
                        <ReportFilters 
                            reportName={selectedReport} 
                            onBack={() => setSelectedReport(null)} 
                            onShowReport={handleShowReport}
                            onPrintReport={handlePrintReport}
                            onExportCsv={handleExportCSV}
                            onExportPdf={handleExportPdf}
                            reportData={reportData}
                        />
                         {reportData.length > 0 && selectedReport === 'Customer Master Report' && (
                            <CustomerReportView customers={reportData as User[]} />
                         )}
                         {reportData.length > 0 && selectedReport === 'Supplier Master Report' && (
                            <SupplierReportView suppliers={reportData as Supplier[]} />
                         )}
                          {reportData.length > 0 && selectedReport === 'Item Master Report' && (
                            <ItemMasterReportView products={reportData as ProductWithVariants[]} />
                         )}
                    </div>
                ) : (
                    <div className="flex w-full items-center justify-center h-full border-2 border-dashed rounded-lg min-h-[400px]">
                        <p className="text-muted-foreground">Select a report to see filters</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
