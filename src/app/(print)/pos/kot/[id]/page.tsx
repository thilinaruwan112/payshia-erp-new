
'use client';

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import Image from 'next/image';

type KotItem = {
    name: string;
    quantity: number;
    price: number;
    total: number;
}

type KotData = {
    orderId: string;
    orderName: string;
    cashierName: string;
    stewardName: string;
    customerName: string;
    items: KotItem[];
}

// Extend the Window interface
declare global {
  interface Window {
      JSPM: any;
  }
}

export default function KOTPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const [kotData, setKotData] = useState<KotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const kotRef = useRef<HTMLDivElement>(null);
  const [connected, setConnected] = useState(false);


  useEffect(() => {
    try {
        const data = searchParams.get('data');
        if (data) {
            const decodedData = atob(data);
            const parsedData: KotData = JSON.parse(decodedData);
            setKotData(parsedData);
        }
    } catch (error) {
        console.error("Failed to parse KOT data", error);
    } finally {
        setIsLoading(false);
    }
  }, [searchParams]);

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
            `KOT-${kotData?.orderId}.png`,
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
    if (connected && !isLoading && kotData) {
        document.title = `KOT - ${kotData.orderName}`;
        handlePrint();
    } else if (!isLoading && kotData && typeof window !== "undefined" && !window.JSPM) {
        console.warn("JSPM not found. Falling back to browser print.");
        setTimeout(() => window.print(), 500);
    }
  }, [connected, isLoading, kotData]);

  if (isLoading || !kotData) {
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
          <p><strong>KOT # :</strong> {kotData.orderId.slice(-6).toUpperCase()}</p>
          <p><strong>Table :</strong> {kotData.orderName}</p>
          <p><strong>Customer :</strong> {kotData.customerName}</p>
          <p><strong>Date :</strong> {format(new Date(), "yyyy-MM-dd HH:mm:ss")}</p>
          <p><strong>Steward :</strong> {kotData.stewardName}</p>
          <p><strong>Cashier :</strong> {kotData.cashierName}</p>
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
          {kotData.items?.map((item, index) => (
            <React.Fragment key={index}>
              <tr>
                <td colSpan={3} className="pt-1">{item.name}</td>
              </tr>
              <tr>
                <td className="pb-1">{item.quantity.toFixed(3)}</td>
                <td className="text-right pb-1">{item.price.toFixed(2)}</td>
                <td className="text-right pb-1">{item.total.toFixed(2)}</td>
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
