
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  { name: 'Customer Master Report', href: '/reports/customer-report' },
  { name: 'Supplier Master Report', href: '/reports/supplier-report' },
  { name: 'Item Master Report', href: '/reports/stock-balance' },
];

const transactionReports = [
  { name: 'Transaction Summary', href: '#' },
  { name: 'Transaction by User', href: '#' },
];

const salesReports = [
    { name: 'Credit Sales', href: '/reports/credit-sales-summary' },
    { name: 'Credit Sales Summary Report', href: '/reports/credit-sales-summary' },
    { name: 'Customer Order Report', href: '/reports/customer-report' },
    { name: 'Day End Sale Report', href: '/reports/sales-summary' },
    { name: 'Free Issue Report', href: '#' },
    { name: 'Gift Vouchers', href: '#' },
    { name: 'Hourly Sales Report', href: '/reports/sales-summary' },
    { name: 'Invoice Report', href: '/reports/invoice-report' },
    { name: 'Invoice Reprint Report', href: '#' },
    { name: 'Item Movement Report', href: '/reports/bin-card' },
    { name: 'Item Wise Sales', href: '#' },
    { name: 'Receipt Report', href: '/sales/receipts' },
    { name: 'Rep Commission Report', href: '#' },
    { name: 'Sales Summary Report', href: '/reports/sales-summary' },
    { name: 'Steward Wise Sale Report', href: '#' },
    { name: 'User Wise Collection Report', href: '#' },
];

const stockReports = [
    { name: 'Stock Balance Report', href: '/reports/stock-balance' },
    { name: 'Bin Card Report', href: '/reports/bin-card' },
    { name: 'Stock Movement Report', href: '/reports/bin-card' },
];

const managementReports = [
    { name: 'Profit & Loss Statement', href: '#' },
    { name: 'Balance Sheet', href: '#' },
    { name: 'Trial Balance', href: '#' },
];

const ReportFilters = ({ reportName }: { reportName: string }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Filters for: {reportName}</CardTitle>
                <CardDescription>Set your criteria before viewing the report.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label>From Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(new Date(), 'MM/dd/yyyy')}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" /></PopoverContent>
                        </Popover>
                    </div>
                     <div className="space-y-1.5">
                        <Label>To Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(new Date(), 'MM/dd/yyyy')}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" /></PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Location</Label>
                        <Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label>Customer</Label>
                        <Input placeholder="Search Customer" />
                    </div>
                      <div className="space-y-1.5">
                        <Label>Supplier</Label>
                        <Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
                    </div>
                      <div className="space-y-1.5">
                        <Label>Section</Label>
                        <Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label>Department</Label>
                        <Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
                    </div>
                      <div className="space-y-1.5">
                        <Label>Category</Label>
                        <Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
                    </div>
                      <div className="space-y-1.5">
                        <Label>Order Type</Label>
                        <Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label>Color Lables</Label>
                        <Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
                    </div>
                      <div className="space-y-1.5">
                        <Label>Package Size</Label>
                        <Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
                    </div>
                      <div className="space-y-1.5">
                        <Label>Model</Label>
                        <Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label>Brand</Label>
                        <Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
                    </div>
                     <div className="space-y-1.5">
                        <Label>Cabinet</Label>
                        <Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem></SelectContent></Select>
                    </div>
                     <div className="space-y-1.5">
                        <Label>Item</Label>
                        <Input placeholder="Search Item" />
                    </div>
                 </div>
                 <div className="flex items-center space-x-2">
                    <Checkbox id="group-by" />
                    <Label htmlFor="group-by" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Group By RefCategory1
                    </Label>
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
    reports: {name: string, href: string}[];
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
    const [selectedReport, setSelectedReport] = useState<string | null>('Item Wise Sales');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports Center</h1>
        <p className="text-muted-foreground">
          Access all your business analytics and insights from one place.
        </p>
      </div>

      <Tabs defaultValue="sale" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="master">Master</TabsTrigger>
          <TabsTrigger value="transaction">Transaction</TabsTrigger>
          <TabsTrigger value="sale">Sale</TabsTrigger>
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
