
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

export function DispatchNotePrintView({ id }: PrintViewProps) {
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
    return <div>Dispatch Note not found or failed to load.</div>;
  }

  const invoiceItems = invoice.items?.map(item => ({
    ...item,
    product_name: getProductName(item.product_id),
  }));

  return (
    <div className="bg-white text-black font-sans text-sm p-4 w-[210mm] min-h-[297mm] shadow-lg print:shadow-none">
      <div className="w-full h-full border border-gray-300 p-4">
        <div className="text-center mb-6">
            <h1 className="text-xl font-bold mb-1">Thilina Products</h1>
            <p className="text-xs">#455, 533A3, Pelmadulla, Rathnapura, 70070</p>
            <h2 className="text-2xl font-bold mt-4">DISPATCH NOTE</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs mb-6">
            <div>
                <p><span className="font-bold">DN No:</span> DN-{invoice.invoice_number}</p>
                <p><span className="font-bold">Invoice No:</span> {invoice.invoice_number}</p>
            </div>
            <div className="text-right">
                <p><span className="font-bold">Date:</span> {format(new Date(invoice.invoice_date), "dd/MM/yyyy")}</p>
                <p><span className="font-bold">Vehicle No:</span> ______________</p>
            </div>
        </div>

        <div className="mb-6">
            <div className="font-bold p-1 px-2 text-sm">
                Customer Details
            </div>
             <div className="text-xs mt-1 p-2 border border-gray-300 rounded-md">
                <p><span className="font-bold">Name:</span> {customer?.customer_first_name} {customer?.customer_last_name}</p>
                <p><span className="font-bold">Address:</span> {customer?.address_line1}, {customer?.address_line2}, {customer?.city_id}</p>
                <p><span className="font-bold">Contact:</span> {customer?.phone_number}</p>
            </div>
        </div>

        <table className="w-full text-xs border-collapse border border-gray-400">
            <thead>
                <tr className="bg-gray-200">
                    <th className="p-1 text-center border border-gray-400">#</th>
                    <th className="p-1 text-left border border-gray-400">Description</th>
                    <th className="p-1 text-center border border-gray-400">Unit</th>
                    <th className="p-1 text-right border border-gray-400">Quantity</th>
                </tr>
            </thead>
            <tbody>
                {invoiceItems?.map((item, index) => (
                     <tr key={index} className="odd:bg-white even:bg-gray-100">
                         <td className="p-1 border-r border-l border-gray-400 text-center">{index + 1}</td>
                         <td className="p-1 border-r border-gray-400">{item.product_name}</td>
                         <td className="p-1 border-r border-gray-400 text-center">{item.order_unit || 'Nos'}</td>
                         <td className="p-1 border-r border-gray-400 text-right">{item.quantity.toFixed(2)}</td>
                     </tr>
                ))}
                 {Array.from({ length: 15 - (invoiceItems?.length || 0) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="h-6">
                        <td className="p-1 border-r border-l border-gray-400"></td>
                        <td className="p-1 border-r border-gray-400"></td>
                        <td className="p-1 border-r border-gray-400"></td>
                        <td className="p-1 border-r border-gray-400"></td>
                    </tr>
                ))}
            </tbody>
        </table>

        <div className="text-xs mt-4">
            <p><span className="font-bold">Remarks:</span> {invoice.remark}</p>
        </div>

        <div className="flex justify-between items-center text-xs mt-20 pt-4">
            <div>
                <p>.......................................</p>
                <p>Prepared by</p>
            </div>
             <div>
                <p>.......................................</p>
                <p>Authorized by</p>
            </div>
             <div>
                <p>.......................................</p>
                <p>Received by</p>
            </div>
        </div>
      </div>
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
