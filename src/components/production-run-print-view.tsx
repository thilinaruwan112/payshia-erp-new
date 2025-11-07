
'use client'

import { type Product, type ProductVariant, type Location } from '@/lib/types';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import Image from 'next/image';
import { fetcher } from '@/lib/api';
import { useCurrency } from './currency-provider';
import { cn } from '@/lib/utils';


interface ProductionRunItem {
    id: string;
    product_id: string;
    product_variant_id: string;
    target_qty: string;
    actual_qty: string;
    variance: string;
    cost_value: string;
}

interface ProductionRun {
    id: string;
    location_id: string;
    company_id: string;
    cost_value: string;
    plan_qty: string;
    yield_qty: string;
    product_id: string | null;
    product_variant_id: string | null;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string;
    is_active: string;
    items: ProductionRunItem[];
}

interface ProductWithApiResponse {
  product: Product;
  variants: { variant: ProductVariant }[];
}

interface PrintViewProps {
    id: string;
}

interface Company {
    id: string;
    company_name: string;
    company_address: string;
    company_city: string;
    company_email: string;
    company_telephone: string;
}

export function ProductionRunPrintView({ id }: PrintViewProps) {
  const [run, setRun] = useState<ProductionRun | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
  const [finishedGood, setFinishedGood] = useState<ProductVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  
  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setIsLoading(true);
      try {
        const runResponse = await fetcher(`https://qa-server-erp.payshia.com/mission-plus/${id}`);

        if (!runResponse.ok) {
           if (runResponse.status === 404) notFound();
           throw new Error('Failed to fetch production run data');
        }
        
        const runData: ProductionRun = await runResponse.json();
        setRun(runData);

        const [companyRes, locationRes, productsRes] = await Promise.all([
             fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies/${runData.company_id}`),
             fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/locations/${runData.location_id}`),
             fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${runData.company_id}`),
        ]);
        
        if(companyRes.ok) setCompany(await companyRes.json());
        if(locationRes.ok) setLocation(await locationRes.json());
        if(productsRes.ok) {
            const productsData = await productsRes.json();
            setProducts(productsData.products || []);
            // Find and set finished good details
            if (runData.product_variant_id) {
              for (const p of (productsData.products || [])) {
                  const variant = p.variants.find((v: any) => v.variant.id === runData.product_variant_id);
                  if (variant) {
                      setFinishedGood(variant.variant);
                      break;
                  }
              }
            }
        }

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load data',
          description: error instanceof Error ? error.message : 'Could not fetch data from the server.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, toast]);
  
  useEffect(() => {
    if (run) {
        document.title = `MP-${run.id} - Production Report - Payshia ERP`;
    }
  }, [run]);

  useEffect(() => {
    if (!isLoading && run) {
        setTimeout(() => window.print(), 500);
    }
  }, [isLoading, run]);
  
  const getProductName = (variantId: string | null) => {
    if (!variantId) return 'N/A';
    for (const p of products) {
        const variant = p.variants.find(v => v.variant.id === variantId);
        if (variant) {
            return `${p.product.name} (${variant.variant.sku})`;
        }
    }
    return `Variant ID: ${variantId}`;
  };
  
  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-[800px] w-full" /></div>;
  }

  if (!run) {
    return <div>Production run not found or failed to load.</div>;
  }
  
  const logoUrl = location?.logo_path ? `${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${location.logo_path}` : null;
  const totalPlanned = run.items.reduce((sum, item) => sum + parseFloat(item.target_qty), 0);
  const totalActual = run.items.reduce((sum, item) => sum + parseFloat(item.actual_qty), 0);
  const finishedGoodName = getProductName(run.product_variant_id);
  
  return (
    <div className="bg-white text-black font-[Poppins] text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8 flex flex-col">
       <header className="flex justify-between items-start pb-6 border-b-2 border-gray-200">
        <div className="flex items-center gap-4">
             {logoUrl && <Image src={logoUrl} alt="Company Logo" width={80} height={80} className="rounded-md" />}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">{company?.company_name || 'Payshia ERP'}</h1>
                <p>{location?.address_line1}, {location?.city}</p>
                <p>{company?.company_email}</p>
            </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold uppercase text-gray-700">Production Report</h2>
        </div>
      </header>

      <section className="flex justify-between items-start mt-6">
        <div>
            <span className="font-semibold text-gray-600">Location: </span>
            <span>{location?.location_name || 'N/A'}</span>
        </div>
        <div className="text-right">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="font-semibold text-gray-600">Run ID:</span>
            <span>MP-{run.id}</span>
            <span className="font-semibold text-gray-600">Date:</span>
            <span>{format(new Date(run.created_at), "dd MMM, yyyy")}</span>
             <span className="font-semibold text-gray-600">Created By:</span>
            <span>{run.created_by}</span>
          </div>
        </div>
      </section>
      
       <section className="mt-8 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1">Finished Product</h3>
          <div className="flex justify-between items-center">
            <p className="font-bold text-gray-800 text-lg">{finishedGoodName}</p>
            <div className="flex gap-8">
                <div>
                  <span className="text-gray-600">Planned: </span>
                  <span className="font-bold text-lg text-gray-800">{parseFloat(run.plan_qty).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Yield: </span>
                  <span className="font-bold text-lg text-gray-800">{parseFloat(run.yield_qty).toFixed(2)}</span>
                </div>
            </div>
          </div>
        </section>

      <section className="mt-8 flex-grow">
        <h3 className="text-md font-semibold uppercase text-gray-600 mb-2">Consumed Ingredients</h3>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
              <th className="p-3 w-[40%]">Ingredient</th>
              <th className="p-3 text-right">Planned Qty</th>
              <th className="p-3 text-right">Actual Qty</th>
              <th className="p-3 text-right">Variance</th>
              <th className="p-3 text-right">Cost Value</th>
            </tr>
          </thead>
          <tbody>
            {run.items?.map((item, index) => {
              const variance = parseFloat(item.variance);
              return (
              <tr key={index} className="border-b border-gray-100">
                <td className="p-3">{getProductName(item.product_variant_id)}</td>
                <td className="p-3 text-right">{parseFloat(item.target_qty).toFixed(2)}</td>
                <td className="p-3 text-right">{parseFloat(item.actual_qty).toFixed(2)}</td>
                <td className={cn("p-3 text-right", variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : '')}>
                    {variance.toFixed(2)}
                </td>
                <td className="p-3 text-right">{currencySymbol}{parseFloat(item.cost_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
            )})}
          </tbody>
           <tfoot>
            <tr className="font-bold bg-gray-100">
              <td colSpan={1} className="p-3 text-right text-gray-600 uppercase">Totals</td>
              <td className="p-3 text-right">{totalPlanned.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td className="p-3 text-right">{totalActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td colSpan={2} className="p-3 text-right text-gray-800">{currencySymbol}{parseFloat(run.cost_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <footer className="mt-auto pt-6 text-center text-gray-500 text-xs">
         <div className="flex justify-between items-end text-sm mt-16">
            <div>
                <p className="border-t-2 border-gray-400 border-dotted pt-2 px-12"></p>
                <p>Prepared by</p>
            </div>
             <div>
                <p className="border-t-2 border-gray-400 border-dotted pt-2 px-12"></p>
                <p>Authorized by</p>
            </div>
        </div>
      </footer>
    </div>
  );
}

