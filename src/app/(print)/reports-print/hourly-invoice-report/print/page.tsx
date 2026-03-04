
'use client'

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import type { Location, User } from '@/lib/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/components/currency-provider';
import { fetcher } from '@/lib/api';

interface Company {
    id: string;
    company_name: string;
    company_address: string;
    company_city: string;
    company_email: string;
    company_telephone: string;
}

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

function PrintViewContent() {
  const searchParams = useSearchParams();
  const [reportData, setReportData] = useState<ReportData[] | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  
  const companyId = searchParams.get('company_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const locationId = searchParams.get('location_id');
  const customerCode = searchParams.get('customer_code');
  

  useEffect(() => {
    async function fetchData() {
        if (!companyId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Company ID is missing.' });
            setIsLoading(false);
            return;
        };

        setIsLoading(true);
        try {
            const params = new URLSearchParams({ company_id: companyId });
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (locationId) params.append('location_id', locationId);
            if (customerCode) params.append('customer_code', customerCode);

            const [reportRes, companyRes, locationRes, customerRes] = await Promise.all([
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/hourly-invoice-data?${params.toString()}`),
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies/${companyId}`),
                 locationId ? fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/locations/${locationId}`) : Promise.resolve(null),
                 customerCode ? fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${customerCode}`) : Promise.resolve(null),
            ]);

            if (!reportRes.ok) throw new Error('Failed to fetch report data');
            const resultData = await reportRes.json();
            setReportData(resultData.data);
            
            if (companyRes?.ok) setCompany(await companyRes.json());
            if (locationRes?.ok) setLocation(await locationRes.json());
            if (customerRes?.ok) setCustomer(await customerRes.json());

        } catch(error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch report data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [companyId, startDate, endDate, locationId, customerCode, toast]);

  useEffect(() => {
    if (!isLoading && reportData) {
      document.title = `Hourly Sales Report`;
      setTimeout(() => window.print(), 1000);
    }
  }, [isLoading, reportData]);

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-[800px] w-full" /></div>;
  }
  
  if (!reportData || reportData.length === 0) {
    return <div className="p-8 text-center">No data found for the selected criteria.</div>;
  }

  return (
    <div className="bg-white text-black font-sans text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8">
        <header className="flex justify-between items-start pb-4 border-b">
            <div>
                <h1 className="text-lg font-bold">{company?.company_name || "Your Company"}</h1>
                <p>{location?.address_line1}, {location?.city}</p>
                <p>{company?.company_telephone}</p>
            </div>
            <div className="text-right">
                <h2 className="text-2xl font-bold uppercase">Hourly Sales Report</h2>
                 <p className="text-xs text-gray-500">
                    Report generated on {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
                </p>
            </div>
        </header>

        <section className="mt-4 mb-6 text-xs text-gray-600">
            <h3 className="font-bold mb-1">Filters Applied:</h3>
            <div className="grid grid-cols-4 gap-x-4">
                {startDate && <div><strong>From:</strong> {format(new Date(startDate), 'dd MMM, yyyy')}</div>}
                {endDate && <div><strong>To:</strong> {format(new Date(endDate), 'dd MMM, yyyy')}</div>}
                {location && <div><strong>Location:</strong> {location.location_name}</div>}
                {customer && <div><strong>Customer:</strong> {customer.customer_first_name} {customer.customer_last_name}</div>}
            </div>
        </section>
        
        <main className="mt-6 space-y-6">
            {reportData.map(dateData => (
                <div key={dateData.date}>
                    <h3 className="text-lg font-semibold bg-gray-100 p-2 rounded-md">Date: {format(new Date(dateData.date), 'PPP')}</h3>
                    <table className="w-full text-left border-collapse mt-2">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="p-2 border border-gray-300">Hour</th>
                                <th className="p-2 border border-gray-300 text-right"># Invoices</th>
                                <th className="p-2 border border-gray-300 text-right">Total Sales</th>
                                <th className="p-2 border border-gray-300 text-right">Total Cost</th>
                                <th className="p-2 border border-gray-300 text-right">Gross Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dateData.hourly_data.map(hourData => (
                                <tr key={hourData.hour} className="border-b">
                                    <td className="p-2 border border-gray-300 font-semibold">{hourData.hour}</td>
                                    <td className="p-2 border border-gray-300 text-right">{hourData.num_invoices}</td>
                                    <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{hourData.total_sales.toFixed(2)}</td>
                                    <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{hourData.total_cost.toFixed(2)}</td>
                                    <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{hourData.gross_profit.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </main>
    </div>
  )
}

export default function PrintHourlyInvoiceReportPage() {
    return (
        <Suspense fallback={<div>Loading report...</div>}>
            <PrintViewContent />
        </Suspense>
    )
}
