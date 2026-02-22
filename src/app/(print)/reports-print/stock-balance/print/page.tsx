
'use client'

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense, useMemo } from 'react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/components/currency-provider';
import { fetcher } from '@/lib/api';
import type { Product, ProductVariant, Brand, Location, Category } from '@/lib/types';
import Image from 'next/image';

interface Company {
    id: string;
    company_name: string;
    company_address: string;
    company_city: string;
    company_email: string;
    company_telephone: string;
    org_logo?: string | null;
}

interface StockBalanceItem {
    product_id: string;
    product_variant_id: string;
    product_name: string;
    variant_name: string;
    sale_price: string;
    cost_price: string;
    total_in: string;
    total_out: string;
    stock_balance: string;
    total_cost_value: string;
    total_sale_value: string;
}

interface ReportData {
    data: StockBalanceItem[];
    summary: {
        grand_total_cost_value: number;
        grand_total_sale_value: number;
        potential_profit: number;
        item_count: number;
    };
}

interface ProductWithApiResponse {
    product: Product;
    variants: { variant: ProductVariant }[];
}

function PrintViewContent() {
  const searchParams = useSearchParams();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  
  const companyId = searchParams.get('company_id');
  const locationId = searchParams.get('location_id');
  const productId = searchParams.get('product_id');
  const productVariantId = searchParams.get('product_variant_id');
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
            if (locationId) params.append('location_id', locationId);
            if (productId) params.append('product_id', productId);
            if (productVariantId) params.append('product_variant_id', productVariantId);
            if (categoryId) params.append('category_id', categoryId);
            if (brandId) params.append('brand_id', brandId);
            
            const fetchPromises = [
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stock-balance?${params.toString()}`),
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies/${companyId}`),
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/company?company_id=${companyId}`),
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${companyId}`),
                 fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/master-categories/company?company_id=${companyId}`),
            ];

            if (locationId) {
                fetchPromises.push(fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/locations/${locationId}`));
            }

            const [reportRes, companyRes, brandsRes, productsRes, categoriesRes, locationRes] = await Promise.all(fetchPromises);

            if (!reportRes.ok) throw new Error('Failed to fetch report data');
            const resultData = await reportRes.json();
            setReportData(resultData);
            
            if (companyRes.ok) setCompany(await companyRes.json());
            if (brandsRes.ok) setBrands(await brandsRes.json() || []);
            if (productsRes.ok) {
                const productData = await productsRes.json();
                setProducts(productData.products || []);
            }
            if (categoriesRes.ok) setCategories(await categoriesRes.json() || []);
            if (locationRes?.ok) setLocation(await locationRes.json());

        } catch(error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch report data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [companyId, locationId, productId, productVariantId, categoryId, brandId, toast]);

  useEffect(() => {
    if (!isLoading && reportData) {
      document.title = `Stock Balance Report`;
      setTimeout(() => window.print(), 1000);
    }
  }, [isLoading, reportData]);

  const brandMap = useMemo(() => new Map(brands.map(b => [b.id, b.name])), [brands]);
  const productMap = useMemo(() => new Map(products.map(p => [p.product.id, p.product])), [products]);
  const allSkus = useMemo(() => {
    return products.flatMap(p => 
      (p.variants || []).map(v => ({
        label: `${p.product.name} (${v.variant.sku})`,
        value: v.variant.id,
      }))
    );
  }, [products]);

  const brandName = brandId ? brandMap.get(brandId) : null;
  const categoryName = categoryId ? categories.find(c => c.id === categoryId)?.name : null;
  const productName = productVariantId ? allSkus.find(s => s.value === productVariantId)?.label : null;


  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-[800px] w-full" /></div>;
  }
  
  if (!reportData || !reportData.data) {
    return <div className="p-8">No data found for the selected criteria.</div>;
  }

  const { summary, data: items } = reportData;

  const logoUrl = company?.org_logo ? `${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${company.org_logo}` : null;

  return (
    <div className="bg-white text-black font-sans text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8">
        <header className="flex justify-between items-start pb-4 border-b">
            <div>
                 {logoUrl && <Image src={logoUrl} alt="Company Logo" width={60} height={60} />}
                <h1 className="text-lg font-bold mt-2">{company?.company_name || "Your Company"}</h1>
                <p>{company?.company_address}</p>
                <p>{company?.company_telephone}</p>
            </div>
            <div className="text-right">
                <h2 className="text-2xl font-bold uppercase">Stock Balance Report</h2>
                <p className="text-xs text-gray-500">Report generated on {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>
            </div>
        </header>
        
        <section className="mt-4 mb-6 text-xs text-gray-600">
            <h3 className="font-bold mb-1">Filters Applied:</h3>
            <div className="grid grid-cols-4 gap-2">
                <div><strong>Location:</strong> {location?.location_name || 'All'}</div>
                {brandName && <div><strong>Brand:</strong> {brandName}</div>}
                {categoryName && <div><strong>Category:</strong> {categoryName}</div>}
                {productName && <div><strong>Item:</strong> {productName}</div>}
            </div>
        </section>


        {summary && (
            <div className="grid grid-cols-4 gap-4 my-6 text-center">
                <div className="p-2 rounded-md border bg-gray-50">
                    <p className="text-xs text-gray-500">Total Items</p>
                    <p className="text-lg font-bold">{summary.item_count.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-md border bg-gray-50">
                    <p className="text-xs text-gray-500">Total Cost Value</p>
                    <p className="text-lg font-bold">{currencySymbol}{summary.grand_total_cost_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="p-2 rounded-md border bg-gray-50">
                    <p className="text-xs text-gray-500">Total Sale Value</p>
                    <p className="text-lg font-bold">{currencySymbol}{summary.grand_total_sale_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="p-2 rounded-md border bg-gray-50">
                    <p className="text-xs text-gray-500">Potential Profit</p>
                    <p className="text-lg font-bold">{currencySymbol}{summary.potential_profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
            </div>
        )}

        <main>
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#3B5998] text-white">
                        <th className="p-2 border border-gray-300">Product Name</th>
                        <th className="p-2 border border-gray-300">Variant Name</th>
                        <th className="p-2 border border-gray-300">Brand Name</th>
                        <th className="p-2 border border-gray-300 text-right">Stock Balance</th>
                        <th className="p-2 border border-gray-300 text-right">Line Value</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => {
                         const productDetails = productMap.get(item.product_id);
                         const brandName = productDetails ? brandMap.get(String(productDetails.brand_id)) || 'N/A' : 'N/A';
                         return (
                            <tr key={item.product_variant_id} className="border-b">
                                <td className="p-2 border border-gray-300">{item.product_name}</td>
                                <td className="p-2 border border-gray-300">{item.variant_name}</td>
                                <td className="p-2 border border-gray-300">{brandName}</td>
                                <td className="p-2 border border-gray-300 text-right font-mono font-bold">{parseFloat(item.stock_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="p-2 border border-gray-300 text-right font-mono">{currencySymbol}{parseFloat(item.total_cost_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </main>
    </div>
  )
}

export default function PrintStockBalanceReportPage() {
    return (
        <Suspense fallback={<div>Loading report...</div>}>
            <PrintViewContent />
        </Suspense>
    )
}
