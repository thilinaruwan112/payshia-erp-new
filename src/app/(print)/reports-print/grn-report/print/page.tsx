
'use client'

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import type { GoodsReceivedNote, Supplier } from '@/lib/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/components/currency-provider';
import { cn } from '@/lib/utils';

interface Company {
    id: string;
    company_name: string;
    company_address: string;
    company_city: string;
    company_email: string;
    company_telephone: string;
}

const getStatusText = (status: string) => {
  switch (status) {
    case '0': return 'Pending';
    case '1': return 'Approved';
    case '2': return 'Rejected';
    case '3': return 'Cancelled';
    default: return 'Received';
  }
};

function PrintViewContent() {
  const searchParams = useSearchParams();
  const [grns, setGrns] = useState<GoodsReceivedNote[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  
  const companyId = searchParams.get('company_id');

  useEffect(() => {
    async function fetchData() {
        if (!companyId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Company ID is missing.' });
            setIsLoading(false);
            return;
        };

        try {
             const [grnRes, companyRes, suppliersRes] = await Promise.all([
                fetch(`https://server-erp.payshia.com/grn/company/${companyId}`),
                fetch(`https://server-erp.payshia.com/companies/${companyId}`),
                fetch(`https://server-erp.payshia.com/suppliers/filter/by-company?company_id=${companyId}`),
            ]);

            if (!grnRes.ok) throw new Error('Failed to fetch GRNs');
            setGrns((await grnRes.json()) || []);
            if (companyRes.ok) setCompany(await companyRes.json());
            if (suppliersRes.ok) setSuppliers(await suppliersRes.json() || []);

        } catch(error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch report data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [companyId, toast]);

  useEffect(() => {
    if (!isLoading && grns.length > 0) {
      document.title = `GRN Report`;
      setTimeout(() => window.print(), 1000);
    }
  }, [isLoading, grns]);

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-[800px] w-full" /></div>;
  }
  
  const getSupplierName = (id: string) => suppliers.find(s => s.supplier_id === id)?.supplier_name || `ID: ${id}`;
  
  return (
    <div className="bg-white text-black font-sans text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8">
        <header className="flex justify-between items-start pb-4 border-b">
            <div>
                <h1 className="text-lg font-bold">{company?.company_name || "Your Company"}</h1>
                <p>{company?.company_address}</p>
                <p>{company?.company_telephone}</p>
            </div>
            <div className="text-right">
                <h2 className="text-2xl font-bold uppercase">GRN Report</h2>
            </div>
        </header>
        <p className="text-xs text-gray-600 mt-2">Report is generated on {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>

        <main className="mt-6">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#3B5998] text-white">
                        <th className="p-2 border border-gray-300">GRN Number</th>
                        <th className="p-2 border border-gray-300">Supplier</th>
                        <th className="p-2 border border-gray-300">Date</th>
                        <th className="p-2 border border-gray-300">Status</th>
                        <th className="p-2 border border-gray-300 text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {grns.map((grn) => (
                        <tr key={grn.id} className="border-b">
                            <td className="p-2 border border-gray-300">{grn.grn_number}</td>
                            <td className="p-2 border border-gray-300">{getSupplierName(grn.supplier_id)}</td>
                            <td className="p-2 border border-gray-300">{format(new Date(grn.created_at), 'dd/MM/yyyy')}</td>
                            <td className="p-2 border border-gray-300">{getStatusText(grn.grn_status)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{parseFloat(grn.grand_total).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    </div>
  )
}

export default function PrintGrnReportPage() {
    return (
        <Suspense fallback={<div>Loading report...</div>}>
            <PrintViewContent />
        </Suspense>
    )
}
