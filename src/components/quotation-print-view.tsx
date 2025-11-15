
'use client'

import { type User, type Product, type ProductVariant, type Location } from '@/lib/types';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import Image from 'next/image';
import { fetcher } from '@/lib/api';
import { useCurrency } from '@/components/currency-provider';


interface QuotationItem {
    id: string;
    product_id: string;
    product_variant_id: string | null;
    qty: string;
    unit_price: string;
    total: string;
}

interface Quotation {
  id: string;
  customer_id: string;
  quatation_date: string;
  expire_date: string;
  is_active: string;
  items: QuotationItem[];
  remark: string;
  grand_total: string;
  company_id: string;
  location_id: string;
}

interface ProductWithApiResponse {
    product: Product;
    variants: { variant: ProductVariant }[];
}

interface Company {
    id: string;
    company_name: string;
    company_address: string;
    company_city: string;
    company_email: string;
    company_telephone: string;
}

interface PrintViewProps {
    id: string;
}

export function QuotationPrintView({ id }: PrintViewProps) {
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setIsLoading(true);
      try {
        const quotationResponse = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/quotations/${id}`);
        
        if (!quotationResponse.ok) {
           if (quotationResponse.status === 404) notFound();
           throw new Error('Failed to fetch quotation data');
        }
        const quotationData: Quotation = await quotationResponse.json();
        setQuotation(quotationData);

        const [productsResponse, customerResponse, companyRes, locationRes] = await Promise.all([
           fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${quotationData.company_id}`),
           fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${quotationData.customer_id}`),
           fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies/${quotationData.company_id}`),
           fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/locations/${quotationData.location_id}`),
        ]);
        
        if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            setProducts(productsData.products || []);
        }

        if (customerResponse.ok) {
            setCustomer(await customerResponse.json());
        }

        if(companyRes.ok) setCompany(await companyRes.json());
        if(locationRes.ok) setLocation(await locationRes.json());

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load quotation',
          description: error instanceof Error ? error.message : 'Could not fetch data from the server.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, toast]);

   useEffect(() => {
    if (quotation) {
        document.title = `Quotation - QTN-${quotation.id}`;
    }
  }, [quotation]);

  useEffect(() => {
    if (!isLoading && quotation) {
        setTimeout(() => window.print(), 500);
    }
  }, [isLoading, quotation]);

  const getProductName = (productId: string, variantId: string | null) => {
    const productData = products.find(p => p.product.id === productId);
    if (!productData) return `Product ID: ${productId}`;
    if (variantId) {
        const variant = productData.variants.find(v => v.variant.id === variantId)?.variant;
        if (variant) {
            const variantAttributes = [variant.color, variant.size].filter(Boolean).join(' - ');
            return variantAttributes ? `${productData.product.name} - ${variantAttributes}` : `${productData.product.name} (${variant.sku})`;
        }
    }
    return productData.product.name;
  };

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-[800px] w-full" /></div>;
  }

  if (!quotation) {
    return <div>Quotation not found or failed to load.</div>;
  }

  const quotationItems = quotation.items?.map(item => ({
    ...item,
    product_name: getProductName(item.product_id, item.product_variant_id),
    total_cost: parseFloat(String(item.unit_price)) * parseFloat(item.qty),
  }));

  const subTotal = quotationItems.reduce((acc, item) => acc + item.total_cost, 0);
  const totalValue = parseFloat(quotation.grand_total);
  const logoUrl = location?.logo_path ? `${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${location.logo_path}` : null;

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
          <h2 className="text-4xl font-bold uppercase text-gray-700">Quotation</h2>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1">Quote To</h3>
          <p className="font-bold text-gray-800">{customer?.customer_first_name} {customer?.customer_last_name}</p>
          <p>{customer?.address_line1}</p>
          <p>{customer?.city_id}</p>
          <p>{customer?.email_address}</p>
        </div>
        <div className="text-right">
          <div className="grid grid-cols-2 gap-1">
            <span className="font-semibold text-gray-600">Quotation #:</span>
            <span>QTN-{quotation.id}</span>
            <span className="font-semibold text-gray-600">Date:</span>
            <span>{format(new Date(quotation.quatation_date), "dd MMM, yyyy")}</span>
            <span className="font-semibold text-gray-600">Valid Until:</span>
            <span>{format(new Date(quotation.expire_date), "dd MMM, yyyy")}</span>
          </div>
        </div>
      </section>
      
      <section className="mt-8 flex-grow">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
              <th className="p-3 w-1/2">Description</th>
              <th className="p-3 text-right">Quantity</th>
              <th className="p-3 text-right">Unit Price</th>
              <th className="p-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {quotationItems?.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="p-3">
                  <p className="font-semibold">{item.product_name}</p>
                </td>
                <td className="p-3 text-right">{parseFloat(item.qty).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right font-mono">{currencySymbol}{parseFloat(String(item.unit_price)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right font-mono">{currencySymbol}{item.total_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex justify-end mt-6">
        <div className="w-full max-w-xs space-y-2 text-gray-700">
           <div className="flex justify-between">
            <span>Subtotal</span>
            <span className='font-mono'>{currencySymbol}{subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
           {/* Add other charges like tax if they are part of the quotation object */}
          <div className="flex justify-between font-bold text-lg pt-2 border-t-2 border-gray-200">
            <span>Total</span>
            <span className='font-mono'>{currencySymbol}{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </section>

      <footer className="mt-auto pt-6 text-center text-gray-500 text-xs">
         {quotation.remark && (
            <div className="mt-12 pt-6 border-t-2 border-gray-200 text-left">
                <h4 className="font-semibold mb-1">Notes & Terms</h4>
                <p>{quotation.remark}</p>
            </div>
         )}
         <div className="mt-12 pt-6 border-t-2 border-gray-200">
            <p className="font-semibold">Thank you for your business!</p>
            <p>If you have any questions about this quotation, please contact us.</p>
         </div>
      </footer>
    </div>
  );
}
