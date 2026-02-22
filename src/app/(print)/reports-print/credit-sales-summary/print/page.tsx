
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

interface Invoice {
    id: string;
    invoice_number: string;
    invoice_date: string;
    grand_total: string;
    payment_status: string;
    customer_code: string;
    customerName?: string; 
}

interface ReportData {
    invoices: Invoice[];
    summary: {
        total_credit_invoices: string;
        total_credit_sales_value: string;
        total_outstanding_amount: string;
        total_discount_on_credit_sales: string;
        total_cost_of_credit_sales: string;
    };
}


function PrintViewContent() {
  const searchParams = useSearchParams();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [customers, setCustomers] = useState<User[]>([]);
  const [customer, setCustomer] = useState<User | null>(null);
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
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/credit-sales-summary?${params.toString()}`),
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies/${companyId}`),
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/company/filter/?company_id=${companyId}`),
            ]);

            if (!reportRes.ok) throw new Error('Failed to fetch report data');
            const resultData = await reportRes.json();
            setReportData(resultData.data);
            
            if (companyRes.ok) setCompany(await companyRes.json());
            if (customerRes.ok) {
                const customersData = await customerRes.json() || [];
                setCustomers(customersData);
                if (customerId) {
                    setCustomer(customersData.find((c: User) => c.customer_id === customerId) || null);
                }
            }

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
      document.title = `Credit Sales Summary - ${startDate} to ${endDate}`;
      setTimeout(() => window.print(), 1000);
    }
  }, [isLoading, reportData, startDate, endDate]);

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-[800px] w-full" /></div>;
  }
  
  if (!reportData) {
    return <div className="p-8">No data found for the selected criteria.</div>;
  }

  const invoicesWithCustomer = (reportData.invoices || []).map(inv => ({
      ...inv,
      customerName: customers.find(c => c.customer_id === inv.customer_code)?.customer_first_name + ' ' + customers.find(c => c.customer_id === inv.customer_code)?.customer_last_name || 'N/A'
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
                <h2 className="text-2xl font-bold uppercase">Credit Sales Summary</h2>
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
                {customer && <div><strong>Customer:</strong> {customer.customer_first_name} {customer.customer_last_name}</div>}
            </div>
        </section>
        
        <main className="mt-6">
            <div className="grid grid-cols-4 gap-4 mb-6 text-center">
                <div className="p-2 rounded-md border bg-gray-50">
                    <p className="text-xs text-gray-500">Credit Invoices</p>
                    <p className="text-lg font-bold">{summary.total_credit_invoices}</p>
                </div>
                <div className="p-2 rounded-md border bg-gray-50">
                    <p className="text-xs text-gray-500">Total Credit Sales</p>
                    <p className="text-lg font-bold">{currencySymbol}{parseFloat(summary.total_credit_sales_value).toFixed(2)}</p>
                </div>
                <div className="p-2 rounded-md border bg-gray-50">
                    <p className="text-xs text-gray-500">Outstanding Amount</p>
                    <p className="text-lg font-bold text-red-600">{currencySymbol}{parseFloat(summary.total_outstanding_amount).toFixed(2)}</p>
                </div>
                 <div className="p-2 rounded-md border bg-gray-50">
                    <p className="text-xs text-gray-500">Total Cost</p>
                    <p className="text-lg font-bold">{currencySymbol}{parseFloat(summary.total_cost_of_credit_sales).toFixed(2)}</p>
                </div>
            </div>

            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#3B5998] text-white">
                        <th className="p-2 border border-gray-300">Invoice #</th>
                        <th className="p-2 border border-gray-300">Date</th>
                        <th className="p-2 border border-gray-300">Customer</th>
                        <th className="p-2 border border-gray-300">Status</th>
                        <th className="p-2 border border-gray-300 text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {invoicesWithCustomer.map((invoice) => (
                        <tr key={invoice.id} className="border-b">
                            <td className="p-2 border border-gray-300">{invoice.invoice_number}</td>
                            <td className="p-2 border border-gray-300">{format(new Date(invoice.invoice_date), 'yyyy-MM-dd')}</td>
                            <td className="p-2 border border-gray-300">{invoice.customerName}</td>
                            <td className="p-2 border border-gray-300">{invoice.payment_status}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{parseFloat(invoice.grand_total).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    </div>
  )
}

export default function PrintCreditSalesSummaryPage() {
    return (
        <Suspense fallback={<div>Loading report...</div>}>
            <PrintViewContent />
        </Suspense>
    )
}
