
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, CreditCard, FileText, LineChart, Star, Truck, User, Wallet } from 'lucide-react';
import Link from 'next/link';

const reports = [
    {
        href: '/reports/sales-summary',
        icon: <LineChart className="w-8 h-8" />,
        title: 'Sales Summary',
        description: 'Analyze sales performance and revenue.',
    },
    {
        href: '/reports/stock-balance',
        icon: <AreaChart className="w-8 h-8" />,
        title: 'Stock Balance',
        description: 'View current inventory levels across locations.',
    },
    {
        href: '/reports/bin-card',
        icon: <FileText className="w-8 h-8" />,
        title: 'Bin Card',
        description: 'Track the complete history of an item.',
    },
    {
        href: '/reports/customer-statement',
        icon: <User className="w-8 h-8" />,
        title: 'Customer Statement',
        description: 'Generate account statements for customers.',
    },
    {
        href: '/reports/credit-sales-summary',
        icon: <CreditCard className="w-8 h-8" />,
        title: 'Credit Sales Summary',
        description: 'Review all sales made on credit.',
    },
    {
        href: '/reports/invoice-report',
        icon: <FileText className="w-8 h-8" />,
        title: 'Invoice Report',
        description: 'A detailed breakdown of all invoices.',
    },
    {
        href: '/reports/supplier-report',
        icon: <Truck className="w-8 h-8" />,
        title: 'Supplier Report',
        description: 'Analyze purchasing activity by supplier.',
    },
    {
        href: '/reports/supplier-balance',
        icon: <Wallet className="w-8 h-8" />,
        title: 'Supplier Balance',
        description: 'View outstanding balances for suppliers.',
    },
    {
        href: '/reports/customer-report',
        icon: <Star className="w-8 h-8" />,
        title: 'Customer Report',
        description: 'Detailed insights into your customer base.',
    }
];

export default function ReportsIndexPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Reports Center</h1>
                <p className="text-muted-foreground">
                    Access all your business analytics and insights from one place.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {reports.map((report) => (
                    <Link href={report.href} key={report.href}>
                        <Card className="h-full hover:border-primary hover:shadow-lg transition-all flex flex-col">
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                <div className="p-3 bg-muted rounded-full text-primary">
                                    {report.icon}
                                </div>
                                <CardTitle>{report.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <CardDescription>{report.description}</CardDescription>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
