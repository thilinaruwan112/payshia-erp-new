
'use client'

import { ReportList } from '@/components/reports/report-list';
import { reportCategories } from '@/lib/report-list';
import { useRouter } from 'next/navigation';

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
                <div className="md:col-span-1">
                     <ReportList
                        reportCategories={reportCategories}
                        selectedReport={null}
                        onSelectReport={(reportName) => {
                            const report = reportCategories.flatMap(c => c.reports).find(r => r.name === reportName);
                            if (report) {
                                handleSelectReport(report.href);
                            }
                        }}
                    />
                </div>
                <div className="md:col-span-3">
                     <div className="flex w-full items-center justify-center h-full border-2 border-dashed rounded-lg min-h-[400px]">
                        <p className="text-muted-foreground">Select a report to continue</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
