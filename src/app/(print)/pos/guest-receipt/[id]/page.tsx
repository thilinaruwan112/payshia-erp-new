
'use client';

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';

type GuestReceiptItem = {
    name: string;
    quantity: number;
    price: number;
    total: number;
}

type GuestReceiptData = {
    orderId: string;
    orderName: string;
    cashierName: string;
    customerName: string;
    items: GuestReceiptItem[];
    totals: {
        subtotal: number;
        discount: number;
        serviceCharge: number;
        total: number;
    }
}

// Extend the Window interface
declare global {
  interface Window {
      JSPM: any;
  }
}

export default function GuestReceiptPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const [receiptData, setReceiptData] = useState<GuestReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [connected, setConnected] = useState(false);


  useEffect(() => {
    try {
        const data = searchParams.get('data');
        if (data) {
            const decodedData = atob(data);
            const parsedData: GuestReceiptData = JSON.parse(decodedData);
            setReceiptData(parsedData);
        }
    } catch (error) {
        console.error("Failed to parse guest receipt data", error);
    } finally {
        setIsLoading(false);
    }
  }, [searchParams]);

  const handlePrint = async () => {
    if (!window.JSPM || !connected || !receiptRef.current) {
        console.warn("JSPM not ready or KOT element not found. Falling back to browser print.");
        setTimeout(() => window.print(), 500);
        return;
    }

    try {
        const element = receiptRef.current;
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
            `GUEST-RCPT-${receiptData?.orderId}.png`,
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
    if (connected && !isLoading && receiptData) {
        document.title = `Guest Receipt - ${receiptData.orderName}`;
        handlePrint();
    } else if (!isLoading && receiptData && typeof window !== "undefined" && !window.JSPM) {
        console.warn("JSPM not found. Falling back to browser print.");
        setTimeout(() => window.print(), 500);
    }
  }, [connected, isLoading, receiptData]);

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
  
  return (
    <div ref={receiptRef} className="w-[80mm] bg-white text-black p-2 font-mono text-sm leading-tight">
      <div className="text-center mb-2">
        <h1 className="font-bold text-xl">GUEST RECEIPT</h1>
        <p className="text-xs">*** This is not a final bill ***</p>
      </div>
      
      <div className="flex justify-between text-xs">
        <p>Order: {receiptData.orderName}</p>
        <p>{format(new Date(), "dd/MM/yy HH:mm")}</p>
      </div>
       <div className="flex justify-between text-xs">
        <p>Cashier: {receiptData.cashierName}</p>
        <p>Customer: {receiptData.customerName}</p>
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
          {receiptData.items?.map((item, index) => (
            <tr key={index}>
              <td className="py-1 align-top w-[50%]">{item.name}</td>
              <td className="py-1 align-top text-center">{item.quantity}</td>
              <td className="py-1 align-top text-right">${(item.price as number).toFixed(2)}</td>
              <td className="py-1 align-top text-right">${item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

       <div className="my-2 border-t-2 border-dashed border-black"></div>
       <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${receiptData.totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount:</span>
          <span>-${receiptData.totals.discount.toFixed(2)}</span>
        </div>
         <div className="flex justify-between">
          <span>Service Charge:</span>
          <span>${receiptData.totals.serviceCharge.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-base mt-1 border-t border-black pt-1">
          <span>TOTAL:</span>
          <span>${receiptData.totals.total.toFixed(2)}</span>
        </div>
      </div>

       <div className="text-center mt-4 text-xs">
           <p>Thank You!</p>
       </div>
    </div>
  );
}
