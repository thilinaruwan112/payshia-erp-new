
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import Link from 'next/link';
import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { type User, type Supplier, type Brand } from '@/lib/types';
import { Combobox } from '@/components/ui/combobox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const reportCategories = [
    { 
        name: 'Master', 
        reports: [
            { name: 'Customer Master Report', href: '/reports/customer-report', filters: ['customer'] },
            { name: 'Supplier Master Report', href: '/reports/supplier-report', filters: ['supplier'] },
            { name: 'Item Master Report', href: '/reports/stock-balance', filters: ['item', 'category', 'brand'] },
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

const ReportFilters = ({ reportName, onBack, onShowReport, onPrintReport, reportData }: { 
    reportName: string, 
    onBack: () => void, 
    onShowReport: (data: User[]) => void,
    onPrintReport: () => void,
    reportData: User[],
}) => {
    const report = allReports.find(r => r.name === reportName);
    const filters = report?.filters || [];
    const { company_id } = useLocation();
    const { toast } = useToast();
    const [customers, setCustomers] = useState<User[]>([]);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        async function fetchCustomers() {
            if (filters.includes('customer') && company_id) {
                try {
                    const response = await fetch(`https://server-erp.payshia.com/customers/company/filter/?company_id=${company_id}`);
                    if (!response.ok) throw new Error('Failed to fetch customers');
                    const data = await response.json();
                    setCustomers(data || []);
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch customer list.'});
                }
            }
        }
        fetchCustomers();
    }, [reportName, filters, company_id, toast]);

    const customerOptions = customers.map(c => ({
        value: c.customer_id,
        label: `${c.customer_first_name} ${c.customer_last_name}`,
    }));

    const hasFilter = (filterName: string) => filters.includes(filterName);

    const handleViewReport = async () => {
        if (reportName === 'Customer Master Report') {
            setIsFetching(true);
             try {
                const response = await fetch(`https://server-erp.payshia.com/customers/company/filter/?company_id=${company_id}`);
                if (!response.ok) throw new Error('Failed to fetch customers for report');
                const data = await response.json();
                onShowReport(data || []);
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch customer report data.'});
            } finally {
                setIsFetching(false);
            }
        } else {
            toast({
                title: "Coming Soon",
                description: "This report is not yet available for viewing.",
            });
        }
    };

    const handleExportCSV = () => {
        if (reportData.length === 0) {
            toast({ variant: 'destructive', title: 'No data', description: 'Please view the report first to export.' });
            return;
        }
        const headers = ["Customer Name", "Phone Number", "Email", "Address"];
        const rows = reportData.map(customer => [
            `"${customer.customer_first_name} ${customer.customer_last_name}"`,
            customer.phone_number,
            customer.email_address,
            `"${customer.address_line1}, ${customer.city}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", "customer_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    const handleExportPDF = () => {
        if (reportData.length === 0) {
            toast({ variant: 'destructive', title: 'No data', description: 'Please view the report first to export.' });
            return;
        }

        const doc = new jsPDF();
        doc.text("Customer Master Report", 14, 16);
        autoTable(doc, {
            head: [['Customer Name', 'Phone Number', 'Email', 'Address']],
            body: reportData.map(customer => [
                `${customer.customer_first_name} ${customer.customer_last_name}`,
                customer.phone_number,
                customer.email_address,
                `${customer.address_line1}, ${customer.city}`
            ]),
            startY: 25,
        });

        doc.save('customer_report.pdf');
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
                        <Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
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
                            <Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
                        </div>
                    )}
                    {hasFilter('brand') && (
                        <div className="space-y-1.5">
                            <Label>Brand</Label>
                            <Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
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
                <Button variant="outline" onClick={handleExportCSV} disabled={reportData.length === 0}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
                <Button variant="outline" onClick={handleExportPDF} disabled={reportData.length === 0}>
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
    const [reportData, setReportData] = useState<User[]>([]);
    const { company_id } = useLocation();
    const { toast } = useToast();

    const handleShowReport = (data: User[]) => {
        setReportData(data);
    };
    
    const handleSelectReport = (name: string) => {
        setSelectedReport(name);
        setReportData([]);
    }
    
    const handlePrintReport = () => {
        if (selectedReport === 'Customer Master Report') {
            window.open(`/reports-print/customer-report/print?company_id=${company_id}`, '_blank');
        } else {
            toast({
                title: "Coming Soon",
                description: "This report is not yet available for printing.",
            });
        }
    };


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
                    <ReportFilters 
                        reportName={selectedReport} 
                        onBack={() => setSelectedReport(null)} 
                        onShowReport={handleShowReport}
                        onPrintReport={handlePrintReport}
                        reportData={reportData}
                    />
                ) : (
                    <div className="flex w-full items-center justify-center h-full border-2 border-dashed rounded-lg min-h-[400px]">
                        <p className="text-muted-foreground">Select a report to see filters</p>
                    </div>
                )}
                 {reportData.length > 0 && selectedReport === 'Customer Master Report' && (
                    <CustomerReportView customers={reportData} />
                 )}
            </div>
        </div>
      </div>
    </div>
  );
}
