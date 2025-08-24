

'use client'

import { notFound } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import type { Invoice, User, Location } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type Receipt = {
    id: string;
    rec_number: string;
    type: string;
    is_active: string;
    date: string;
    amount: string;
    created_by: string;
    ref_id: string; // Invoice number
    location_id: string;
    customer_id: string;
    today_invoice: string;
    company_id: string;
    now_time: string;
};

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

export function A4ReceiptPrintView({ id }: PrintViewProps) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        if (!id) return;
        setIsLoading(true);
        try {
            const receiptResponse = await fetch(`https://server-erp.payshia.com/receipts/${id}`);
            if (!receiptResponse.ok) {
                if (receiptResponse.status === 404) notFound();
                throw new Error('Failed to fetch receipt data');
            }
            const receiptData: Receipt = await receiptResponse.json();
            setReceipt(receiptData);

            const [customerResponse, invoiceResponse, companyRes, locationRes] = await Promise.all([
                 fetch(`https://server-erp.payshia.com/customers/${receiptData.customer_id}`),
                 fetch(`https://server-erp.payshia.com/invoices/full/${receiptData.ref_id}`),
                 fetch(`https://server-erp.payshia.com/companies/${receiptData.company_id}`),
                 fetch(`https://server-erp.payshia.com/locations/${receiptData.location_id}`),
            ]);
            
             if (customerResponse.ok) setCustomer(await customerResponse.json());
             if (invoiceResponse.ok) setInvoice(await invoiceResponse.json());
             if (companyRes.ok) setCompany(await companyRes.json());
             if (locationRes.ok) setLocation(await locationRes.json());

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to load receipt data',
                description: error instanceof Error ? error.message : 'Could not fetch data from the server.',
            });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [id, toast]);

  useEffect(() => {
    if (!isLoading && receipt) {
      document.title = `Receipt - ${receipt.rec_number}`;
      setTimeout(() => window.print(), 500);
    }
  }, [isLoading, receipt]);

  const getPaymentMethodText = (type: string) => {
    switch (type) {
        case '0': return 'Cash';
        case '1': return 'Card';
        case '2': return 'Bank Transfer';
        default: return type;
    }
  }

  if (isLoading || !receipt) {
    return <PrintViewSkeleton />;
  }

  const amountPaid = parseFloat(receipt.amount);
  const invoiceTotal = invoice ? parseFloat(invoice.grand_total) : 0;
  // This might not be accurate if there were other partial payments,
  // but for this receipt's context it should be fine.
  const balanceDue = invoiceTotal - amountPaid;

  return (
    <div className="bg-white text-black font-[Poppins] text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8 flex flex-col">
       <header className="flex justify-between items-start pb-6 border-b-2 border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{company?.company_name || 'Payshia ERP'}</h1>
          <p>{location?.address_line1}, {location?.city}</p>
          <p>{company?.company_email}</p>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-bold uppercase text-gray-700">Payment Receipt</h2>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1">Received From</h3>
          <p className="font-bold text-gray-800">{customer?.customer_first_name} {customer?.customer_last_name}</p>
          <p>{customer?.address_line1}</p>
          <p>{customer?.city_id}</p>
          <p>{customer?.email_address}</p>
        </div>
        <div className="text-right">
          <div className="grid grid-cols-2 gap-1">
            <span className="font-semibold text-gray-600">Receipt #:</span>
            <span>{receipt.rec_number}</span>
            <span className="font-semibold text-gray-600">Date:</span>
            <span>{format(new Date(receipt.date), "dd MMM, yyyy")}</span>
            <span className="font-semibold text-gray-600">Invoice #:</span>
            <span>{receipt.ref_id}</span>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
              <th className="p-3 w-1/2">Description</th>
              <th className="p-3">Payment Method</th>
              <th className="p-3 text-right">Amount Paid</th>
            </tr>
          </thead>
          <tbody>
              <tr className="border-b border-gray-100">
                <td className="p-3">Payment for Invoice {receipt.ref_id}</td>
                <td className="p-3">{getPaymentMethodText(receipt.type)}</td>
                <td className="p-3 text-right font-mono">${amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
          </tbody>
        </table>
      </section>

      {invoice && (
          <section className="flex justify-end mt-6">
            <div className="w-full max-w-xs space-y-2 text-gray-700">
            <div className="flex justify-between">
                <span>Invoice Total</span>
                <span className='font-mono'>${invoiceTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
                <span>Amount Paid</span>
                <span className='font-mono'>-${amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-800 pt-2 border-t-2 border-gray-200">
                <span>Balance Due</span>
                <span className='font-mono'>${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            </div>
        </section>
      )}

      <footer className="mt-auto pt-6 text-center text-gray-500 text-xs">
         <div className="mt-12 pt-6 border-t-2 border-gray-200">
            <p className="font-semibold">Thank you for your payment!</p>
            <p>If you have any questions, please contact us.</p>
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
