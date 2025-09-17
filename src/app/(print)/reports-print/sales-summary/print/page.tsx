

'use client'

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import type { Invoice, User } from '@/lib/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { fetcher } from '@/lib/api';

interface Company {
    id: string;
    company_name: string;
    company_address: string;
    company_city: string;
    company_email: string;
    company_telephone: string;
}

function PrintViewContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [reportData, setReportData] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fromDate = searchParams.get('from_date');
  const toDate = searchParams.get('to_date');
  const locationName = searchParams.get('location');
  const companyId = searchParams.get('company_id');

  useEffect(() => {
    async function fetchData() {
        if (!companyId) return;
        setIsLoading(true);
        try {
             const params = new URLSearchParams({ 
                company_id: companyId, 
                invoice_status: '1',
                ...(fromDate && { from_date: fromDate }),
                ...(toDate && { to_date: toDate }),
            });
            const url = `https://server-erp.payshia.com/invoices/filter/hold/by-company-status?${params.toString()}`;

            const [companyRes, customerRes, invoiceRes] = await Promise.all([
                 fetcher(`https://server-erp.payshia.com/companies/${companyId}`),
                 fetcher(`https://server-erp.payshia.com/customers/company/filter/?company_id=${companyId}`),
                 fetcher(url)
            ]);
            
            if(companyRes.ok) setCompany(await companyRes.json());
            if(customerRes.ok) setCustomers(await customerRes.json());
            if (invoiceRes.ok) {
                setReportData(await invoiceRes.json());
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
      document.title = `Sale Summary Report - ${fromDate} to ${toDate}`;
      setTimeout(() => window.print(), 1000);
    }
  }, [reportData, fromDate, toDate, isLoading]);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.customer_id === customerId);
    return customer ? `${customer.customer_first_name} ${customer.customer_last_name}` : 'Walk-in Customer';
  }

  const totals = React.useMemo(() => {
    return reportData.reduce((acc, inv) => {
        acc.subTotal += parseFloat(inv.inv_amount || '0');
        acc.discount += parseFloat(inv.discount_amount || '0');
        acc.charge += parseFloat(inv.service_charge || '0');
        acc.grandTotal += parseFloat(inv.grand_total || '0');
        return acc;
    }, { subTotal: 0, discount: 0, charge: 0, grandTotal: 0, return: 0 });
  }, [reportData]);
  
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
                <h2 className="text-2xl font-bold uppercase">Sale Summary Report</h2>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="font-semibold">From Date:</span>
                    <span>{fromDate ? format(new Date(fromDate), 'dd MMM, yyyy') : 'N/A'}</span>
                    <span className="font-semibold">To Date:</span>
                    <span>{toDate ? format(new Date(toDate), 'dd MMM, yyyy') : 'N/A'}</span>
                    <span className="font-semibold">Location:</span>
                    <span>{locationName || 'All'}</span>
                </div>
            </div>
        </header>
        <p className="text-xs text-gray-600 mt-2">Report is generated on {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>

        <main className="mt-6">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#3B5998] text-white">
                        <th className="p-2 border border-gray-300">Date</th>
                        <th className="p-2 border border-gray-300">Invoice #</th>
                        <th className="p-2 border border-gray-300">Customer</th>
                        <th className="p-2 border border-gray-300 text-right">Sub Total</th>
                        <th className="p-2 border border-gray-300 text-right">Discount</th>
                        <th className="p-2 border border-gray-300 text-right">Charge</th>
                        <th className="p-2 border border-gray-300 text-right">Return</th>
                        <th className="p-2 border border-gray-300 text-right">Grand Total</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.map((invoice) => (
                        <tr key={invoice.id} className="border-b">
                            <td className="p-2 border border-gray-300">{format(new Date(invoice.invoice_date), 'yyyy-MM-dd')}</td>
                            <td className="p-2 border border-gray-300">{invoice.invoice_number}</td>
                            <td className="p-2 border border-gray-300">{getCustomerName(invoice.customer_code)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{parseFloat(invoice.inv_amount).toFixed(2)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{parseFloat(invoice.discount_amount).toFixed(2)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{parseFloat(invoice.service_charge).toFixed(2)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">0.00</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{parseFloat(invoice.grand_total).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="font-bold bg-gray-100">
                        <td colSpan={3} className="p-2 border border-gray-300 text-right">Totals</td>
                        <td className="p-2 border border-gray-300 text-right font-mono">{totals.subTotal.toFixed(2)}</td>
                        <td className="p-2 border border-gray-300 text-right font-mono">{totals.discount.toFixed(2)}</td>
                        <td className="p-2 border border-gray-300 text-right font-mono">{totals.charge.toFixed(2)}</td>
                        <td className="p-2 border border-gray-300 text-right font-mono">{totals.return.toFixed(2)}</td>
                        <td className="p-2 border border-gray-300 text-right font-mono">{totals.grandTotal.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </main>
    </div>
  )
}

export default function PrintSalesSummaryPage() {
    return (
        <Suspense fallback={<div>Loading report...</div>}>
            <PrintViewContent />
        </Suspense>
    )
}
