
'use client';

import React, { useEffect, useState } from 'react';
import type { Invoice } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface KotPrintViewProps {
  invoiceId: string;
  companyId: string | null;
}

export function KotPrintView({ invoiceId, companyId }: KotPrintViewProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!invoiceId || !companyId) {
      setIsLoading(false);
      return;
    }

    async function fetchInvoiceData() {
      setIsLoading(true);
      try {
        const response = await fetch(`https://server-erp.payshia.com/pos-invoices/${invoiceId}/?company_id=${companyId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch invoice data for KOT.');
        }
        const result = await response.json();
        // The API nests the data in a `data` property
        if (result && result.data) {
          setInvoice(result.data);
        } else {
          throw new Error('Invoice data not found in API response.');
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error Fetching KOT Data',
          description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvoiceData();
  }, [invoiceId, companyId, toast]);
  
  useEffect(() => {
    if (!isLoading && invoice) {
        document.title = `KOT - ${invoice.invoice_number}`;
        setTimeout(() => window.print(), 500);
    }
  }, [isLoading, invoice]);


  if (isLoading) {
    return (
        <div className="w-[80mm] bg-white text-black p-2 font-mono">
            <div className="text-center"><Skeleton className="h-6 w-24 mx-auto" /></div>
            <div className="my-2 border-t border-dashed border-black"></div>
            <div className="flex justify-between"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-20" /></div>
            <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-16" /></div>
            <div className="my-2 border-t-2 border-dashed border-black"></div>
            <div className="space-y-2">
                {Array.from({length: 3}).map((_, i) => (
                    <div key={i}><Skeleton className="h-8 w-full" /></div>
                ))}
            </div>
        </div>
    );
  }

  if (!invoice) {
    return (
        <div className="w-[80mm] bg-white text-black p-4 font-mono text-lg">
            <h1 className="text-2xl font-bold mb-4 text-center">Error</h1>
            <p>Could not load Kitchen Order Ticket data.</p>
        </div>
    );
  }

  return (
    <div className="w-[80mm] bg-white text-black p-2 font-mono text-sm leading-tight">
      <div className="text-center mb-2">
        <h1 className="font-bold text-xl">K.O.T</h1>
      </div>
      
      <div className="flex justify-between text-xs">
        <p>Order: {invoice.remark?.includes('Dine-In') ? invoice.table_id : 'Take Away'}</p>
        <p>{format(new Date(), "dd/MM/yy HH:mm")}</p>
      </div>
       <div className="flex justify-between text-xs">
        <p>Cashier: {invoice.created_by}</p>
        <p>Inv #: {invoice.invoice_number}</p>
      </div>

      <div className="my-2 border-t-2 border-dashed border-black"></div>

      <table className="w-full text-xs">
        <thead>
            <tr>
                <th className='text-left w-[15%]'>QTY</th>
                <th className='text-left'>ITEM</th>
            </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item, index) => (
            <tr key={index}>
              <td className="py-1 align-top font-bold text-base">{parseFloat(String(item.quantity))}</td>
              <td className="py-1 align-top font-semibold">{item.productName}</td>
            </tr>
          ))}
        </tbody>
      </table>

       <div className="text-center mt-4 text-xs">
           <p>-- End of Order --</p>
       </div>
    </div>
  );
}
