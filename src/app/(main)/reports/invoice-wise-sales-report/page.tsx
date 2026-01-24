
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { InvoiceWiseSalesReportView } from '@/components/reports/invoice-wise-sales-report-view';
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

interface InvoiceReportItem {
    invoice_id: string;
    invoice_number: string;
    invoice_date: string;
    customer_code: string;
    customer_first_name: string;
    customer_last_name: string;
    location_name: string;
    total_sales: string;
    discount_amount: string;
    service_charge: string;
    cost_value: string;
    net_amount: string;
    payment_status: string;
    amount_received: string;
    created_by: string;
    gross_profit: string;
}

interface ReportData {
    invoices: InvoiceReportItem[];
    summary: {
        total_invoices: number;
        total_sales: number;
        total_discount: number;
        total_service_charge: number;
        total_cost: number;
        total_net_amount: number;
        total_received: number;
        total_gross_profit: number;
        paid_invoices: number;
        pending_invoices: number;
    };
}

export default function InvoiceWiseSalesReportPage() {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const { availableLocations, company_id } = useLocation();
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

    const handleViewReport = useCallback(async () => {
        setIsFetching(true);
        setReportData(null);
        try {
            if (!company_id) throw new Error("Company ID is missing.");
            const params = new URLSearchParams({ company_id: String(company_id) });

            if (dateRange?.from) params.append('start_date', format(dateRange.from, 'yyyy-MM-dd'));
            if (dateRange?.to) params.append('end_date', format(dateRange.to, 'yyyy-MM-dd'));
            if (filterValues['location'] && filterValues['location'] !== 'all') {
                params.append('location_id', filterValues['location']);
            }
            
            const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales-invoice-wise?${params.toString()}`;
            
            const response = await fetcher(url);
            if (!response.ok) throw new Error('Failed to fetch report data');
            
            const data = await response.json();
            setReportData(data.data.report_data);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: `Could not fetch report data.` });
        } finally {
            setIsFetching(false);
        }
    }, [company_id, dateRange, filterValues, toast]);
    
    const handlePrint = () => {
        if (!reportData) {
            toast({ variant: 'destructive', title: 'No data to print', description: 'Please view the report first.' });
            return;
        }
        const params = new URLSearchParams({
            company_id: String(company_id),
            ...(dateRange?.from && { start_date: format(dateRange.from, 'yyyy-MM-dd') }),
            ...(dateRange?.to && { end_date: format(dateRange.to, 'yyyy-MM-dd') }),
            ...(filterValues['location'] && filterValues['location'] !== 'all' && { location_id: filterValues['location'] }),
        });
        const url = `/reports-print/invoice-wise-sales-report/print?${params.toString()}`;
        window.open(url, '_blank');
    };

    const locationOptions = [{ value: 'all', label: 'All Locations' }, ...availableLocations.map(l => ({ value: l.location_id, label: l.location_name }))];

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">Invoice Wise Sales Report</h1>
                    <p className="text-muted-foreground">Analyze sales performance by individual invoice.</p>
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
                 <div className="space-y-1.5">
                    <Label>Location</Label>
                    <Combobox options={locationOptions} value={filterValues['location'] || ''} onChange={(value) => handleFilterChange('location', value)} placeholder="Select location..." notFoundText="No locations found." />
                </div>
                <div className="flex items-center gap-2">
                     <Button onClick={handleViewReport} disabled={isFetching} className="w-full md:w-auto">
                         {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                         View
                     </Button>
                      <Button variant="outline" onClick={handlePrint} disabled={!reportData}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                </div>
            </div>
            
            {reportData && (
                <InvoiceWiseSalesReportView reportData={reportData} />
            )}
        </div>
    );
}

    