
'use client'

import { type Invoice, type User, type Product, type ProductVariant } from '@/lib/types';
import { notFound, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const showBankDetails = searchParams.get('showBankDetails') === 'true';

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
    total_cost: parseFloat(String(item.item_price)) * item.quantity - parseFloat(String(item.item_discount)),
  }));

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
          <h2 className="text-4xl font-bold uppercase text-gray-700">Invoice</h2>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1">Bill To</h3>
          <p className="font-bold text-gray-800">{customer?.customer_first_name} {customer?.customer_last_name}</p>
          <p>{customer?.address_line1}</p>
          <p>{customer?.city_id}</p>
          <p>{customer?.email_address}</p>
        </div>
        <div className="text-right">
          <div className="grid grid-cols-2 gap-1">
            <span className="font-semibold text-gray-600">Invoice #:</span>
            <span>{invoice.invoice_number}</span>
            <span className="font-semibold text-gray-600">Invoice Date:</span>
            <span>{format(new Date(invoice.invoice_date), "dd MMM, yyyy")}</span>
            <span className="font-semibold text-gray-600">Due Date:</span>
            <span>{format(new Date(invoice.invoice_date), "dd MMM, yyyy")}</span>
          </div>
        </div>
      </section>

      <section className="mt-8">
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
            {invoiceItems?.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="p-3">{item.product_name}</td>
                <td className="p-3 text-right">{item.quantity.toFixed(2)}</td>
                <td className="p-3 text-right">${parseFloat(String(item.item_price)).toFixed(2)}</td>
                <td className="p-3 text-right">${item.total_cost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex justify-end mt-6">
        <div className="w-full max-w-xs space-y-2 text-gray-700">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${parseFloat(invoice.inv_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-${parseFloat(invoice.discount_amount).toFixed(2)}</span>
          </div>
           <div className="flex justify-between">
            <span>Service Charge</span>
            <span>${parseFloat(invoice.service_charge).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t-2 border-gray-200">
            <span>Total</span>
            <span>${parseFloat(invoice.grand_total).toFixed(2)}</span>
          </div>
        </div>
      </section>
      
      {showBankDetails && (
        <>
          <div className="page-break" />
          <section className="mt-8 pt-6 border-t-2 border-gray-200">
            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">Payment Details</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                    <p className="font-bold text-gray-800">Bank of Payshia</p>
                    <p>Account Name: Payshia ERP Solutions</p>
                    <p>Account No: 123-456-7890</p>
                    <p>Branch: Colombo</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-gray-800">Please include the invoice number in your payment reference.</p>
                    <p className="font-bold text-muted-foreground mt-2">Kindly send the payment receipt to payments@example.com</p>
                </div>
            </div>
          </section>
        </>
      )}

      <footer className="mt-12 pt-6 border-t-2 border-gray-200 text-center text-gray-500 text-xs">
        <p className="font-semibold">Thank you for your business!</p>
        <p>If you have any questions about this invoice, please contact us.</p>
        <p>www.payshia.com</p>
      </footer>
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
