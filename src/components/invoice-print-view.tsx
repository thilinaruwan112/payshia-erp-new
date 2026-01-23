
'use client'

import { type Invoice, type User, type Location, type Product, type InvoiceItem } from '@/lib/types';
import { notFound, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import Image from 'next/image';
import { fetcher } from '@/lib/api';

interface Company {
    id: string;
    company_name: string;
    company_address: string;
    company_city: string;
    company_email: string;
    company_telephone: string;
}

interface InvoicePrintViewProps {
    id: string;
    companyId: string | null;
}

type InvoiceItemWithProduct = InvoiceItem & {
    product?: Product;
};

export function InvoicePrintView({ id, companyId }: InvoicePrintViewProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [invoiceItemsWithDetails, setInvoiceItemsWithDetails] = useState<InvoiceItemWithProduct[]>([]);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const showBankDetails = searchParams.get('showBankDetails') === 'true';

  useEffect(() => {
    async function fetchData() {
      if (!id || !companyId) {
          setIsLoading(false);
          return;
      };
      setIsLoading(true);
      try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/invoices/full/?invoicenumber=${id}&company_id=${companyId}`);
        if (!response.ok) {
           if (response.status === 404) notFound();
           throw new Error('Failed to fetch invoice data');
        }
        const data: Invoice = await response.json();
        setInvoice(data);
        
        let fetchedCustomer: User | null = null;
        if (data.customer) {
            fetchedCustomer = data.customer;
        } else if (data.created_by !== 'Online' && data.customer_code) {
             const customerRes = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${data.customer_code}`);
             if(customerRes.ok) fetchedCustomer = await customerRes.json();
        }
        setCustomer(fetchedCustomer);

        if (data.items) {
          const itemsWithDetails = await Promise.all(
            data.items.map(async (item) => {
              try {
                const productRes = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/details/${item.product_id}`);
                if (productRes.ok) {
                  const productData = await productRes.json();
                  return { ...item, product: productData.product };
                }
              } catch (e) {
                console.error(`Failed to fetch details for product ${item.product_id}`, e);
              }
              return item;
            })
          );
          setInvoiceItemsWithDetails(itemsWithDetails);
        }

        if (data.company_id && data.location_id) {
            const [companyRes, locationRes] = await Promise.all([
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies/${data.company_id}`),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/locations/${data.location_id}`),
            ]);
            if(companyRes.ok) setCompany(await companyRes.json());
            if(locationRes.ok) setLocation(await locationRes.json());
        }

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
  }, [id, companyId, toast]);

  useEffect(() => {
    if (invoice) {
        document.title = `${invoice.invoice_number} - Invoice - Payshia ERP`;
    }
  }, [invoice]);

  useEffect(() => {
    if (!isLoading && invoice) {
        setTimeout(() => window.print(), 500);
    }
  }, [isLoading, invoice]);
  
  if (isLoading) {
    return <InvoiceViewSkeleton />;
  }

  if (!invoice) {
    return <div>Invoice not found or failed to load.</div>;
  }

  const invoiceItems = (invoiceItemsWithDetails.length > 0 ? invoiceItemsWithDetails : invoice.items)?.map(item => ({
    ...item,
    total_cost: parseFloat(String(item.item_price)) * parseFloat(String(item.quantity)) - parseFloat(String(item.item_discount)),
  }));

  const logoUrl = location?.logo_path ? `${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${location.logo_path}` : null;

  return (
    <div className="bg-white text-black font-[Poppins] text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8">
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
          <h2 className="text-4xl font-bold uppercase text-gray-700">Invoice</h2>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1">Bill To</h3>
          {invoice.created_by === 'Online' ? (
            <p className="font-bold text-gray-800">{invoice.customer_code}</p>
          ) : customer ? (
            <>
              <p className="font-bold text-gray-800">{customer.customer_first_name} {customer.customer_last_name}</p>
              <p>{customer.address_line1}</p>
              <p>{customer.city_id}</p>
              <p>{customer.email_address}</p>
            </>
          ) : (
            <p className="font-bold text-gray-800">{invoice.customer_code}</p>
          )}
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
                <td className="p-3">
                  <p className="font-semibold">{item.productName}</p>
                  {item.product?.description && <p className="text-xs text-gray-500">{item.product.description}</p>}
                </td>
                <td className="p-3 text-right">{parseFloat(String(item.quantity)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right">${parseFloat(String(item.item_price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-3 text-right">${item.total_cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex justify-end mt-6">
        <div className="w-full max-w-xs space-y-2 text-gray-700">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${parseFloat(invoice.inv_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-${parseFloat(invoice.discount_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
           <div className="flex justify-between">
            <span>Service Charge</span>
            <span>${parseFloat(invoice.service_charge).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t-2 border-gray-200">
            <span>Total</span>
            <span>${parseFloat(invoice.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </section>
      
      {showBankDetails && (
        <section className="mt-8 pt-6 border-t-2 border-gray-200">
            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">Payment Details</h3>
            <div className="grid grid-cols-5 gap-4 text-xs">
                <div className="col-span-2">
                    <p className="font-bold text-gray-800">Bank of Payshia</p>
                    <p>Account Name: Payshia ERP Solutions</p>
                    <p>Account No: 123-456-7890</p>
                    <p>Branch: Colombo</p>
                </div>
                 <div className="col-span-3 text-right">
                    <div className="font-bold text-gray-800 whitespace-nowrap">
                        Please include the invoice number in your payment reference.
                    </div>
                    <div className="text-muted-foreground">
                        Kindly send the payment receipt to<br />payments@example.com
                    </div>
                </div>
            </div>
          </section>
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
