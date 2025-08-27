
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';


const masterReports = [
  { name: 'Customer Master Report', href: '/reports/customer-report', filters: ['customer'] },
  { name: 'Supplier Master Report', href: '/reports/supplier-report', filters: ['supplier'] },
  { name: 'Item Master Report', href: '/reports/stock-balance', filters: ['item', 'category', 'brand'] },
];

const transactionReports = [
  { name: 'Transaction Summary', href: '#', filters: ['dateRange', 'location', 'user'] },
  { name: 'Transaction by User', href: '#', filters: ['dateRange', 'user'] },
];

const salesReports = [
    { name: 'Credit Sales Summary Report', href: '/reports/credit-sales-summary', filters: ['dateRange', 'customer', 'location'] },
    { name: 'Customer Order Report', href: '/reports/customer-report', filters: ['dateRange', 'customer'] },
    { name: 'Day End Sale Report', href: '/reports/sales-summary', filters: ['date', 'location'] },
    { name: 'Hourly Sales Report', href: '/reports/sales-summary', filters: ['date', 'location'] },
    { name: 'Invoice Report', href: '/reports/invoice-report', filters: ['dateRange', 'customer', 'status'] },
    { name: 'Item Wise Sales', href: '#', filters: ['dateRange', 'item', 'category', 'brand', 'location'] },
    { name: 'Receipt Report', href: '/sales/receipts', filters: ['dateRange', 'customer'] },
    { name: 'Sales Summary Report', href: '/reports/sales-summary', filters: ['dateRange', 'location', 'user'] },
];

const purchasingReports = [
    { name: 'Purchase Order Report', href: '/purchasing/purchase-orders', filters: ['dateRange', 'supplier', 'status'] },
    { name: 'GRN Report', href: '/purchasing/grn', filters: ['dateRange', 'supplier'] },
];

const stockReports = [
    { name: 'Stock Balance Report', href: '/reports/stock-balance', filters: ['location', 'category', 'brand', 'item'] },
    { name: 'Bin Card Report', href: '/reports/bin-card', filters: ['dateRange', 'location', 'item'] },
    { name: 'Stock Movement Report', href: '/reports/bin-card', filters: ['dateRange', 'location', 'item'] },
    { name: 'Stock Transfer Report', href: '/transfers', filters: ['dateRange', 'fromLocation', 'toLocation'] },
];

const managementReports = [
    { name: 'Profit & Loss Statement', href: '#', filters: ['dateRange'] },
    { name: 'Balance Sheet', href: '#', filters: ['date'] },
    { name: 'Trial Balance', href: '#', filters: ['date'] },
];

const allReports = [...masterReports, ...transactionReports, ...salesReports, ...purchasingReports, ...stockReports, ...managementReports];


const ReportFilters = ({ reportName }: { reportName: string }) => {
    const report = allReports.find(r => r.name === reportName);
    const filters = report?.filters || [];

    const hasFilter = (filterName: string) => filters.includes(filterName);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Filters for: {reportName}</CardTitle>
                <CardDescription>Set your criteria before viewing the report.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hasFilter('dateRange') && (
                        <>
                        <div className="space-y-1.5">
                            <Label>From Date</Label>
                            <Popover>
                                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{format(new Date(), 'MM/dd/yyyy')}</Button></PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" /></PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-1.5">
                            <Label>To Date</Label>
                            <Popover>
                                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{format(new Date(), 'MM/dd/yyyy')}</Button></PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" /></PopoverContent>
                            </Popover>
                        </div>
                        </>
                    )}
                     {hasFilter('date') && (
                        <div className="space-y-1.5">
                            <Label>Date</Label>
                            <Popover>
                                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{format(new Date(), 'MM/dd/yyyy')}</Button></PopoverTrigger>
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
                        <Input placeholder="Search Customer" />
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
            <CardFooter>
                 <Button>View Report</Button>
            </CardFooter>
        </Card>
    )
}

const ReportList = ({ title, reports, selectedReport, onSelectReport }: { 
    title: string; 
    reports: {name: string, href: string, filters: string[]}[];
    selectedReport: string | null;
    onSelectReport: (name: string) => void;
}) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle className="text-xl">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col">
                    {reports.map((report) => (
                        <button key={report.name} onClick={() => onSelectReport(report.name)}
                            className={cn(
                                "text-left py-3 px-2 rounded-md",
                                selectedReport === report.name ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'
                            )}
                        >
                            {report.name}
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
        <div className="lg:col-span-2">
            {selectedReport ? <ReportFilters reportName={selectedReport} /> : (
                <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Select a report to see filters</p>
                </div>
            )}
        </div>
    </div>
)


export default function ReportsPage() {
    const [selectedReport, setSelectedReport] = useState<string | null>('Sales Summary Report');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports Center</h1>
        <p className="text-muted-foreground">
          Access all your business analytics and insights from one place.
        </p>
      </div>

      <Tabs defaultValue="sale" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="master">Master</TabsTrigger>
          <TabsTrigger value="transaction">Transaction</TabsTrigger>
          <TabsTrigger value="sale">Sale</TabsTrigger>
          <TabsTrigger value="purchasing">Purchasing</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>
        <TabsContent value="master">
            <ReportList title="Master Reports" reports={masterReports} selectedReport={selectedReport} onSelectReport={setSelectedReport} />
        </TabsContent>
        <TabsContent value="transaction">
            <ReportList title="Transaction Reports" reports={transactionReports} selectedReport={selectedReport} onSelectReport={setSelectedReport} />
        </TabsContent>
        <TabsContent value="sale">
            <ReportList title="Sales Reports" reports={salesReports} selectedReport={selectedReport} onSelectReport={setSelectedReport} />
        </TabsContent>
        <TabsContent value="purchasing">
            <ReportList title="Purchasing Reports" reports={purchasingReports} selectedReport={selectedReport} onSelectReport={setSelectedReport} />
        </TabsContent>
        <TabsContent value="stock">
            <ReportList title="Stock Reports" reports={stockReports} selectedReport={selectedReport} onSelectReport={setSelectedReport} />
        </TabsContent>
         <TabsContent value="management">
            <ReportList title="Management Reports" reports={managementReports} selectedReport={selectedReport} onSelectReport={setSelectedReport} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
