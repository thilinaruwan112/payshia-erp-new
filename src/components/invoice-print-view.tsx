
'use client'

import { type Invoice, type User, type Product, type ProductVariant } from '@/lib/types';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface InvoicePrintViewProps {
    id: string;
}

export function InvoicePrintView({ id }: InvoicePrintViewProps) {
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
          title: 'Failed to load invoice',
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
    return <InvoiceViewSkeleton />;
  }

  if (!invoice) {
    return <div>Invoice not found or failed to load.</div>;
  }

  const invoiceItems = invoice.items?.map(item => ({
    ...item,
    product_name: getProductName(item.product_id),
    total_cost: parseFloat(String(item.item_price)) * item.quantity,
  }));
  
  const discountPercentage = parseFloat(invoice.discount_percentage) || 0;

  return (
    <div className="bg-white text-black font-sans text-sm p-4">
      <div className="w-full h-full border border-gray-300 p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
            <div className="text-xs">
                <h1 className="text-xl font-bold mb-1">Thilina Products</h1>
                <p>#455, 533A3, Pelmadulla</p>
                <p>Rathnapura, 70070</p>
                <p>Tel: 0770481363 / 0721185012</p>
                <p>Email: info@payshia.com</p>
                <p>Web: www.payshia.com</p>
            </div>
            <div className="text-right">
                <h2 className="text-3xl font-bold mb-4">INVOICE</h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                   <span className="font-bold">Date</span>
                   <span>{format(new Date(invoice.current_time), "dd/MM/yyyy HH:mm:ss")}</span>
                   <span className="font-bold">INV Number</span>
                   <span>{invoice.invoice_number}</span>
                   <span className="font-bold">Location</span>
                   <span>VILLA HOTEL</span>
                </div>
            </div>
        </div>

        {/* Customer Info */}
        <div className="mb-6">
            <div className="bg-[#1C2C54] text-white font-bold p-1 px-2 text-sm">
                Customer
            </div>
             <div className="text-xs mt-2 p-1 border-l border-r border-b border-gray-300">
                <p className="font-bold">{customer?.customer_first_name} {customer?.customer_last_name}</p>
                <p>{customer?.address_line1}, {customer?.address_line2}, {customer?.city_id}</p>
                <p>Tel: {customer?.phone_number}</p>
                <p>Email: {customer?.email_address}</p>
            </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-xs border-collapse">
            <thead>
                <tr className="bg-[#1C2C54] text-white">
                    <th className="p-1 text-left border border-gray-400">#</th>
                    <th className="p-1 text-left border border-gray-400">Description</th>
                    <th className="p-1 text-left border border-gray-400">Unit</th>
                    <th className="p-1 text-right border border-gray-400">Qty</th>
                    <th className="p-1 text-right border border-gray-400">Unit Price</th>
                    <th className="p-1 text-right border border-gray-400">Discount</th>
                    <th className="p-1 text-right border border-gray-400">Total</th>
                </tr>
            </thead>
            <tbody>
                {invoiceItems?.map((item, index) => (
                     <tr key={index} className="odd:bg-white even:bg-gray-100">
                         <td className="p-1 border-r border-l border-gray-400 text-center">{index + 1}</td>
                         <td className="p-1 border-r border-gray-400">{item.product_name}</td>
                         <td className="p-1 border-r border-gray-400">{item.order_unit || 'Nos'}</td>
                         <td className="p-1 border-r border-gray-400 text-right">{item.quantity.toFixed(2)}</td>
                         <td className="p-1 border-r border-gray-400 text-right">{parseFloat(String(item.item_price)).toFixed(2)}</td>
                         <td className="p-1 border-r border-gray-400 text-right">{parseFloat(String(item.item_discount)).toFixed(2)}</td>
                         <td className="p-1 border-r border-gray-400 text-right">{item.total_cost.toFixed(2)}</td>
                     </tr>
                ))}
                {/* Add empty rows to fill page */}
                 {Array.from({ length: 10 - (invoiceItems?.length || 0) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="odd:bg-white even:bg-gray-100 h-6">
                        <td className="p-1 border-r border-l border-gray-400"></td>
                        <td className="p-1 border-r border-gray-400"></td>
                        <td className="p-1 border-r border-gray-400"></td>
                        <td className="p-1 border-r border-gray-400"></td>
                        <td className="p-1 border-r border-gray-400"></td>
                        <td className="p-1 border-r border-gray-400"></td>
                        <td className="p-1 border-r border-gray-400"></td>
                    </tr>
                ))}
            </tbody>
             <tfoot>
                <tr className="border-t-2 border-b border-gray-400">
                    <td colSpan={7} className="border-l border-r border-gray-400 h-6"></td>
                </tr>
            </tfoot>
        </table>

        {/* Totals */}
        <div className="flex justify-between mt-1">
            <div className="w-[60%] text-xs">
                <div className="bg-[#EAF1DD] p-1 font-bold border-l border-r border-b border-gray-400">
                    Comments & Special Instructions
                </div>
                 <div className="border-l border-r border-b border-gray-400 h-16 p-1">
                    {invoice.remark}
                 </div>
            </div>
            <div className="w-[40%] text-xs">
                <div className="grid grid-cols-2 p-1">
                    <span className="font-bold">Sub Total</span>
                    <span className="text-right">{parseFloat(invoice.inv_amount).toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 p-1">
                    <span className="font-bold">Discount ({discountPercentage.toFixed(2)}%)</span>
                    <span className="text-right">{parseFloat(invoice.discount_amount).toFixed(2)}</span>
                </div>
                 <div className="grid grid-cols-2 p-1">
                    <span className="font-bold">Charge</span>
                    <span className="text-right">{parseFloat(invoice.service_charge).toFixed(2)}</span>
                </div>
                 <div className="grid grid-cols-2 p-1">
                    <span className="font-bold">Shipping</span>
                    <span className="text-right">0.00</span>
                </div>
                 <div className="grid grid-cols-2 p-1">
                    <span className="font-bold">Other</span>
                    <span className="text-right">0.00</span>
                </div>
                <div className="grid grid-cols-2 p-1 bg-gray-200 border-t-2 border-black mt-1">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-right">{parseFloat(invoice.grand_total).toFixed(2)}</span>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs mt-20">
            <div>
                <p>.......................................</p>
                <p>Checked by</p>
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

function InvoiceViewSkeleton() {
  return (
    <div className="p-8">
      <Skeleton className="h-[800px] w-full" />
    </div>
  );
}
