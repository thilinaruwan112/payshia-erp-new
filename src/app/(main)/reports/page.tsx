
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

const ReportList = ({ title, reports }: { title: string, reports: {name: string, href: string}[] }) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="divide-y">
                {reports.map((report) => (
                     <Link key={report.name} href={report.href}>
                        <div className="py-3 px-2 hover:bg-muted/50 cursor-pointer rounded-md">
                           {report.name}
                        </div>
                    </Link>
                ))}
            </div>
        </CardContent>
    </Card>
)


export default function ReportsPage() {
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
            <ReportList title="Master Reports" reports={masterReports} />
        </TabsContent>
        <TabsContent value="transaction">
            <ReportList title="Transaction Reports" reports={transactionReports} />
        </TabsContent>
        <TabsContent value="sale">
            <ReportList title="Sales Reports" reports={salesReports} />
        </TabsContent>
        <TabsContent value="stock">
            <ReportList title="Stock Reports" reports={stockReports} />
        </TabsContent>
         <TabsContent value="management">
            <ReportList title="Management Reports" reports={managementReports} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
