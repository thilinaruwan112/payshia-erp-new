
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { allReports } from '@/lib/report-list';
import { ReportList } from '@/components/reports/report-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportsCenterPage() {
    const router = useRouter();

    const handleSelectReport = (href: string) => {
        if (href && href !== '#') {
            router.push(href);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Reports Center</h1>
                <p className="text-muted-foreground">
                    Select a report from the list below to view its details.
                </p>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>All Reports</CardTitle>
                    <CardDescription>Select a report to view and generate.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1">
                            <ReportList
                                reportCategories={allReports.reduce((acc: {name: string, reports: {name: string, href: string, filters: string[]}[]}[] , report: {name: string, href: string, filters: string[]}) => {
                                     const category = reportCategories.find(c => c.reports.some(r => r.name === report.name));
                                     if (category) {
                                         let existingCategory = acc.find(c => c.name === category.name);
                                         if (!existingCategory) {
                                             existingCategory = { name: category.name, reports: [] };
                                             acc.push(existingCategory);
                                         }
                                         existingCategory.reports.push(report);
                                     }
                                     return acc;
                                }, [])}
                                selectedReport={null}
                                onSelectReport={(reportName) => {
                                    const report = allReports.find(r => r.name === reportName);
                                    if (report) {
                                        handleSelectReport(report.href);
                                    }
                                }}
                            />
                        </div>
                        <div className="md:col-span-3">
                           {/* Content for selected report will be on its own page now */}
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p>Select a report from the left to get started.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
             </Card>
        </div>
    );
}

const reportCategories = [
    { name: 'Master', reports: [] },
    { name: 'Purchasing', reports: [] },
    { name: 'Stock', reports: [] },
    { name: 'Sale', reports: [] },
    { name: 'Management', reports: [] },
];
