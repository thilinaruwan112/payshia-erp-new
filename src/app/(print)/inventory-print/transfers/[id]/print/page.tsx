
'use client'

import { type StockTransfer, type Location, type Product, type ProductVariant } from '@/lib/types';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import Image from 'next/image';
import { fetcher } from '@/lib/api';

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

function PrintViewSkeleton() {
  return (
    <div className="p-8">
      <Skeleton className="h-[800px] w-full" />
    </div>
  );
}

export function TransferPrintView({ id }: PrintViewProps) {
  const [transfer, setTransfer] = useState<StockTransfer | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setIsLoading(true);
      try {
        const [transferResponse, locationsResponse, productsResponse, variantsResponse] = await Promise.all([
           fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stock-transfers/${id}`),
           fetcher('${process.env.NEXT_PUBLIC_API_BASE_URL}/locations'),
           fetcher('${process.env.NEXT_PUBLIC_API_BASE_URL}/products'),
           fetcher('${process.env.NEXT_PUBLIC_API_BASE_URL}/product-variants'),
        ]);
        
        if (!transferResponse.ok) {
           if (transferResponse.status === 404) notFound();
           throw new Error('Failed to fetch transfer data');
        }
        const transferData: StockTransfer = await transferResponse.json();
        setTransfer(transferData);

        if (transferData.company_id) {
             const companyRes = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies/${transferData.company_id}`);
            if(companyRes.ok) setCompany(await companyRes.json());
        }

        if (locationsResponse.ok) setLocations(await locationsResponse.json());
        if (productsResponse.ok) setProducts(await productsResponse.json());
        if (variantsResponse.ok) setVariants(await variantsResponse.json());

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load transfer data',
          description: error instanceof Error ? error.message : 'Could not fetch data from the server.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, toast]);

  useEffect(() => {
    if (!isLoading && transfer) {
        document.title = `Transfer Note - ${transfer.stock_transfer_number}`;
        setTimeout(() => window.print(), 500);
    }
  }, [isLoading, transfer]);

  const getLocation = (locationId: string) => locations.find(l => l.location_id === locationId);
  const getProductName = (productId: string) => products.find(p => p.id === productId)?.name || 'Unknown Product';
  const getVariantSku = (variantId: string) => variants.find(v => v.id === variantId)?.sku || 'N/A';
  
  if (isLoading || !transfer) {
    return <PrintViewSkeleton />;
  }

  const fromLocation = getLocation(transfer.from_location);
  const toLocation = getLocation(transfer.to_location);
  const logoUrl = fromLocation?.logo_path ? `${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${fromLocation.logo_path}` : null;

  return (
    <div className="bg-white text-black font-[Poppins] text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8 flex flex-col">
       <header className="flex justify-between items-start pb-6 border-b-2 border-gray-200">
        <div className="flex items-center gap-4">
             {logoUrl && <Image src={logoUrl} alt="Company Logo" width={80} height={80} className="rounded-md" />}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">{company?.company_name || 'Payshia ERP'}</h1>
                <p>{fromLocation?.address_line1}, {fromLocation?.city}</p>
                <p>{fromLocation?.phone_1}</p>
            </div>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-bold uppercase text-gray-700">Stock Transfer</h2>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1">From Location</h3>
          <p className="font-bold text-gray-800">{fromLocation?.location_name}</p>
          <p>{fromLocation?.address_line1}</p>
          <p>{fromLocation?.city}</p>
        </div>
        <div className="text-right">
          <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1">To Location</h3>
          <p className="font-bold text-gray-800">{toLocation?.location_name}</p>
          <p>{toLocation?.address_line1}</p>
          <p>{toLocation?.city}</p>
        </div>
        <div className="col-span-2 text-right">
          <div className="grid grid-cols-4 gap-1">
            <span className="font-semibold text-gray-600 col-start-3">Transfer #:</span>
            <span>{transfer.stock_transfer_number}</span>
            <span className="font-semibold text-gray-600 col-start-3">Date:</span>
            <span>{format(new Date(transfer.transfer_date), "dd MMM, yyyy")}</span>
          </div>
        </div>
      </section>
      
      <section className="mt-8 flex-grow">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
              <th className="p-3 w-[10%]">#</th>
              <th className="p-3 w-[50%]">Item Description</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Batch Code</th>
              <th className="p-3 text-right">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {transfer.items?.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="p-3">{index + 1}</td>
                <td className="p-3">{getProductName(item.product_id)}</td>
                <td className="p-3">{getVariantSku(item.product_variant_id)}</td>
                <td className="p-3">{item.patch_code || 'N/A'}</td>
                <td className="p-3 text-right">{parseFloat(item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
           <tfoot>
            <tr className="font-bold bg-gray-100">
              <td colSpan={4} className="p-3 text-right text-gray-600 uppercase">Total Quantity</td>
              <td className="p-3 text-right">{transfer.items?.reduce((sum, item) => sum + parseFloat(item.quantity), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <footer className="mt-auto pt-6 text-center text-gray-500 text-xs">
         <div className="flex justify-between items-end text-sm mt-16">
            <div>
                <p className="border-t-2 border-gray-400 border-dotted pt-2 px-12"></p>
                <p>Authorized Signature</p>
            </div>
             <div>
                <p className="border-t-2 border-gray-400 border-dotted pt-2 px-12"></p>
                <p>Checked By</p>
            </div>
             <div>
                <p className="border-t-2 border-gray-400 border-dotted pt-2 px-12"></p>
                <p>Received By</p>
            </div>
        </div>
      </footer>
    </div>
  );
}


export default function PrintTransferPage() {
    const params = useParams();
    const id = typeof params.id === 'string' ? params.id : '';
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TransferPrintView id={id} />
        </Suspense>
    )
}
