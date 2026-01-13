
'use client';

import { useRouter } from 'next/navigation';
import { allReports, reportCategories } from '@/lib/report-list';
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
                    <ReportList
                        reportCategories={reportCategories}
                        selectedReport={null}
                        onSelectReport={(reportName) => {
                            const report = allReports.find(r => r.name === reportName);
                            if (report) {
                                handleSelectReport(report.href);
                            }
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
