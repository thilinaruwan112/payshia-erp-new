
'use client'

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import type { Product, ProductVariant } from '@/lib/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface Company {
    id: string;
    company_name: string;
    company_address: string;
    company_city: string;
    company_email: string;
    company_telephone: string;
}

interface ProductWithApiResponse {
    product: Product;
    variants: { variant: ProductVariant }[];
}

function PrintViewContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
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
             const [productsRes, companyRes] = await Promise.all([
                fetch(`https://server-erp.payshia.com/products/with-variants/by-company?company_id=${companyId}`),
                fetch(`https://server-erp.payshia.com/companies/${companyId}`),
            ]);

            if (!productsRes.ok) throw new Error('Failed to fetch products');
            const productData: { products: ProductWithApiResponse[] } = await productsRes.json();
            setProducts(productData.products || []);
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
    if (!isLoading && products.length > 0) {
      document.title = `Item Master Report`;
      setTimeout(() => window.print(), 1000);
    }
  }, [isLoading, products]);

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-[800px] w-full" /></div>;
  }
  
  const allVariants = products.flatMap(p => (p.variants || []).map(v => ({ ...v.variant, productName: p.product.name, category: p.product.category, brand: 'N/A' })));

  return (
    <div className="bg-white text-black font-sans text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8">
        <header className="flex justify-between items-start pb-4 border-b">
            <div>
                <h1 className="text-lg font-bold">{company?.company_name || "Your Company"}</h1>
                <p>{company?.company_address}</p>
                <p>{company?.company_telephone}</p>
            </div>
            <div className="text-right">
                <h2 className="text-2xl font-bold uppercase">Item Master Report</h2>
            </div>
        </header>
        <p className="text-xs text-gray-600 mt-2">Report is generated on {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>

        <main className="mt-6">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#3B5998] text-white">
                        <th className="p-2 border border-gray-300">Product Name</th>
                        <th className="p-2 border border-gray-300">SKU</th>
                        <th className="p-2 border border-gray-300">Category</th>
                        <th className="p-2 border border-gray-300">Brand</th>
                        <th className="p-2 border border-gray-300 text-right">Stock</th>
                    </tr>
                </thead>
                <tbody>
                    {allVariants.map((item) => (
                        <tr key={item.id} className="border-b">
                            <td className="p-2 border border-gray-300">{item.productName}</td>
                            <td className="p-2 border border-gray-300">{item.sku}</td>
                            <td className="p-2 border border-gray-300">{item.category}</td>
                            <td className="p-2 border border-gray-300">{item.brand}</td>
                            <td className="p-2 border border-gray-300 text-right">{item.stock || 0}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    </div>
  )
}

export default function PrintItemMasterReportPage() {
    return (
        <Suspense fallback={<div>Loading report...</div>}>
            <PrintViewContent />
        </Suspense>
    )
}
