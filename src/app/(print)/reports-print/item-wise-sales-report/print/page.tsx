
'use client'

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/components/currency-provider';
import { fetcher } from '@/lib/api';
import type { Location, Category, Brand } from '@/lib/types';

interface Company {
    id: string;
    company_name: string;
    company_address: string;
    company_city: string;
    company_email: string;
    company_telephone: string;
}

interface ReportDataItem {
    product_id: string;
    product_name: string;
    product_variant_id: string;
    variant_sku: string;
    total_quantity: string;
    total_sales: string;
    total_cost: string;
    total_discount: string;
    gross_profit: string;
}

interface ReportData {
    items: ReportDataItem[];
    summary: {
        total_items: number;
        total_quantity: number;
        total_sales: number;
        total_cost: number;
        total_discount: number;
        total_gross_profit: number;
    };
}


function PrintViewContent() {
  const searchParams = useSearchParams();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  
  const companyId = searchParams.get('company_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const locationId = searchParams.get('location_id');
  const categoryId = searchParams.get('category_id');
  const brandId = searchParams.get('brand_id');

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
            if (categoryId) params.append('category_id', categoryId);
            if (brandId) params.append('brand_id', brandId);

            const [reportRes, companyRes, locationRes, categoryRes, brandRes] = await Promise.all([
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales-item-wise?${params.toString()}`),
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies/${companyId}`),
                 locationId ? fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/locations/${locationId}`) : Promise.resolve(null),
                 categoryId ? fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/master-categories/${categoryId}`) : Promise.resolve(null),
                 brandId ? fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/${brandId}`) : Promise.resolve(null),
            ]);

            if (!reportRes.ok) throw new Error('Failed to fetch report data');
            const resultData = await reportRes.json();
            setReportData(resultData.data.report_data);
            
            if (companyRes.ok) setCompany(await companyRes.json());
            if (locationRes?.ok) setLocation(await locationRes.json());
            if (categoryRes?.ok) setCategory(await categoryRes.json());
            if (brandRes?.ok) setBrand(await brandRes.json());

        } catch(error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch report data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [companyId, startDate, endDate, locationId, categoryId, brandId, toast]);

  useEffect(() => {
    if (!isLoading && reportData) {
      document.title = `Item Wise Sales - ${startDate} to ${endDate}`;
      setTimeout(() => window.print(), 1000);
    }
  }, [isLoading, reportData, startDate, endDate]);

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-[800px] w-full" /></div>;
  }
  
  if (!reportData) {
    return <div className="p-8">No data found for the selected criteria.</div>;
  }

  const { summary, items } = reportData;

  return (
    <div className="bg-white text-black font-sans text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8">
        <header className="flex justify-between items-start pb-4 border-b">
            <div>
                <h1 className="text-lg font-bold">{company?.company_name || "Your Company"}</h1>
                <p>{company?.company_address}</p>
                <p>{company?.company_telephone}</p>
            </div>
            <div className="text-right">
                <h2 className="text-2xl font-bold uppercase">Item Wise Sales Report</h2>
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
                {location && <div><strong>Location:</strong> {location.location_name}</div>}
                {category && <div><strong>Category:</strong> {category.name}</div>}
                {brand && <div><strong>Brand:</strong> {brand.name}</div>}
            </div>
        </section>
        
        <main className="mt-6">
            <div className="grid grid-cols-4 gap-4 mb-6 text-center">
                <div className="p-2 rounded-md border bg-gray-50">
                    <p className="text-xs text-gray-500">Total Qty Sold</p>
                    <p className="text-lg font-bold">{summary.total_quantity?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="p-2 rounded-md border bg-gray-50">
                    <p className="text-xs text-gray-500">Total Sales Value</p>
                    <p className="text-lg font-bold">{currencySymbol}{summary.total_sales?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="p-2 rounded-md border bg-gray-50">
                    <p className="text-xs text-gray-500">Total Cost</p>
                    <p className="text-lg font-bold">{currencySymbol}{summary.total_cost?.toFixed(2) || '0.00'}</p>
                </div>
                 <div className="p-2 rounded-md border bg-gray-50">
                    <p className="text-xs text-gray-500">Total Gross Profit</p>
                    <p className="text-lg font-bold">{currencySymbol}{summary.total_gross_profit?.toFixed(2) || '0.00'}</p>
                </div>
            </div>

            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#3B5998] text-white">
                        <th className="p-2 border border-gray-300">Product Name</th>
                        <th className="p-2 border border-gray-300">SKU</th>
                        <th className="p-2 border border-gray-300 text-right">Qty Sold</th>
                        <th className="p-2 border border-gray-300 text-right">Total Sales</th>
                        <th className="p-2 border border-gray-300 text-right">Total Cost</th>
                        <th className="p-2 border border-gray-300 text-right">Gross Profit</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={item.product_variant_id || index} className="border-b">
                            <td className="p-2 border border-gray-300">{item.product_name}</td>
                            <td className="p-2 border border-gray-300">{item.variant_sku}</td>
                            <td className="p-2 border border-gray-300 text-right">{parseFloat(item.total_quantity).toFixed(2)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{parseFloat(item.total_sales).toFixed(2)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{parseFloat(item.total_cost).toFixed(2)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{parseFloat(item.gross_profit).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
                 <tfoot>
                    <tr className="font-bold bg-gray-100">
                        <td colSpan={2} className="p-2 border border-gray-300 text-right">Totals</td>
                        <td className="p-2 border border-gray-300 text-right">{summary.total_quantity.toFixed(2)}</td>
                        <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{summary.total_sales.toFixed(2)}</td>
                        <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{summary.total_cost.toFixed(2)}</td>
                        <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{summary.total_gross_profit.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </main>
    </div>
  )
}

export default function PrintItemWiseSalesReportPage() {
    return (
        <Suspense fallback={<div>Loading report...</div>}>
            <PrintViewContent />
        </Suspense>
    )
}
