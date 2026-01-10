
'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React from 'react';

const ReportListInner = ({ reports, selectedReport, onSelectReport }: { 
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

export function ReportList({ reportCategories, selectedReport, onSelectReport }: {
    reportCategories: {name: string; reports: {name: string; href: string; filters: string[]}[]}[],
    selectedReport: string | null,
    onSelectReport: (name: string) => void
}) {
    return (
        <Accordion type="multiple" className="w-full space-y-4 md:space-y-0 md:border-0 md:p-0" defaultValue={reportCategories.map(c => c.name)}>
        {reportCategories.map((category, index) => (
          <AccordionItem value={category.name} key={category.name} className="border-b-0 md:border-b">
            <Card className="md:shadow-none md:border-0 md:rounded-none">
                <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline">
                    {category.name}
                </AccordionTrigger>
                <AccordionContent className="p-2 pt-0 md:p-0 md:pb-4">
                    <ReportListInner 
                        reports={category.reports}
                        selectedReport={selectedReport}
                        onSelectReport={onSelectReport}
                    />
                </AccordionContent>
            </Card>
          </AccordionItem>
        ))}
       </Accordion>
    )
}
