

'use client'

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import type { Invoice, User } from '@/lib/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case 'Sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'Paid': case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

const getStatusText = (status: string): string => {
    if (status === '1') return 'Active';
    return status;
}

function PrintViewContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  const [reportData, setReportData] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const companyId = searchParams.get('company_id');
  const fromDate = searchParams.get('from_date');
  const toDate = searchParams.get('to_date');


  useEffect(() => {
    async function fetchData() {
        if (!companyId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Company ID is missing.' });
            setIsLoading(false);
            return;
        };

        setIsLoading(true);
        try {
            const params = new URLSearchParams({ 
                company_id: companyId, 
                invoice_status: '1',
                ...(fromDate && { from_date: fromDate }),
                ...(toDate && { to_date: toDate }),
            });
            const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/invoices/filter/hold/by-company-status?${params.toString()}`;
            const [companyRes, customerRes, invoiceRes] = await Promise.all([
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies/${companyId}`),
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/company/filter/?company_id=${companyId}`),
                 fetcher(url),
            ]);

            if(companyRes.ok) setCompany(await companyRes.json());
            if(customerRes.ok) setCustomers(await customerRes.json());
            if(invoiceRes.ok) {
                setReportData((await invoiceRes.json()) || []);
            } else {
                 throw new Error('Failed to fetch invoice data');
            }

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load report data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [companyId, fromDate, toDate, toast]);

  useEffect(() => {
    if (reportData.length > 0 && !isLoading) {
      document.title = `Invoice Report`;
      setTimeout(() => window.print(), 1000);
    }
  }, [reportData, isLoading]);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.customer_id === customerId);
    return customer ? `${customer.customer_first_name} ${customer.customer_last_name}` : 'Walk-in Customer';
  }

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-[800px] w-full" /></div>;
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
                <h2 className="text-2xl font-bold uppercase">Invoice Report</h2>
                 <p className="text-xs text-gray-500">
                    Report generated on {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
                </p>
            </div>
        </header>

        <section className="mt-4 mb-6 text-xs text-gray-600">
            <h3 className="font-bold mb-1">Filters Applied:</h3>
            <div className="grid grid-cols-4 gap-x-4">
                {fromDate && <div><strong>From:</strong> {format(new Date(fromDate), 'dd MMM, yyyy')}</div>}
                {toDate && <div><strong>To:</strong> {format(new Date(toDate), 'dd MMM, yyyy')}</div>}
            </div>
        </section>

        <main className="mt-6">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#3B5998] text-white">
                        <th className="p-2 border border-gray-300">Invoice #</th>
                        <th className="p-2 border border-gray-300">Customer</th>
                        <th className="p-2 border border-gray-300">Date</th>
                        <th className="p-2 border border-gray-300">Status</th>
                        <th className="p-2 border border-gray-300 text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.map((invoice) => {
                        const statusText = getStatusText(invoice.invoice_status);
                        return (
                             <tr key={invoice.id} className="border-b">
                                <td className="p-2 border border-gray-300">{invoice.invoice_number}</td>
                                <td className="p-2 border border-gray-300">{getCustomerName(invoice.customer_code)}</td>
                                <td className="p-2 border border-gray-300">{format(new Date(invoice.invoice_date), 'yyyy-MM-dd')}</td>
                                <td className="p-2 border border-gray-300">
                                     <span className={cn('px-2 py-0.5 rounded-md text-xs font-semibold', getStatusColor(statusText))}>
                                        {statusText}
                                    </span>
                                </td>
                                <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{parseFloat(invoice.grand_total).toFixed(2)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </main>
    </div>
  )
}

export default function PrintInvoiceReportPage() {
    return (
        <Suspense fallback={<div>Loading report...</div>}>
            <PrintViewContent />
        </Suspense>
    )
}
