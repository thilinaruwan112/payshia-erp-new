
'use client';

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import Image from 'next/image';
import type { Invoice, User } from '@/lib/types';

// Extend the Window interface
declare global {
  interface Window {
      JSPM: any;
  }
}

export default function KOTPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const kotRef = useRef<HTMLDivElement>(null);
  const [connected, setConnected] = useState(false);
  const companyId = searchParams.get('companyId');
  const { id } = params;

  useEffect(() => {
    async function fetchInvoiceData() {
        if (!id || !companyId) {
            console.error("Missing invoice ID or Company ID");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`https://server-erp.payshia.com/pos-invoices/${id}?company_id=${companyId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch invoice data: ${response.statusText}`);
            }
            const data: Invoice = await response.json();
            setInvoice(data);
            if (data.customer) {
                setCustomer(data.customer);
            }
        } catch (error) {
            console.error("Error fetching KOT data:", error);
        } finally {
            setIsLoading(false);
        }
    }
    fetchInvoiceData();
  }, [id, companyId]);

  const handlePrint = async () => {
    if (!window.JSPM || !connected || !kotRef.current) {
        console.warn("JSPM not ready or KOT element not found. Falling back to browser print.");
        setTimeout(() => window.print(), 500);
        return;
    }

    try {
        const element = kotRef.current;
        const canvas = await html2canvas(element, { scale: 2 });

        const b64Prefix = "data:image/png;base64,";
        const imgBase64DataUri = canvas.toDataURL("image/png");
        const imgBase64Content = imgBase64DataUri.substring(b64Prefix.length);

        const { ClientPrintJob, InstalledPrinter, PrintFile, FileSourceType } = window.JSPM;

        const cpj = new ClientPrintJob();
        const myPrinter = new InstalledPrinter("Microsoft Print to PDF");
        
        cpj.clientPrinter = myPrinter;

        const myImageFile = new PrintFile(
            imgBase64Content,
            FileSourceType.Base64,
            `KOT-${invoice?.invoice_number}.png`,
            1
        );
        cpj.files.push(myImageFile);

        cpj.sendToClient();

        setTimeout(() => {
            window.close();
        }, 3000);

    } catch (error) {
        console.error("Printing error:", error);
        alert("An error occurred while printing. Please try again.");
    }
  };


   useEffect(() => {
    if (typeof window !== "undefined") {
      const initJSPM = () => {
        if (!window.JSPM) {
          console.error("JSPM script not loaded! Make sure the client app is running.");
          return;
        }

        const { JSPrintManager } = window.JSPM;
        JSPrintManager.auto_reconnect = true;
        JSPrintManager.start();

        JSPrintManager.WS.onOpen = () => {
          console.log("✅ JSPM Connected!");
          setConnected(true);
        };

        JSPrintManager.WS.onClose = () => {
          console.log("❌ JSPM Disconnected!");
          setConnected(false);
        };
      };
      
      setTimeout(initJSPM, 500);
    }
  }, []);

   useEffect(() => {
    if (connected && !isLoading && invoice) {
        document.title = `KOT - ${invoice.invoice_number}`;
        handlePrint();
    } else if (!isLoading && invoice && typeof window !== "undefined" && !window.JSPM) {
        console.warn("JSPM not found. Falling back to browser print.");
        setTimeout(() => window.print(), 500);
    }
  }, [connected, isLoading, invoice]);

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
  
  return (
    <div ref={kotRef} className="w-[80mm] bg-white text-black p-2 font-[sans-serif] text-sm leading-tight">
      <div className="text-center mb-2">
        <h1 className="font-bold text-lg">KOT</h1>
      </div>
      
      <div className="space-y-1 text-xs">
          <p><strong>KOT # :</strong> {invoice.id.slice(-6).toUpperCase()}</p>
          <p><strong>Table :</strong> {invoice.table_id || 'Take Away'}</p>
          <p><strong>Customer :</strong> {customer?.name || 'Walk-in Customer'}</p>
          <p><strong>Date :</strong> {format(new Date(invoice.invoice_date), "yyyy-MM-dd HH:mm:ss")}</p>
          <p><strong>Steward :</strong> {invoice.steward_id}</p>
          <p><strong>Cashier :</strong> {invoice.created_by}</p>
      </div>


      <div className="my-1 border-t-2 border-dashed border-black"></div>

      <table className="w-full text-xs">
        <thead>
            <tr className="border-b-2 border-dashed border-black">
                <th className='text-left font-semibold pb-1'>Qty</th>
                <th className='text-right font-semibold pb-1'>Unit Price</th>
                <th className='text-right font-semibold pb-1'>Amount</th>
            </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item, index) => (
            <React.Fragment key={index}>
              <tr>
                <td colSpan={3} className="pt-1">{item.productName}</td>
              </tr>
              <tr>
                <td className="pb-1">{parseFloat(String(item.quantity)).toFixed(3)}</td>
                <td className="text-right pb-1">{parseFloat(String(item.item_price)).toFixed(2)}</td>
                <td className="text-right pb-1">{(parseFloat(String(item.item_price)) * parseFloat(String(item.quantity))).toFixed(2)}</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

       <div className="my-1 border-t-2 border-dashed border-black"></div>

       <div className="text-center mt-4 text-xs space-y-1">
           <p className="font-bold">Thank You..! Come Again</p>
           <p className="text-[10px]">Software by Payshia</p>
           <div className="flex justify-center">
              <Image src="https://i.imgur.com/kS4S17L.png" alt="Payshia Logo" width={20} height={20} />
           </div>
           <p className="text-[10px]">077 0 481 363 | www.payshia.com</p>
       </div>
    </div>
  );
}
