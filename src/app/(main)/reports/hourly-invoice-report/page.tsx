
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Loader2, Eye, ArrowLeft, Printer } from 'lucide-react';
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
import { HourlyInvoiceReportView } from '@/components/reports/hourly-invoice-report-view';

interface HourlyData {
    hour: string;
    num_invoices: number;
    total_sales: number;
    total_cost: number;
    gross_profit: number;
    invoices: any[];
}

interface ReportData {
    date: string;
    hourly_data: HourlyData[];
}

export default function HourlyInvoiceReportPage() {
    const [reportData, setReportData] = useState<ReportData[] | null>(null);
    const [customers, setCustomers] = useState<User[]>([]);
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

            const params = new URLSearchParams({ company_id: String(company_id) });

            if (dateRange?.from) params.append('start_date', format(dateRange.from, 'yyyy-MM-dd'));
            if (dateRange?.to) params.append('end_date', format(dateRange.to, 'yyyy-MM-dd'));
            if (filterValues['location'] && filterValues['location'] !== 'all') {
                params.append('location_id', filterValues['location']);
            }
             if (filterValues['customer'] && filterValues['customer'] !== 'all') {
                params.append('customer_code', filterValues['customer']);
            }
            
            const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/hourly-invoice-data?${params.toString()}`;
            
            const response = await fetcher(url);
            if (!response.ok) throw new Error('Failed to fetch report data');
            
            const data = await response.json();
            setReportData(data.data);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
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
            ...(filterValues['customer'] && filterValues['customer'] !== 'all' && { customer_code: filterValues['customer'] }),
        });
        
        const url = `/reports-print/hourly-invoice-report/print?${params.toString()}`;
        window.open(url, '_blank');
    };
    
    const customerOptions = [{ value: 'all', label: 'All Customers' }, ...customers.map(c => ({
        value: c.customer_id,
        label: `${c.customer_first_name} ${c.customer_last_name}`,
    }))];
    const locationOptions = [{ value: 'all', label: 'All Locations' }, ...availableLocations.map(l => ({ value: l.location_id, label: l.location_name }))];


    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">Hourly Sales Report</h1>
                    <p className="text-muted-foreground">Analyze sales trends by the hour.</p>
                 </div>
                 <Button variant="outline" onClick={() => router.push('/reports')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Reports
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
                 <div className="space-y-1.5">
                    <Label>Customer</Label>
                    <Combobox options={customerOptions} value={filterValues['customer'] || ''} onChange={(value) => handleFilterChange('customer', value)} placeholder="Select a customer..." notFoundText="No customers found." />
                </div>
                <div className="flex items-center gap-2">
                     <Button onClick={handleViewReport} disabled={isFetching} className="w-full">
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
                <HourlyInvoiceReportView reportData={reportData} />
            )}
        </div>
    );
}
