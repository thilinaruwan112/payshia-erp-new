
'use client'

import { type GoodsReceivedNote, type Supplier, type Product, type ProductVariant } from '@/lib/types';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface PrintViewProps {
    id: string;
}

export function GrnPrintView({ id }: PrintViewProps) {
  const [grn, setGrn] = useState<GoodsReceivedNote | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setIsLoading(true);
      try {
        const [grnResponse, suppliersResponse, productsResponse, variantsResponse] = await Promise.all([
           fetch(`https://server-erp.payshia.com/grn/${id}`),
           fetch('https://server-erp.payshia.com/suppliers'),
           fetch('https://server-erp.payshia.com/products'),
           fetch('https://server-erp.payshia.com/product-variants'),
        ]);
        
        if (!grnResponse.ok) {
           if (grnResponse.status === 404) notFound();
           throw new Error('Failed to fetch GRN data');
        }
        if (!suppliersResponse.ok) throw new Error('Failed to fetch suppliers');
        if (!productsResponse.ok) throw new Error('Failed to fetch products');
        if (!variantsResponse.ok) throw new Error('Failed to fetch variants');

        const grnData = await grnResponse.json();
        const suppliersData: Supplier[] = await suppliersResponse.json();
        const productsData: Product[] = await productsResponse.json();
        const variantsData: ProductVariant[] = await variantsResponse.json();

        setGrn(grnData.grn);
        setSupplier(suppliersData.find(s => s.supplier_id === grnData.grn.supplier_id) || null);
        setProducts(productsData);
        setVariants(variantsData);

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load GRN',
          description: error instanceof Error ? error.message : 'Could not fetch data from the server.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, toast]);
  
  useEffect(() => {
    if (grn) {
        document.title = `${grn.grn_number} - GRN - Payshia ERP`;
    }
  }, [grn]);

  useEffect(() => {
    if (!isLoading && grn) {
        setTimeout(() => window.print(), 500);
    }
  }, [isLoading, grn]);
  
  const getProductName = (productId: string) => products.find(p => p.id === productId)?.name || 'Unknown Product';
  const getVariantSku = (variantId: string) => variants.find(v => v.id === variantId)?.sku || 'N/A';
  
  if (isLoading) {
    return <PrintViewSkeleton />;
  }

  if (!grn) {
    return <div>GRN not found or failed to load.</div>;
  }

  const grnItems = grn.items?.map(item => ({
    ...item,
    product_name: getProductName(String(item.product_id)),
    variant_sku: getVariantSku(String(item.product_variant_id)),
    total_cost: parseFloat(String(item.order_rate)) * parseFloat(item.received_qty),
  }));

  return (
    <div className="bg-white text-black font-[Poppins] text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8">
      <header className="flex justify-between items-start pb-6 border-b-2 border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payshia ERP</h1>
          <p>#455, 533A3, Pelmadulla</p>
          <p>Rathnapura, 70070</p>
          <p>info@payshia.com</p>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-bold uppercase text-gray-700">Goods Received Note</h2>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1">Supplier</h3>
          <p className="font-bold text-gray-800">{supplier?.supplier_name}</p>
          <p>{supplier?.street_name}</p>
          <p>{supplier?.city}, {supplier?.zip_code}</p>
          <p>{supplier?.email}</p>
        </div>
        <div className="text-right">
          <div className="grid grid-cols-2 gap-1">
            <span className="font-semibold text-gray-600">GRN #:</span>
            <span>{grn.grn_number}</span>
            <span className="font-semibold text-gray-600">PO #:</span>
            <span>{grn.po_number}</span>
            <span className="font-semibold text-gray-600">Date:</span>
            <span>{format(new Date(grn.created_at), "dd MMM, yyyy")}</span>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
              <th className="p-3 w-1/2">Description</th>
              <th className="p-3">Batch Code</th>
              <th className="p-3">EXP</th>
              <th className="p-3 text-right">Received Qty</th>
              <th className="p-3 text-right">Unit Price</th>
              <th className="p-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {grnItems?.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="p-3">
                  <p className="font-semibold">{item.product_name}</p>
                  <p className="text-xs text-gray-500">SKU: {item.variant_sku}</p>
                </td>
                <td className="p-3">{item.patch_code}</td>
                <td className="p-3">{item.expire_date ? format(new Date(item.expire_date), 'dd/MM/yy') : 'N/A'}</td>
                <td className="p-3 text-right">{parseFloat(item.received_qty)}</td>
                <td className="p-3 text-right">${parseFloat(String(item.order_rate)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-3 text-right">${item.total_cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex justify-end mt-6">
        <div className="w-full max-w-xs space-y-2 text-gray-700">
           <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t-2 border-gray-200">
            <span>Total</span>
            <span>${parseFloat(grn.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </section>

       <footer className="absolute bottom-8 w-full left-0 px-8">
         <div className="mt-12 pt-6 border-t-2 border-gray-200 text-center text-gray-500 text-xs">
            <p className="font-semibold">Goods received in good condition.</p>
         </div>
         <div className="flex justify-between items-end text-sm mt-16">
            <div>
                <p className="border-t-2 border-gray-400 border-dotted pt-2 px-12 mt-16"></p>
                <p>Authorized Signature</p>
            </div>
             <div>
                <p className="border-t-2 border-gray-400 border-dotted pt-2 px-12 mt-16"></p>
                <p>Checked By</p>
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
