
'use client'

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import type { Location, Product, ProductVariant } from '@/lib/types';
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

interface Transaction {
    transaction_date: string;
    description: string;
    in: string;
    out: string;
    balance: number;
}

interface ReportData {
    transactions: Transaction[];
    summary: {
        total_in: number;
        total_out: number;
        final_balance: number;
    };
}


function PrintViewContent() {
  const searchParams = useSearchParams();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const companyId = searchParams.get('company_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const locationId = searchParams.get('location_id');
  const productId = searchParams.get('product_id');
  const productVariantId = searchParams.get('product_variant_id');

  useEffect(() => {
    async function fetchData() {
        if (!companyId || !productId || !productVariantId || !startDate || !endDate) {
            toast({ variant: 'destructive', title: 'Error', description: 'Required parameters are missing.' });
            setIsLoading(false);
            return;
        };

        setIsLoading(true);
        try {
            const params = new URLSearchParams({ 
                company_id: companyId,
                product_id: productId,
                product_variant_id: productVariantId,
                start_date: startDate,
                end_date: endDate,
            });
            if (locationId) params.append('location_id', locationId);

            const [reportRes, companyRes, locationRes, productRes, variantRes] = await Promise.all([
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/bin-card?${params.toString()}`),
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies/${companyId}`),
                 locationId ? fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/locations/${locationId}`) : Promise.resolve(null),
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${productId}`),
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-variants/${productVariantId}`),
            ]);

            if (!reportRes.ok) throw new Error('Failed to fetch report data');
            const resultData = await reportRes.json();
            setReportData(resultData.data);
            
            if (companyRes?.ok) setCompany(await companyRes.json());
            if (locationRes?.ok) setLocation(await locationRes.json());
            if (productRes?.ok) setProduct(await productRes.json());
            if (variantRes?.ok) setVariant(await variantRes.json());

        } catch(error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch report data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [companyId, startDate, endDate, locationId, productId, productVariantId, toast]);

  useEffect(() => {
    if (!isLoading && reportData) {
      document.title = `Bin Card - ${product?.name}`;
      setTimeout(() => window.print(), 1000);
    }
  }, [isLoading, reportData, product]);

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-[800px] w-full" /></div>;
  }
  
  if (!reportData) {
    return <div className="p-8">No data found for the selected criteria.</div>;
  }

  const { transactions, summary } = reportData;

  return (
    <div className="bg-white text-black font-sans text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8">
        <header className="flex justify-between items-start pb-4 border-b">
            <div>
                <h1 className="text-lg font-bold">{company?.company_name || "Your Company"}</h1>
                <p>{company?.company_address}</p>
                <p>{company?.company_telephone}</p>
            </div>
            <div className="text-right">
                <h2 className="text-2xl font-bold uppercase">Bin Card Report</h2>
                <p className="text-xs text-gray-500">
                    Report generated on {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
                </p>
            </div>
        </header>

        <section className="mt-4 mb-6 text-xs">
            <h3 className="font-bold mb-2 text-base">{product?.name} ({variant?.sku})</h3>
            <div className="grid grid-cols-4 gap-x-4">
                {startDate && <div><strong>From:</strong> {format(new Date(startDate), 'dd MMM, yyyy')}</div>}
                {endDate && <div><strong>To:</strong> {format(new Date(endDate), 'dd MMM, yyyy')}</div>}
                {location && <div><strong>Location:</strong> {location.location_name}</div>}
            </div>
        </section>
        
        <main className="mt-6">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#3B5998] text-white">
                        <th className="p-2 border border-gray-300">Date</th>
                        <th className="p-2 border border-gray-300 w-[40%]">Description</th>
                        <th className="p-2 border border-gray-300 text-right">In</th>
                        <th className="p-2 border border-gray-300 text-right">Out</th>
                        <th className="p-2 border border-gray-300 text-right">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((tx, index) => (
                        <tr key={`${tx.transaction_date}-${index}`} className="border-b">
                            <td className="p-2 border border-gray-300">{format(new Date(tx.transaction_date), 'yyyy-MM-dd')}</td>
                            <td className="p-2 border border-gray-300">{tx.description}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{parseFloat(tx.in) > 0 ? parseFloat(tx.in).toFixed(2) : '-'}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{parseFloat(tx.out) > 0 ? parseFloat(tx.out).toFixed(2) : '-'}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono font-bold">{tx.balance.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
                 <tfoot>
                    <tr className="font-bold bg-gray-100">
                        <td colSpan={2} className="p-2 border border-gray-300 text-right">Totals</td>
                        <td className="p-2 border border-gray-300 text-right font-mono">{summary.total_in.toFixed(2)}</td>
                        <td className="p-2 border border-gray-300 text-right font-mono">{summary.total_out.toFixed(2)}</td>
                        <td className="p-2 border border-gray-300 text-right font-mono">{summary.final_balance.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </main>
    </div>
  )
}

export default function PrintBinCardReportPage() {
    return (
        <Suspense fallback={<div>Loading report...</div>}>
            <PrintViewContent />
        </Suspense>
    )
}
