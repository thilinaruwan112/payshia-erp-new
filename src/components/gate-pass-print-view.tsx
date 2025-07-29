
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
    <div className="bg-white text-black font-sans text-sm p-4 w-[210mm] min-h-[297mm] shadow-lg print:shadow-none">
      <div className="w-full h-full border border-gray-300 p-4 flex flex-col">
        <div className="text-center mb-6">
            <h1 className="text-xl font-bold mb-1">Thilina Products</h1>
            <p className="text-xs">#455, 533A3, Pelmadulla, Rathnapura, 70070</p>
            <h2 className="text-2xl font-bold mt-4 underline">GATE PASS</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
                <p><span className="font-bold">GP No:</span> GP-{invoice.invoice_number}</p>
                <p><span className="font-bold">Invoice No:</span> {invoice.invoice_number}</p>
                 <p><span className="font-bold">Customer:</span> {customer?.customer_first_name} {customer?.customer_last_name}</p>
            </div>
            <div className="text-right">
                <p><span className="font-bold">Date:</span> {format(new Date(invoice.invoice_date), "dd/MM/yyyy")}</p>
                <p><span className="font-bold">Time:</span> {format(new Date(invoice.current_time), "HH:mm:ss")}</p>
                <p><span className="font-bold">Vehicle No:</span> ______________</p>
            </div>
        </div>

        <table className="w-full text-sm border-collapse border border-gray-400">
            <thead>
                <tr className="bg-gray-200">
                    <th className="p-2 text-center border border-gray-400">#</th>
                    <th className="p-2 text-left border border-gray-400">Item Description</th>
                    <th className="p-2 text-right border border-gray-400">Quantity</th>
                </tr>
            </thead>
            <tbody>
                {invoiceItems?.map((item, index) => (
                     <tr key={index}>
                         <td className="p-2 border border-gray-400 text-center">{index + 1}</td>
                         <td className="p-2 border border-gray-400">{item.product_name}</td>
                         <td className="p-2 border border-gray-400 text-right">{item.quantity.toFixed(2)}</td>
                     </tr>
                ))}
                 {Array.from({ length: 10 - (invoiceItems?.length || 0) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="h-8">
                        <td className="p-2 border border-gray-400"></td>
                        <td className="p-2 border border-gray-400"></td>
                        <td className="p-2 border border-gray-400"></td>
                    </tr>
                ))}
            </tbody>
             <tfoot>
                <tr className="font-bold bg-gray-200">
                    <td colSpan={2} className="p-2 text-right border border-gray-400">Total Quantity</td>
                    <td className="p-2 text-right border border-gray-400">{totalQuantity.toFixed(2)}</td>
                </tr>
            </tfoot>
        </table>

        <div className="text-sm mt-4">
            <p><span className="font-bold">Remarks:</span> {invoice.remark}</p>
        </div>

        <div className="flex-grow"></div>

        <div className="flex justify-between items-center text-sm mt-20 pt-4">
            <div>
                <p>.......................................</p>
                <p>Prepared by</p>
            </div>
             <div>
                <p>.......................................</p>
                <p>Checked by (Security)</p>
            </div>
             <div>
                <p>.......................................</p>
                <p>Driver Signature</p>
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
