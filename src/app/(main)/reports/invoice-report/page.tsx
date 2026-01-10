
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import type { User, Invoice } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { InvoiceReportView } from '@/components/reports/invoice-report-view';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Loader2, Eye, Printer, ArrowLeft } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fetcher } from '@/lib/api';
import { useLocation } from '@/components/location-provider';
import { useRouter } from 'next/navigation';

export default function InvoiceReportPage() {
    const [reportData, setReportData] = useState<Invoice[] | null>(null);
    const [customers, setCustomers] = useState<User[]>([]);
    const { company_id } = useLocation();
    const { toast } = useToast();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
    });
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [isFetching, setIsFetching] = useState(false);
    const router = useRouter();

    const handleFilterChange = (filterName: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [filterName]: value }));
    };

    useEffect(() => {
        async function fetchDropdownData() {
            if (!company_id) return;
            try {
                const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/company/filter/?company_id=${company_id}`);
                if (!response.ok) throw new Error(`Failed to fetch customers`);
                const data = await response.json();
                setCustomers(data || []);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: `Could not fetch customer list.` });
            }
        }
        fetchDropdownData();
    }, [company_id, toast]);

    const handleViewReport = useCallback(async () => {
        setIsFetching(true);
        setReportData(null);
        try {
            if (!company_id) throw new Error("Company ID is missing.");
            const params = new URLSearchParams({ company_id: String(company_id), invoice_status: '1' });
            
            if (dateRange?.from) params.append('from_date', format(dateRange.from, 'yyyy-MM-dd'));
            if (dateRange?.to) params.append('to_date', format(dateRange.to, 'yyyy-MM-dd'));

            const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/invoices/filter/hold/by-company-status?${params.toString()}`;
            const response = await fetcher(url);
            if (!response.ok) throw new Error('Failed to fetch report data');
            
            const data = await response.json();
            setReportData(data || []);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
            setIsFetching(false);
        }
    }, [company_id, dateRange, toast]);
    
     const handlePrint = () => {
        const from_date = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
        const to_date = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
        const url = `/reports-print/invoice-report/print?company_id=${company_id}&from_date=${from_date}&to_date=${to_date}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">Invoice Report</h1>
                    <p className="text-muted-foreground">Review invoices within a specific date range.</p>
                 </div>
                 <Button variant="outline" onClick={() => router.push('/reports')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Reports
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1.5">
                    <Label>Date Range</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal",!dateRange && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>) : (format(dateRange.from, "LLL dd, y"))) : (<span>Pick a date range</span>)}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="flex items-center gap-2">
                     <Button onClick={handleViewReport} disabled={isFetching} className="w-full md:w-auto">
                         {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                         View
                     </Button>
                     <Button variant="outline" onClick={handlePrint} disabled={!reportData || reportData.length === 0}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                </div>
            </div>
            
            {reportData && (
                <InvoiceReportView invoices={reportData} customers={customers} />
            )}
        </div>
    );
}
