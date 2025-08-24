

'use client';

import { notFound } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import type { Invoice, User, Product, Location } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Company {
    id: string;
    company_name: string;
    company_address: string;
    company_city: string;
    company_email: string;
    company_telephone: string;
}

export default function POSInvoicePage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const { id } = params;
    async function fetchData() {
        if (!id) return;
        setIsLoading(true);
        try {
            const invoiceResponse = await fetch(`https://server-erp.payshia.com/invoices/full/${id}`);
            if (!invoiceResponse.ok) {
                if (invoiceResponse.status === 404) notFound();
                throw new Error('Failed to fetch invoice data');
            }
            const invoiceData: Invoice = await invoiceResponse.json();
            setInvoice(invoiceData);

            if (invoiceData.customer) {
                setCustomer(invoiceData.customer);
            }

            if (invoiceData.company_id && invoiceData.location_id) {
                const [companyRes, locationRes] = await Promise.all([
                    fetch(`https://server-erp.payshia.com/companies/${invoiceData.company_id}`),
                    fetch(`https://server-erp.payshia.com/locations/${invoiceData.location_id}`),
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
  }, [params, toast]);

  useEffect(() => {
    if (!isLoading && invoice) {
      document.title = `Receipt - ${invoice.invoice_number}`;
      setTimeout(() => window.print(), 500);
    }
  }, [isLoading, invoice]);

  if (isLoading || !invoice) {
    return (
      <div className="w-[58mm] bg-white text-black p-2 font-mono">
        <Skeleton className="h-5 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-full mt-1" />
        <div className="my-2 border-t border-dashed border-black"></div>
        <div className="space-y-2">
            {Array.from({length: 3}).map((_, i) => (
                <div key={i}>
                    <Skeleton className="h-4 w-full" />
                    <div className="flex justify-between">
                         <Skeleton className="h-4 w-1/4" />
                         <Skeleton className="h-4 w-1/4" />
                    </div>
                </div>
            ))}
        </div>
        <div className="my-2 border-t border-dashed border-black"></div>
         <div className="space-y-1 mt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }
  
  const totalDiscount = parseFloat(invoice.discount_amount);
  const subtotal = parseFloat(invoice.inv_amount);
  const total = parseFloat(invoice.grand_total);
  // Tax is not explicitly in the payload, so we calculate it
  const tax = total - subtotal + totalDiscount - parseFloat(invoice.service_charge);

  return (
    <div className="w-[58mm] bg-white text-black p-1 font-mono text-[9px] leading-snug">
      <div className="text-center">
        <h1 className="font-bold text-sm">{company?.company_name || 'Payshia Store'}</h1>
        <p>{location?.address_line1}, {location?.city}</p>
        <p>{company?.company_telephone}</p>
      </div>

      <div className="my-2 border-t border-dashed border-black"></div>
      
      <div>
        <p>Date: {format(new Date(invoice.invoice_date), "dd/MM/yyyy HH:mm")}</p>
        <p>Receipt#: {invoice.invoice_number}</p>
        <p>Cashier: {invoice.created_by}</p>
         {customer && <p>Customer: {customer.customer_first_name} {customer.customer_last_name}</p>}
      </div>

      <div className="my-2 border-t border-dashed border-black"></div>

      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left">ITEM</th>
            <th className="text-center">QTY</th>
            <th className="text-right">PRICE</th>
            <th className="text-right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item) => (
            <tr key={item.id}>
              <td colSpan={4}>{item.productName || `Product ID: ${item.product_id}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="my-2 border-t border-dashed border-black"></div>

      {/* Totals */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount:</span>
          <span>-${totalDiscount.toFixed(2)}</span>
        </div>
         <div className="flex justify-between">
          <span>Service Charge:</span>
          <span>${parseFloat(invoice.service_charge).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax:</span>
          <span>${tax > 0 ? tax.toFixed(2) : '0.00'}</span>
        </div>
        <div className="flex justify-between font-bold text-xs mt-1 border-t border-black pt-1">
          <span>TOTAL:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="my-2 border-t border-dashed border-black"></div>

      <div className="text-center mt-2">
        <p className="font-bold">Thank You!</p>
        <p>Please come again.</p>
      </div>
    </div>
  );
}
