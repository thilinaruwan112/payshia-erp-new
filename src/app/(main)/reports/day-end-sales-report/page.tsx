
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import type { PaymentMethod } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { DayEndSalesReportView } from '@/components/reports/day-end-sales-report-view';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Loader2, Eye, Printer, ArrowLeft } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fetcher } from '@/lib/api';
import { useLocation } from '@/components/location-provider';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface ReportData {
    invoice_total: string;
    receipt_total: string;
    return_total: string;
    refund_total: string;
    cash_inhand: number;
    creditsale: number;
    receipts_by_payment_type: {
        type_id: string;
        type_name: string;
        amount: string;
    }[];
}

export default function DayEndSalesReportPage() {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const { availableLocations, company_id } = useLocation();
    const { toast } = useToast();
    const [singleDate, setSingleDate] = useState<Date | undefined>(new Date());
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [isFetching, setIsFetching] = useState(false);
    const router = useRouter();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(true);

    const handleFilterChange = (filterName: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [filterName]: value }));
    };

    useEffect(() => {
      if (availableLocations.length > 0) {
        setIsLoadingLocations(false);
      }
    }, [availableLocations]);

    useEffect(() => {
        async function fetchPaymentMethods() {
            if (!company_id) return;
            try {
                const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/payment-method/filter/by-company?company_id=${company_id}`);
                if (!response.ok) throw new Error(`Failed to fetch payment methods`);
                const data = await response.json();
                setPaymentMethods(data || []);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: `Could not fetch payment methods.` });
            }
        }
        fetchPaymentMethods();
    }, [company_id, toast]);

    const handleViewReport = useCallback(async () => {
        setIsFetching(true);
        setReportData(null);
        try {
            if (!company_id) throw new Error("Company ID is missing.");
            if (!singleDate) {
                toast({ variant: 'destructive', title: 'Date Required', description: 'Please select a date.' });
                setIsFetching(false);
                return;
            }
             if (!filterValues['location'] || filterValues['location'] === 'all') {
                toast({ variant: 'destructive', title: 'Location Required', description: 'Please select a location.' });
                setIsFetching(false);
                return;
            }
            const params = new URLSearchParams({ 
                company_id: String(company_id),
                date: format(singleDate, 'yyyy-MM-dd'),
                location_id: filterValues['location'],
            });
            if (filterValues['payment_type'] && filterValues['payment_type'] !== 'all') {
                params.append('payment_type', filterValues['payment_type']);
            }
            const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/get/day-and-report?${params.toString()}`;
            
            const response = await fetcher(url);
            if (!response.ok) throw new Error('Failed to fetch report data');
            
            const data = await response.json();
            setReportData(data);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
            setIsFetching(false);
        }
    }, [company_id, singleDate, filterValues, toast]);

    const handlePrint = () => {
      if (!singleDate || !filterValues['location']) {
        toast({ variant: 'destructive', title: 'Filters Missing', description: 'Please select a date and location to print.' });
        return;
      }
      const location = availableLocations.find(l => l.location_id === filterValues['location']);
      
      const params = new URLSearchParams({
        date: format(singleDate, 'yyyy-MM-dd'),
        location: location?.location_name || '',
        company_id: String(company_id),
        location_id: filterValues['location'],
      });

      if (filterValues['payment_type'] && filterValues['payment_type'] !== 'all') {
        params.append('payment_type', filterValues['payment_type']);
      }

      const url = `/reports-print/day-end-sale/print?${params.toString()}`;
      window.open(url, '_blank');
    };
    
    const locationOptions = [{ value: 'all', label: 'All Locations' }, ...availableLocations.map(l => ({ value: l.location_id, label: l.location_name }))];
    const paymentMethodOptions = [{ value: 'all', label: 'All Payment Types' }, ...paymentMethods.map(pm => ({ value: pm.id, label: pm.method }))];


    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">Day End Sale Report</h1>
                    <p className="text-muted-foreground">A summary of daily sales and payment collections.</p>
                 </div>
                 <Button variant="outline" onClick={() => router.push('/reports')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Reports
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !singleDate && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {singleDate ? format(singleDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={singleDate} onSelect={setSingleDate} />
                        </PopoverContent>
                    </Popover>
                </div>
                 <div className="space-y-1.5">
                    <Label>Location</Label>
                    {isLoadingLocations ? <Skeleton className="h-10 w-full" /> : (
                        <Combobox options={locationOptions} value={filterValues['location'] || ''} onChange={(value) => handleFilterChange('location', value)} placeholder="Select location..." notFoundText="No locations found." />
                    )}
                </div>
                <div className="space-y-1.5">
                    <Label>Payment Type</Label>
                    <Combobox options={paymentMethodOptions} value={filterValues['payment_type'] || ''} onChange={(value) => handleFilterChange('payment_type', value)} placeholder="All payment types" notFoundText="No types found." />
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
                <DayEndSalesReportView reportData={reportData} />
            )}
        </div>
    );
}
