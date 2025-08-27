
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
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ArrowLeft } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


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
        name: 'Transaction', 
        reports: [
            { name: 'Transaction Summary', href: '#', filters: ['dateRange', 'location', 'user'] },
            { name: 'Transaction by User', href: '#', filters: ['dateRange', 'user'] },
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
        name: 'Management',
        reports: [
            { name: 'Profit & Loss Statement', href: '#', filters: ['dateRange'] },
            { name: 'Balance Sheet', href: '#', filters: ['date'] },
            { name: 'Trial Balance', href: '#', filters: ['date'] },
        ]
    },
];

const allReports = reportCategories.flatMap(cat => cat.reports);


const ReportFilters = ({ reportName, onBack }: { reportName: string, onBack: () => void }) => {
    const report = allReports.find(r => r.name === reportName);
    const filters = report?.filters || [];

    const hasFilter = (filterName: string) => filters.includes(filterName);

    return (
        <Card>
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
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

const ReportList = ({ reports, selectedReport, onSelectReport }: { 
    reports: {name: string, href: string, filters: string[]}[];
    selectedReport: string | null;
    onSelectReport: (name: string) => void;
}) => (
     <Card>
        <CardContent className="p-2">
            <div className="flex flex-col">
                {reports.map((report) => (
                    <button key={report.name} onClick={() => onSelectReport(report.name)}
                        className={cn(
                            "text-left py-3 px-3 rounded-md text-sm",
                            selectedReport === report.name ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                        )}
                    >
                        {report.name}
                    </button>
                ))}
            </div>
        </CardContent>
    </Card>
)


export default function ReportsPage() {
    const [selectedReport, setSelectedReport] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports Center</h1>
        <p className="text-muted-foreground">
          Access all your business analytics and insights from one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className={cn("md:col-span-1", selectedReport && "hidden md:block")}>
           <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-2">
            {reportCategories.map((category, index) => (
              <Card key={category.name}>
                 <AccordionItem value={`item-${index}`} className="border-b-0">
                    <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline">
                        {category.name}
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                        <ReportList 
                            reports={category.reports}
                            selectedReport={selectedReport}
                            onSelectReport={setSelectedReport}
                        />
                    </AccordionContent>
                </AccordionItem>
              </Card>
            ))}
           </Accordion>
        </div>

        <div className={cn("md:col-span-2", !selectedReport && "hidden md:flex")}>
          {selectedReport ? (
            <ReportFilters reportName={selectedReport} onBack={() => setSelectedReport(null)} />
          ) : (
             <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg min-h-[400px]">
                <p className="text-muted-foreground">Select a report to see filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

