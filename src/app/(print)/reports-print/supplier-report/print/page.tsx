

'use client'

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import type { Supplier } from '@/lib/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const companyId = searchParams.get('company_id');

  useEffect(() => {
    async function fetchData() {
        if (!companyId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Company ID is missing.' });
            setIsLoading(false);
            return;
        };

        try {
             const [suppliersRes, companyRes] = await Promise.all([
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/filter/by-company?company_id=${companyId}`),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies/${companyId}`),
            ]);

            if (!suppliersRes.ok) throw new Error('Failed to fetch suppliers');
            setSuppliers((await suppliersRes.json()) || []);
            if (companyRes.ok) setCompany(await companyRes.json());

        } catch(error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch report data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [companyId, toast]);

  useEffect(() => {
    if (!isLoading && suppliers.length > 0) {
      document.title = `Supplier Master Report`;
      setTimeout(() => window.print(), 1000);
    }
  }, [isLoading, suppliers]);

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
                <h2 className="text-2xl font-bold uppercase">Supplier Master Report</h2>
            </div>
        </header>
        <p className="text-xs text-gray-600 mt-2">Report is generated on {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>

        <main className="mt-6">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#3B5998] text-white">
                        <th className="p-2 border border-gray-300">Supplier Name</th>
                        <th className="p-2 border border-gray-300">Contact Person</th>
                        <th className="p-2 border border-gray-300">Phone Number</th>
                        <th className="p-2 border border-gray-300">Email</th>
                    </tr>
                </thead>
                <tbody>
                    {suppliers.map((supplier) => (
                        <tr key={supplier.supplier_id} className="border-b">
                            <td className="p-2 border border-gray-300">{supplier.supplier_name}</td>
                            <td className="p-2 border border-gray-300">{supplier.contact_person}</td>
                            <td className="p-2 border border-gray-300">{supplier.telephone}</td>
                            <td className="p-2 border border-gray-300">{supplier.email}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    </div>
  )
}

export default function PrintSupplierReportPage() {
    return (
        <Suspense fallback={<div>Loading report...</div>}>
            <PrintViewContent />
        </Suspense>
    )
}
