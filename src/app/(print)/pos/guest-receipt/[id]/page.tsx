
'use client';

// Import the external CSS file
import '../../print-receipt.css';



import { notFound, useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useRef, Suspense } from 'react';
import type { Invoice } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';

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
  const searchParams = useSearchParams();
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isJspmConnected, setIsJspmConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
        const data = searchParams.get('data');
        if (data) {
            setReceiptData(JSON.parse(decodeURIComponent(data)));
        }
    } catch (e) {
        console.error("Failed to parse receipt data from URL", e);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not read receipt data.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [searchParams, toast]);

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
    
    // Calculate height and set print styles
    const heightInPixels = receiptRef.current.offsetHeight;
    const heightInMm = (heightInPixels * 25.4) / 96; // Assuming 96 DPI
    
    const style = document.createElement('style');
    style.innerHTML = `
        @media print {
            @page {
                size: 80mm ${heightInMm}mm; /* Set the calculated height */
                margin: 0;
            }
        }
    `;
    document.head.appendChild(style);

  
    window.print();
  };

  useEffect(() => {
    if (!isLoading && receiptData) {
        document.title = `Guest Receipt - ${receiptData.orderName}`;
        handlePrint();
    }
  }, [isLoading, receiptData, isJspmConnected]);

  if (isLoading || !receiptData) {
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
  
  const { items, totals, orderName, cashierName, date } = receiptData;
  const totalDiscount = totals.itemDiscounts + totals.discount;
  
  return (
    <div className="flex flex-col items-center">
      <div id="receipt-print-area" ref={receiptRef} className="w-[80mm] bg-white text-black p-2 font-mono text-sm leading-tight">
        <div className="text-center mb-2">
          <h1 className="font-bold text-xl">GUEST RECEIPT</h1>
          <p className="text-xs">*** This is not a final bill ***</p>
        </div>
        
        <div className="flex justify-between text-xs">
          <p>Order: {orderName}</p>
          <p>{format(new Date(date), "dd/MM/yy HH:mm")}</p>
        </div>
        <div className="flex justify-between text-xs">
          <p>Cashier: {cashierName}</p>
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
            {items?.map((item: any, index: number) => (
              <tr key={index}>
                <td className="py-1 align-top w-[50%]">{item.name}</td>
                <td className="py-1 align-top text-center">{item.quantity}</td>
                <td className="py-1 align-top text-right">{item.price.toFixed(2)}</td>
                <td className="py-1 align-top text-right">{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="my-2 border-t-2 border-dashed border-black"></div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{totalDiscount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Service Charge:</span>
            <span>{totals.serviceCharge.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base mt-1 border-t border-black pt-1">
            <span>TOTAL:</span>
            <span>{totals.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center mt-4 text-xs">
            <p>Thank You!</p>
        </div>
      </div>
      <Button className="w-[80mm] mt-2 print:hidden" onClick={() => window.print()}>Print</Button>
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
