

'use client'

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/components/currency-provider';
import { fetcher } from '@/lib/api';
import { Banknote, CreditCard, Landmark, CircleDollarSign } from 'lucide-react';


interface Company {
    id: string;
    company_name: string;
    company_address: string;
    company_city: string;
    company_email: string;
    company_telephone: string;
}

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

const getPaymentIcon = (type: string) => {
    switch (type.toLowerCase()) {
        case 'cash': return <Banknote className="h-5 w-5 text-green-500" />;
        case 'card': return <CreditCard className="h-5 w-5 text-blue-500" />;
        case 'bank': return <Landmark className="h-5 w-5 text-purple-500" />;
        default: return <CircleDollarSign className="h-5 w-5 text-muted-foreground" />;
    }
}

function PrintViewContent() {
  const searchParams = useSearchParams();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  
  const companyId = searchParams.get('company_id');
  const locationName = searchParams.get('location');
  const date = searchParams.get('date');

  useEffect(() => {
    async function fetchData() {
        if (!companyId || !date || !locationName) {
            toast({ variant: 'destructive', title: 'Error', description: 'Required parameters are missing for the report.' });
            setIsLoading(false);
            return;
        };

        try {
            const params = new URLSearchParams({
                date: date,
                company_id: companyId,
                location_id: searchParams.get('location_id') || '',
            });
            const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/get/day-and-report?${params.toString()}`;

            const [reportRes, companyRes] = await Promise.all([
                 fetcher(url),
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies/${companyId}`),
            ]);

            if (!reportRes.ok) throw new Error('Failed to fetch report data');
            const resultData = await reportRes.json();
            setReportData(resultData.data);
            
            if (companyRes.ok) setCompany(await companyRes.json());

        } catch(error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch report data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [companyId, locationName, date, toast, searchParams]);

  useEffect(() => {
    if (!isLoading && reportData) {
      document.title = `Day End Report - ${date}`;
      setTimeout(() => window.print(), 1000);
    }
  }, [isLoading, reportData, date]);

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-[800px] w-full" /></div>;
  }
  
  if (!reportData) {
      return (
        <div className="bg-white text-black p-8 text-center">
            <h2 className="text-xl font-bold">No Data Found</h2>
            <p>There is no sales data available for the selected day.</p>
        </div>
      )
  }
  
  return (
    <div className="bg-white text-black font-sans text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8">
        <header className="flex justify-between items-start pb-4 border-b">
            <div>
                <h1 className="text-lg font-bold">{company?.company_name || "Your Company"}</h1>
                <p>{company?.company_address}</p>
                <p>{company?.company_telephone}</p>
            </div>
            <div className="text-right">
                <h2 className="text-2xl font-bold uppercase">Day End Sale Report</h2>
                <p className="font-semibold">{locationName || 'All Locations'}</p>
                <p>{date ? format(new Date(date), 'PPP') : 'N/A'}</p>
            </div>
        </header>

        <main className="mt-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="p-4 rounded-lg border bg-gray-50">
                    <h3 className="text-xs text-gray-500 uppercase font-semibold">Total Sales</h3>
                    <p className="text-2xl font-bold">{currencySymbol}{parseFloat(reportData.invoice_total).toFixed(2)}</p>
                </div>
                 <div className="p-4 rounded-lg border bg-gray-50">
                    <h3 className="text-xs text-gray-500 uppercase font-semibold">Total Receipts</h3>
                    <p className="text-2xl font-bold">{currencySymbol}{parseFloat(reportData.receipt_total).toFixed(2)}</p>
                </div>
                 <div className="p-4 rounded-lg border bg-gray-50">
                    <h3 className="text-xs text-gray-500 uppercase font-semibold">Total Returns</h3>
                    <p className="text-2xl font-bold text-red-600">-{currencySymbol}{parseFloat(reportData.return_total).toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-lg border bg-gray-50">
                    <h3 className="text-xs text-gray-500 uppercase font-semibold">Credit Sales</h3>
                    <p className="text-2xl font-bold">{currencySymbol}{parseFloat(String(reportData.creditsale)).toFixed(2)}</p>
                </div>
                 <div className="p-4 rounded-lg border-2 border-blue-600 bg-blue-50 col-span-2">
                    <h3 className="text-xs text-blue-800 uppercase font-semibold">Cash In Hand</h3>
                    <p className="text-3xl font-bold text-blue-700">{currencySymbol}{parseFloat(String(reportData.cash_inhand)).toFixed(2)}</p>
                </div>
            </div>

            <h3 className="text-md font-semibold mb-2">Receipts by Payment Type</h3>
             <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#3B5998] text-white">
                        <th className="p-2 border border-gray-300">Payment Method</th>
                        <th className="p-2 border border-gray-300 text-right">Total Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.receipts_by_payment_type.map(pm => (
                        <tr key={pm.type_id} className="border-b">
                            <td className="p-2 border border-gray-300 font-medium">{pm.type_name}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono text-base">{currencySymbol}{parseFloat(pm.amount).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    </div>
  )
}

export default function PrintDayEndSaleReportPage() {
    return (
        <Suspense fallback={<div>Loading report...</div>}>
            <PrintViewContent />
        </Suspense>
    )
}
