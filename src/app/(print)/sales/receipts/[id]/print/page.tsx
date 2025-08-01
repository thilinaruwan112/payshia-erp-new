
'use client';

import { notFound } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import type { Invoice, User } from '@/lib/types';
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

export default function PrintReceiptPage({ params }: { params: { id: string } }) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { id } = params;

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

            const [customerResponse, invoiceResponse] = await Promise.all([
                 fetch(`https://server-erp.payshia.com/customers/${receiptData.customer_id}`),
                 fetch(`https://server-erp.payshia.com/invoices/full/${receiptData.ref_id}`)
            ]);
            
             if (customerResponse.ok) {
                setCustomer(await customerResponse.json());
             }
             if (invoiceResponse.ok) {
                setInvoice(await invoiceResponse.json());
             }
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

  return (
    <div className="w-[58mm] bg-white text-black p-1 font-mono text-[9px] leading-snug">
      <div className="text-center">
        <h1 className="font-bold text-sm">Payshia Store</h1>
        <p>#455, Pelmadulla, Rathnapura</p>
        <p>045-222-2222</p>
        <p>www.payshia.com</p>
      </div>

      <div className="my-2 border-t border-dashed border-black"></div>
      
      <div>
        <p>Date: {format(new Date(receipt.date), "dd/MM/yyyy HH:mm")}</p>
        <p>Receipt#: {receipt.rec_number}</p>
        <p>Invoice#: {receipt.ref_id}</p>
        <p>Cashier: {receipt.created_by === '1' ? 'Admin' : receipt.created_by}</p>
         {customer && <p>Customer: {customer.customer_first_name} {customer.customer_last_name}</p>}
      </div>

      <div className="my-2 border-t border-dashed border-black"></div>

      {/* Totals */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Payment Method:</span>
          <span>{getPaymentMethodText(receipt.type)}</span>
        </div>
        <div className="flex justify-between">
          <span>Amount Paid:</span>
          <span>${parseFloat(receipt.amount).toFixed(2)}</span>
        </div>
      </div>
      
      {invoice && (
         <>
         <div className="my-2 border-t border-dashed border-black"></div>
         <div className="space-y-1">
            <div className="flex justify-between">
                <span>Invoice Total:</span>
                <span>${parseFloat(invoice.grand_total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
                <span>Remaining Balance:</span>
                <span>${(parseFloat(invoice.grand_total) - parseFloat(receipt.amount)).toFixed(2)}</span>
            </div>
         </div>
        </>
      )}


      <div className="my-2 border-t border-dashed border-black"></div>

      <div className="text-center mt-2">
        <p className="font-bold">Thank You!</p>
        <p>Please come again.</p>
      </div>
    </div>
  );
}
