
'use client'

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { fetcher } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Company {
    id: string;
    company_name: string;
    company_address: string;
    company_city: string;
    company_email: string;
    company_telephone: string;
}

interface Transfer {
    id: string;
    stock_transfer_number: string;
    from_location_name: string;
    to_location_name: string;
    transfer_date: string;
    status: 'pending' | 'in-transit' | 'completed';
    total_quantity: string;
}

interface ReportData {
    transfers: Transfer[];
    summary: {
        total_transfers: number;
        pending_transfers: number;
        completed_transfers: number;
        total_quantity_transferred: number;
    };
}

const getStatusColor = (status: Transfer['status']) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'in-transit': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};


function PrintViewContent() {
  const searchParams = useSearchParams();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const companyId = searchParams.get('company_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const fromLocation = searchParams.get('from_location');
  const toLocation = searchParams.get('to_location');

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
            if (fromLocation) params.append('from_location', fromLocation);
            if (toLocation) params.append('to_location', toLocation);

            const [reportRes, companyRes] = await Promise.all([
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stock-transfer?${params.toString()}`),
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
  }, [companyId, startDate, endDate, fromLocation, toLocation, toast]);

  useEffect(() => {
    if (!isLoading && reportData) {
      document.title = `Stock Transfer Report`;
      setTimeout(() => window.print(), 1000);
    }
  }, [isLoading, reportData]);

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-[800px] w-full" /></div>;
  }
  
  if (!reportData || !reportData.transfers) {
    return <div className="p-8">No data found for the selected criteria.</div>;
  }
  
  const { summary, transfers } = reportData;

  return (
    <div className="bg-white text-black font-sans text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8">
        <header className="flex justify-between items-start pb-4 border-b">
            <div>
                <h1 className="text-lg font-bold">{company?.company_name || "Your Company"}</h1>
                <p>{company?.company_address}</p>
                <p>{company?.company_telephone}</p>
            </div>
            <div className="text-right">
                <h2 className="text-2xl font-bold uppercase">Stock Transfer Report</h2>
                <p className="text-xs">
                    {startDate && endDate ? `${format(new Date(startDate), 'dd/MM/yy')} to ${format(new Date(endDate), 'dd/MM/yy')}` : 'All Time'}
                </p>
            </div>
        </header>
        
        <main className="mt-6">
            <div className="grid grid-cols-4 gap-4 mb-6 text-center">
                <div className="p-2 rounded-md border bg-gray-50">
                    <p className="text-xs text-gray-500">Total Transfers</p>
                    <p className="text-lg font-bold">{summary?.total_transfers || 0}</p>
                </div>
                 <div className="p-2 rounded-md border bg-gray-50">
                    <p className="text-xs text-gray-500">Pending</p>
                    <p className="text-lg font-bold">{summary?.pending_transfers || 0}</p>
                </div>
                 <div className="p-2 rounded-md border bg-gray-50">
                    <p className="text-xs text-gray-500">Completed</p>
                    <p className="text-lg font-bold">{summary?.completed_transfers || 0}</p>
                </div>
                <div className="p-2 rounded-md border bg-gray-50">
                    <p className="text-xs text-gray-500">Total Qty Moved</p>
                    <p className="text-lg font-bold">{(summary?.total_quantity_transferred || 0).toLocaleString()}</p>
                </div>
            </div>

            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#3B5998] text-white">
                        <th className="p-2 border border-gray-300">Transfer #</th>
                        <th className="p-2 border border-gray-300">From</th>
                        <th className="p-2 border border-gray-300">To</th>
                        <th className="p-2 border border-gray-300">Date</th>
                        <th className="p-2 border border-gray-300">Status</th>
                        <th className="p-2 border border-gray-300 text-right">Total Qty</th>
                    </tr>
                </thead>
                <tbody>
                    {transfers.map((transfer) => (
                        <tr key={transfer.id} className="border-b">
                            <td className="p-2 border border-gray-300">{transfer.stock_transfer_number}</td>
                            <td className="p-2 border border-gray-300">{transfer.from_location_name}</td>
                            <td className="p-2 border border-gray-300">{transfer.to_location_name}</td>
                            <td className="p-2 border border-gray-300">{format(new Date(transfer.transfer_date), 'yyyy-MM-dd')}</td>
                            <td className="p-2 border border-gray-300">
                                <span className={cn('px-2 py-0.5 rounded-md text-xs font-semibold', getStatusColor(transfer.status))}>
                                    {transfer.status}
                                </span>
                            </td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{parseFloat(transfer.total_quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    </div>
  )
}

export default function PrintStockTransferReportPage() {
    return (
        <Suspense fallback={<div>Loading report...</div>}>
            <PrintViewContent />
        </Suspense>
    )
}
