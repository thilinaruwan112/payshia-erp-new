
'use client'

import { type Invoice, type User, type Product } from '@/lib/types';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface PrintViewProps {
    id: string;
}

export function GatePassPrintView({ id }: PrintViewProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setIsLoading(true);
      try {
        const invoiceResponse = await fetch(`https://server-erp.payshia.com/invoices/${id}`);
        if (!invoiceResponse.ok) {
           if (invoiceResponse.status === 404) notFound();
           throw new Error('Failed to fetch invoice data');
        }
        const invoiceData: Invoice = await invoiceResponse.json();
        setInvoice(invoiceData);

        const [customersResponse, productsResponse] = await Promise.all([
           fetch(`https://server-erp.payshia.com/customers`),
           fetch('https://server-erp.payshia.com/products'),
        ]);

        if (!customersResponse.ok) throw new Error('Failed to fetch customers');
        if (!productsResponse.ok) throw new Error('Failed to fetch products');
        
        const customersData: User[] = await customersResponse.json();
        const productsData: Product[] = await productsResponse.json();

        setCustomer(customersData.find(c => c.customer_id === invoiceData.customer_code) || null);
        setProducts(productsData);

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
    if (!isLoading && invoice) {
        setTimeout(() => window.print(), 500);
    }
  }, [isLoading, invoice]);

  const getProductName = (productId: number) => products.find(p => p.id === String(productId))?.name || 'Unknown Product';
  
  if (isLoading) {
    return <PrintViewSkeleton />;
  }

  if (!invoice) {
    return <div>Gate Pass not found or failed to load.</div>;
  }

  const invoiceItems = invoice.items?.map(item => ({
    ...item,
    product_name: getProductName(item.product_id),
  }));

  const totalQuantity = invoiceItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="bg-white text-black font-sans text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8">
      <header className="flex justify-between items-start pb-6 border-b-2 border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payshia ERP</h1>
          <p>#455, 533A3, Pelmadulla</p>
          <p>Rathnapura, 70070</p>
          <p>info@payshia.com</p>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-bold uppercase text-gray-700">Gate Pass</h2>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1">Customer</h3>
          <p className="font-bold text-gray-800">{customer?.customer_first_name} {customer?.customer_last_name}</p>
        </div>
        <div className="text-right">
          <div className="grid grid-cols-2 gap-1">
            <span className="font-semibold text-gray-600">GP No:</span>
            <span>GP-{invoice.invoice_number}</span>
             <span className="font-semibold text-gray-600">Invoice No:</span>
            <span>{invoice.invoice_number}</span>
            <span className="font-semibold text-gray-600">Date:</span>
            <span>{format(new Date(invoice.invoice_date), "dd MMM, yyyy")}</span>
            <span className="font-semibold text-gray-600">Time:</span>
            <span>{format(new Date(invoice.current_time), "HH:mm:ss")}</span>
             <span className="font-semibold text-gray-600">Vehicle No:</span>
            <span>_______________</span>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
              <th className="p-3 w-[10%]">#</th>
              <th className="p-3 w-[70%]">Description</th>
              <th className="p-3 text-right">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {invoiceItems?.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="p-3">{index + 1}</td>
                <td className="p-3">{item.product_name}</td>
                <td className="p-3 text-right">{item.quantity.toFixed(2)}</td>
              </tr>
            ))}
             {Array.from({ length: 15 - (invoiceItems?.length || 0) }).map((_, i) => (
              <tr key={`empty-${i}`} className="h-9 border-b border-gray-100">
                <td className="p-3"></td>
                <td className="p-3"></td>
                <td className="p-3"></td>
              </tr>
            ))}
          </tbody>
           <tfoot>
            <tr className="font-bold bg-gray-100">
              <td colSpan={2} className="p-3 text-right text-gray-600 uppercase">Total Quantity</td>
              <td className="p-3 text-right">{totalQuantity.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

       <footer className="mt-24 pt-6 text-center text-gray-500 text-xs">
         <div className="flex justify-between items-center text-sm">
            <div>
                <p className="border-t-2 border-gray-400 border-dotted pt-2 px-8">.......................................</p>
                <p>Prepared by</p>
            </div>
             <div>
                <p className="border-t-2 border-gray-400 border-dotted pt-2 px-8">.......................................</p>
                <p>Checked by (Security)</p>
            </div>
             <div>
                <p className="border-t-2 border-gray-400 border-dotted pt-2 px-8">.......................................</p>
                <p>Driver Signature</p>
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
