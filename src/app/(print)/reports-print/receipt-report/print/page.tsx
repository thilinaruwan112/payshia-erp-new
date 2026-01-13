
'use client'

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import type { User } from '@/lib/types';
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

interface Receipt {
    receipt_id: string;
    rec_number: string;
    receipt_date: string;
    now_time: string;
    payment_mode: string;
    amount: string;
    invoice_id: string;
    customer_id: string;
    customerName?: string;
}

interface ReportData {
    summary: {
        total_count: number;
        total_value: number;
    };
    data: Receipt[];
}

const getPaymentMethodText = (type: string) => {
    switch (type) {
        case '0': return 'Cash';
        case '1': return 'Card';
        case '2': return 'Bank Transfer';
        default: return type;
    }
}

function PrintViewContent() {
  const searchParams = useSearchParams();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [customers, setCustomers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  
  const companyId = searchParams.get('company_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const customerId = searchParams.get('customer_id');

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
            if (customerId) params.append('customer_id', customerId);

            const [reportRes, companyRes, customerRes] = await Promise.all([
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/receipt-data?${params.toString()}`),
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies/${companyId}`),
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/company/filter/?company_id=${companyId}`),
            ]);

            if (!reportRes.ok) throw new Error('Failed to fetch report data');
            const resultData = await reportRes.json();
            setReportData(resultData);
            
            if (companyRes.ok) setCompany(await companyRes.json());
            if (customerRes.ok) setCustomers((await customerRes.json()) || []);

        } catch(error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch report data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [companyId, startDate, endDate, customerId, toast]);

  useEffect(() => {
    if (!isLoading && reportData) {
      document.title = `Receipt Report - ${startDate} to ${endDate}`;
      setTimeout(() => window.print(), 1000);
    }
  }, [isLoading, reportData, startDate, endDate]);

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-[800px] w-full" /></div>;
  }
  
  if (!reportData) {
    return <div className="p-8">No data found for the selected criteria.</div>;
  }

  const receiptsWithCustomer = (reportData.data || []).map(rec => ({
      ...rec,
      customerName: customers.find(c => c.customer_id === rec.customer_id)?.name || 'Walk-in Customer'
  }));

  const { summary } = reportData;

  return (
    <div className="bg-white text-black font-sans text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8">
        <header className="flex justify-between items-start pb-4 border-b">
            <div>
                <h1 className="text-lg font-bold">{company?.company_name || "Your Company"}</h1>
                <p>{company?.company_address}</p>
                <p>{company?.company_telephone}</p>
            </div>
            <div className="text-right">
                <h2 className="text-2xl font-bold uppercase">POS Receipt Report</h2>
                <p className="text-xs">
                    {startDate && endDate ? `${format(new Date(startDate), 'dd/MM/yy')} to ${format(new Date(endDate), 'dd/MM/yy')}` : 'All Time'}
                </p>
            </div>
        </header>
        
        <main className="mt-6">
            <div className="grid grid-cols-2 gap-4 mb-6 text-center">
                <div className="p-2 rounded-md border bg-gray-50">
                    <p className="text-xs text-gray-500">Total Receipts</p>
                    <p className="text-lg font-bold">{summary.total_count}</p>
                </div>
                <div className="p-2 rounded-md border bg-gray-50">
                    <p className="text-xs text-gray-500">Total Value</p>
                    <p className="text-lg font-bold">{currencySymbol}{parseFloat(String(summary.total_value)).toFixed(2)}</p>
                </div>
            </div>

            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#3B5998] text-white">
                        <th className="p-2 border border-gray-300">Receipt #</th>
                        <th className="p-2 border border-gray-300">Date</th>
                        <th className="p-2 border border-gray-300">Customer</th>
                        <th className="p-2 border border-gray-300">Payment Method</th>
                        <th className="p-2 border border-gray-300 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {receiptsWithCustomer.map((receipt) => (
                        <tr key={receipt.receipt_id} className="border-b">
                            <td className="p-2 border border-gray-300">{receipt.rec_number}</td>
                            <td className="p-2 border border-gray-300">{format(new Date(receipt.now_time), 'yyyy-MM-dd HH:mm')}</td>
                            <td className="p-2 border border-gray-300">{receipt.customerName}</td>
                            <td className="p-2 border border-gray-300">{getPaymentMethodText(receipt.payment_mode)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{parseFloat(receipt.amount).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    </div>
  )
}

export default function PrintReceiptReportPage() {
    return (
        <Suspense fallback={<div>Loading report...</div>}>
            <PrintViewContent />
        </Suspense>
    )
}
