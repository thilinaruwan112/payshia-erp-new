
'use client'

import { type PurchaseOrder, type Supplier, type Product, type ProductVariant, type Location, type Tax } from '@/lib/types';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useCurrency } from './currency-provider';
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
    org_logo: string | null;
}

export function PurchaseOrderPrintView({ id }: PrintViewProps) {
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [taxes, setTaxes] = useState<Tax[]>([]); // New state for taxes
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  
  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setIsLoading(true);
      try {
        const [poResponse, suppliersResponse, productsResponse, variantsResponse] = await Promise.all([
           fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${id}`),
           fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers`),
           fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products`),
           fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-variants`),
        ]);
        
        if (!poResponse.ok) {
           if (poResponse.status === 404) notFound();
           throw new Error('Failed to fetch PO data');
        }
        if (!suppliersResponse.ok) throw new Error('Failed to fetch suppliers');
        if (!productsResponse.ok) throw new Error('Failed to fetch products');
        if (!variantsResponse.ok) throw new Error('Failed to fetch variants');

        const poData: PurchaseOrder = await poResponse.json();
        const suppliersData: Supplier[] = await suppliersResponse.json();
        const productsData: Product[] = await productsResponse.json();
        const variantsData: ProductVariant[] = await variantsResponse.json();

        setPo(poData);
        setSupplier(suppliersData.find(s => s.supplier_id === poData.supplier_id) || null);
        setProducts(productsData);
        setVariants(variantsData);

        if (poData.company_id && poData.location_id) {
             const [companyRes, locationRes, taxesRes] = await Promise.all([ // Added taxesRes
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies/${poData.company_id}`),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/locations/${poData.location_id}`),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/taxes/filter/by-company?company_id=${poData.company_id}`), // Fetch taxes
            ]);
            if(companyRes.ok) setCompany(await companyRes.json());
            if(locationRes.ok) setLocation(await locationRes.json());
            if(taxesRes.ok) { // Process taxes
                const taxesData = await taxesRes.json();
                 const formattedTaxes: Tax[] = (taxesData || []).map((item: any) => ({
                    id: item.tax_id, tax_code: item.tax_code, tax_name: item.tax_name,
                    rate: parseFloat(item.rate), apply_on: item.apply_on, sort_order: parseInt(item.sort_order, 10),
                    is_active: parseInt(item.is_active, 10), company_id: parseInt(item.company_id, 10),
                    location_id: parseInt(item.location_id, 10), created_by: item.created_by, created_at: item.created_at,
                }));
                setTaxes(formattedTaxes);
            }
        }

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load PO',
          description: error instanceof Error ? error.message : 'Could not fetch data from the server.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, toast]);
  
  useEffect(() => {
    if (po) {
        document.title = `${po.po_number} - Purchase Order - Payshia ERP`;
    }
  }, [po]);

  useEffect(() => {
    if (!isLoading && po) {
        setTimeout(() => window.print(), 500);
    }
  }, [isLoading, po]);
  
  const getProductName = (productId: string) => products.find(p => p.id === productId)?.name || 'Unknown Product';
  const getVariantSku = (variantId: string) => variants.find(v => v.id === variantId)?.sku || 'N/A';
  
  if (isLoading || !po) {
    return <PrintViewSkeleton />;
  }

  const poItems = po.items?.map(item => ({
    ...item,
    product_name: getProductName(item.product_id),
    variant_sku: getVariantSku(item.product_variant_id),
    total_cost: parseFloat(String(item.order_rate)) * item.quantity,
  }));
  
  const logoUrl = company?.org_logo ? `${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${company.org_logo}` : null;
  
  const subTotal = parseFloat(po.sub_total);

  const appliedTaxes = useMemo(() => {
    if (!supplier || !supplier.taxes || !taxes.length) {
      return [];
    }
    if (po.tax_type !== 'exclusive' && po.tax_type !== 'VAT' && po.tax_type !== 'GST') {
        return [];
    }
    const supplierTaxIds = supplier.taxes.split(',').map(id => id.trim());
    return taxes
        .filter(tax => supplierTaxIds.includes(tax.id))
        .map(tax => {
            const taxAmount = subTotal * (tax.rate / 100);
            return { name: tax.tax_name, amount: taxAmount };
        });
  }, [supplier, taxes, subTotal, po.tax_type]);

  const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
  const totalAmount = subTotal + totalTaxAmount;


  return (
    <div className="bg-white text-black font-[Poppins] text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8 flex flex-col">
      <header className="flex justify-between items-start pb-6 border-b-2 border-gray-200">
        <div className="flex items-center gap-4">
            {logoUrl && <Image src={logoUrl} alt="Company Logo" width={80} height={80} className="rounded-md" />}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">{company?.company_name || 'Payshia ERP'}</h1>
                 <p className="font-semibold">{location?.location_name}</p>
                <p>{location?.address_line1}, {location?.city}</p>
                <p>{company?.company_email}</p>
            </div>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-bold uppercase text-gray-700">Purchase Order</h2>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1">Vendor</h3>
          <p className="font-bold text-gray-800">{supplier?.supplier_name}</p>
          <p>{supplier?.address_line1 || supplier?.street_name}</p>
          <p>{supplier?.city}, {supplier?.postal_code || supplier?.zip_code}</p>
          <p>{supplier?.email}</p>
        </div>
        <div className="text-right">
            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1">Ship To</h3>
            <p className="font-bold text-gray-800">{location?.location_name}</p>
        </div>
        <div className="col-span-2 text-right">
          <div className="grid grid-cols-4 gap-1">
            <span className="font-semibold text-gray-600 col-start-3">PO #:</span>
            <span>{po.po_number}</span>
            <span className="font-semibold text-gray-600 col-start-3">Date:</span>
            <span>{format(new Date(po.created_at), "dd MMM, yyyy")}</span>
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
            {poItems?.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="p-3">
                  <p className="font-semibold">{item.product_name}</p>
                  <p className="text-xs text-gray-500">SKU: {item.variant_sku}</p>
                </td>
                <td className="p-3 text-right">{item.quantity}</td>
                <td className="p-3 text-right">{currencySymbol}{parseFloat(String(item.order_rate)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-3 text-right">{currencySymbol}{item.total_cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex justify-end mt-6">
        <div className="w-full max-w-xs space-y-2 text-gray-700">
           <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono">{currencySymbol}{subTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          {appliedTaxes.map((tax, index) => (
            <div key={index} className="flex justify-between">
              <span>{tax.name}</span>
              <span className="font-mono">{currencySymbol}{tax.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-lg pt-2 border-t-2 border-gray-200">
            <span>Total</span>
            <span className="font-mono">{currencySymbol}{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </section>

       <footer className="mt-auto pt-6 text-center text-gray-500 text-xs">
         <div className="mt-12 pt-6 border-t-2 border-gray-200">
            <p className="font-semibold">Thank you for your business!</p>
            <p>If you have any questions about this purchase order, please contact us.</p>
         </div>
         <div className="flex justify-between items-end text-sm mt-16">
            <div>
                <p className="border-t-2 border-gray-400 border-dotted pt-2 px-12"></p>
                <p>Authorized Signature</p>
            </div>
        </div>
      </footer>
    </div>
  );
}

function PrintViewSkeleton() {
  return (
    <div className="p-8">
      <Skeleton className="h-[800px] w-full" />
    </div>
  );
}
