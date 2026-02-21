
'use client'

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
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

interface InvoiceReportItem {
    invoice_id: string;
    invoice_number: string;
    invoice_date: string;
    customer_first_name: string;
    customer_last_name: string;
    total_sales: string;
    cost_value: string;
    gross_profit: string;
    discount_amount: string;
    service_charge: string;
    net_amount: string;
}

interface ReportData {
    invoices: InvoiceReportItem[];
    summary: {
        total_sales: number;
        total_cost: number;
        total_gross_profit: number;
        total_discount: number;
        total_service_charge: number;
        total_net_amount: number;
    };
}


function PrintViewContent() {
  const searchParams = useSearchParams();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  
  const companyId = searchParams.get('company_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const locationId = searchParams.get('location_id');

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

            const [reportRes, companyRes] = await Promise.all([
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales-invoice-wise?${params.toString()}`),
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies/${companyId}`),
            ]);

            if (!reportRes.ok) throw new Error('Failed to fetch report data');
            const resultData = await reportRes.json();
            setReportData(resultData.data.report_data);
            
            if (companyRes.ok) setCompany(await companyRes.json());
        } catch(error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch report data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [companyId, startDate, endDate, locationId, toast]);

  useEffect(() => {
    if (!isLoading && reportData) {
      document.title = `Invoice Wise Sales - ${startDate} to ${endDate}`;
      setTimeout(() => window.print(), 1000);
    }
  }, [isLoading, reportData, startDate, endDate]);

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-[800px] w-full" /></div>;
  }
  
  if (!reportData || !reportData.invoices) {
    return <div className="p-8">No data found for the selected criteria.</div>;
  }

  const { summary, invoices } = reportData;

  return (
    <div className="bg-white text-black font-sans text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8">
        <header className="flex justify-between items-start pb-4 border-b">
            <div>
                <h1 className="text-lg font-bold">{company?.company_name || "Your Company"}</h1>
                <p>{company?.company_address}</p>
                <p>{company?.company_telephone}</p>
            </div>
            <div className="text-right">
                <h2 className="text-2xl font-bold uppercase">Invoice Wise Sales</h2>
                <p className="text-xs">
                    {startDate && endDate ? `${format(new Date(startDate), 'dd/MM/yy')} to ${format(new Date(endDate), 'dd/MM/yy')}` : 'All Time'}
                </p>
            </div>
        </header>
        
        <main className="mt-6">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#3B5998] text-white">
                        <th className="p-2 border border-gray-300">Invoice #</th>
                        <th className="p-2 border border-gray-300">Date</th>
                        <th className="p-2 border border-gray-300">Customer</th>
                        <th className="p-2 border border-gray-300 text-right">Sales</th>
                        <th className="p-2 border border-gray-300 text-right">Discount</th>
                        <th className="p-2 border border-gray-300 text-right">Svc. Charge</th>
                        <th className="p-2 border border-gray-300 text-right">Net Amount</th>
                        <th className="p-2 border border-gray-300 text-right">Cost</th>
                        <th className="p-2 border border-gray-300 text-right">Profit</th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.map((invoice) => (
                        <tr key={invoice.invoice_id} className="border-b">
                            <td className="p-2 border border-gray-300">{invoice.invoice_number}</td>
                            <td className="p-2 border border-gray-300">{format(new Date(invoice.invoice_date), 'yyyy-MM-dd')}</td>
                            <td className="p-2 border border-gray-300">{invoice.customer_first_name} {invoice.customer_last_name}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{parseFloat(invoice.total_sales).toFixed(2)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{parseFloat(invoice.discount_amount).toFixed(2)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{parseFloat(invoice.service_charge).toFixed(2)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{parseFloat(invoice.net_amount).toFixed(2)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{parseFloat(invoice.cost_value).toFixed(2)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{parseFloat(invoice.gross_profit).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
                 {summary && (
                    <tfoot>
                        <tr className="font-bold bg-gray-100 border-t-2 border-gray-300">
                            <td colSpan={3} className="p-2 border border-gray-300 text-right">Totals</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{(summary.total_sales || 0).toFixed(2)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{(summary.total_discount || 0).toFixed(2)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{(summary.total_service_charge || 0).toFixed(2)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{(summary.total_net_amount || 0).toFixed(2)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{(summary.total_cost || 0).toFixed(2)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{(summary.total_gross_profit || 0).toFixed(2)}</td>
                        </tr>
                    </tfoot>
                 )}
            </table>
        </main>
    </div>
  )
}

export default function PrintInvoiceWiseSalesReportPage() {
    return (
        <Suspense fallback={<div>Loading report...</div>}>
            <PrintViewContent />
        </Suspense>
    )
}
