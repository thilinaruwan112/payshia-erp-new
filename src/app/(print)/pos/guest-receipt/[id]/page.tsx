
'use client';

import { notFound, useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useRef, Suspense } from 'react';
import type { Invoice } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';

interface Company {
    id: string;
    company_name: string;
    company_address: string;
    company_city: string;
    company_email: string;
    company_telephone: string;
}

declare global {
  interface Window {
      JSPM: any;
  }
}

function GuestReceiptContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const invoiceNumber = typeof params.id === 'string' ? params.id : '';
  const companyId = searchParams.get('company_id');
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isJspmConnected, setIsJspmConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchInvoiceData() {
        if (!invoiceNumber || !companyId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const url = `https://server-erp.payshia.com/pos-invoices?invoicenumber=${invoiceNumber}&company_id=${companyId}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch invoice data.');
            const data: Invoice = await response.json();
            setInvoice(data);

            if (data.company_id) {
                 const companyRes = await fetch(`https://server-erp.payshia.com/companies/${data.company_id}`);
                 if (companyRes.ok) setCompany(await companyRes.json());
            }

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error Fetching Invoice',
                description: 'Could not load data for the guest receipt.',
            });
        } finally {
            setIsLoading(false);
        }
    }
    fetchInvoiceData();
  }, [invoiceNumber, companyId, toast]);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.JSPM) {
      const script = document.createElement('script');
      script.src = "https://unpkg.com/jsprintmanager/JSPrintManager.js";
      script.async = true;
      document.body.appendChild(script);
    }

    const initJspm = () => {
        if(window.JSPM) {
            try {
                window.JSPM.JSPrintManager.auto_reconnect = true;
                window.JSPM.JSPrintManager.start();
                window.JSPM.JSPrintManager.WS.onOpen = () => setIsJspmConnected(true);
                window.JSPM.JSPrintManager.WS.onClose = () => setIsJspmConnected(false);
            } catch (error) {
                console.error("Failed to start JSPM:", error);
            }
        }
    }
    setTimeout(initJspm, 500);
  }, []);

  const handlePrint = async () => {
    if (!receiptRef.current) return;

    if (!isJspmConnected) {
        console.warn("JSPM not ready. Falling back to browser print.");
        setTimeout(() => window.print(), 500);
        return;
    }

    try {
        const element = receiptRef.current;
        const canvas = await html2canvas(element, { scale: 2 });
        const imgBase64Content = canvas.toDataURL("image/png").substring("data:image/png;base64,".length);
        
        const cpj = new window.JSPM.ClientPrintJob();
        const myPrinter = new window.JSPM.InstalledPrinter("Microsoft Print to PDF");
        
        cpj.clientPrinter = myPrinter;
        const myImageFile = new window.JSPM.PrintFile(imgBase64Content, window.JSPM.FileSourceType.Base64, `GUEST-RCPT-${invoice?.invoice_number}.png`, 1);
        cpj.files.push(myImageFile);

        cpj.sendToClient();
        setTimeout(() => window.close(), 3000);
    } catch (error) {
        console.error("Printing error:", error);
        toast({ title: "Printing Error", description: "Could not send to printer."});
        window.print();
    }
  };

  useEffect(() => {
    if (!isLoading && invoice) {
        document.title = `Guest Receipt - ${invoice.invoice_number}`;
        handlePrint();
    }
  }, [isLoading, invoice, isJspmConnected]);

  if (isLoading || !invoice) {
    return (
      <div className="w-[80mm] bg-white text-black p-2 font-mono">
        <Skeleton className="h-6 w-3/4 mx-auto" />
        <Skeleton className="h-5 w-full mt-2" />
        <div className="my-2 border-t border-dashed border-black"></div>
        <div className="space-y-4">
            {Array.from({length: 3}).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-8 w-1/4" />
                </div>
            ))}
        </div>
      </div>
    );
  }
  
  const totalDiscount = invoice.items ? invoice.items.reduce((acc, item) => acc + parseFloat(String(item.item_discount)), 0) + parseFloat(invoice.discount_amount) : parseFloat(invoice.discount_amount);
  
  return (
    <div ref={receiptRef} className="w-[80mm] bg-white text-black p-2 font-mono text-sm leading-tight">
      <div className="text-center mb-2">
        <h1 className="font-bold text-xl">GUEST RECEIPT</h1>
        <p className="text-xs">*** This is not a final bill ***</p>
      </div>
      
      <div className="flex justify-between text-xs">
        <p>Order: {invoice.table_id === "0" ? invoice.remark?.split(' ')[0] : `Table ${invoice.table_id}`}</p>
        <p>{format(new Date(invoice.current_time), "dd/MM/yy HH:mm")}</p>
      </div>
       <div className="flex justify-between text-xs">
        <p>Cashier: {invoice.created_by}</p>
        <p>Inv #: {invoice.invoice_number}</p>
      </div>

      <div className="my-2 border-t-2 border-dashed border-black"></div>

      <table className="w-full text-xs">
        <thead>
            <tr>
                <th className='text-left'>ITEM</th>
                <th className='text-center'>QTY</th>
                <th className='text-right'>PRICE</th>
                <th className='text-right'>TOTAL</th>
            </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item) => (
            <tr key={item.id}>
              <td className="py-1 align-top w-[50%]">{item.productName || `Product ID ${item.product_id}`}</td>
              <td className="py-1 align-top text-center">{parseFloat(String(item.quantity))}</td>
              <td className="py-1 align-top text-right">${parseFloat(String(item.item_price)).toFixed(2)}</td>
              <td className="py-1 align-top text-right">${(parseFloat(String(item.item_price)) * parseFloat(String(item.quantity))).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

       <div className="my-2 border-t-2 border-dashed border-black"></div>
       <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${parseFloat(invoice.inv_amount).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount:</span>
          <span>-${totalDiscount.toFixed(2)}</span>
        </div>
         <div className="flex justify-between">
          <span>Service Charge:</span>
          <span>${parseFloat(invoice.service_charge).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-base mt-1 border-t border-black pt-1">
          <span>TOTAL:</span>
          <span>${parseFloat(invoice.grand_total).toFixed(2)}</span>
        </div>
      </div>

       <div className="text-center mt-4 text-xs">
           <p>Thank You!</p>
       </div>
    </div>
  );
}

export default function GuestReceiptPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <GuestReceiptContent />
        </Suspense>
    )
}
