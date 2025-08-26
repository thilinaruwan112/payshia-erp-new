
'use client';

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';

type KotItem = {
    name: string;
    quantity: number;
}

type KotData = {
    orderId: string;
    orderName: string;
    cashierName: string;
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
        window.print();
        return;
    }

    try {
        // 1. Capture the invoice div
        const element = kotRef.current;
        const canvas = await html2canvas(element, { scale: 2 });

        // 2. Convert to Base64 PNG
        const b64Prefix = "data:image/png;base64,";
        const imgBase64DataUri = canvas.toDataURL("image/png");
        const imgBase64Content = imgBase64DataUri.substring(b64Prefix.length);

        // 3. Create print job
        const { ClientPrintJob, InstalledPrinter, PrintFile, FileSourceType } = window.JSPM;

        const cpj = new ClientPrintJob();
        const myPrinter = new InstalledPrinter("KOT-Printer");
        // myPrinter.paperName = '80(72.1) x 297 mm'; // Optional: Set if needed
        cpj.clientPrinter = myPrinter;

        // 4. Add image as PrintFile
        const myImageFile = new PrintFile(
            imgBase64Content,
            FileSourceType.Base64,
            `KOT-${kotData?.orderId}.png`,
            1
        );
        cpj.files.push(myImageFile);

        // 5. Send job to client
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
          console.error("JSPM script not loaded!");
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
      
      // Give the script a moment to load
      setTimeout(initJSPM, 500);
    }
  }, []);

   useEffect(() => {
    if (connected && !isLoading && kotData) {
        document.title = `KOT - ${kotData.orderName}`;
        handlePrint();
    } else if (!isLoading && kotData && !window.JSPM) {
        // Fallback for when JSPM doesn't load
        console.warn("JSPM not found, using browser print.");
        window.print();
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
    <div ref={kotRef} className="w-[80mm] bg-white text-black p-2 font-mono text-lg leading-tight">
      <div className="text-center mb-2">
        <h1 className="font-bold text-2xl">K.O.T</h1>
      </div>
      
      <div className="flex justify-between text-base">
        <p>Order: {kotData.orderName}</p>
        <p>{format(new Date(), "HH:mm")}</p>
      </div>
       <div className="flex justify-between text-base">
        <p>Cashier: {kotData.cashierName}</p>
      </div>

      <div className="my-2 border-t-2 border-dashed border-black"></div>

      <table className="w-full text-xl">
        <tbody>
          {kotData.items?.map((item, index) => (
            <tr key={index}>
              <td className="py-2 align-top">{item.quantity}</td>
              <td className="py-2 align-top">x</td>
              <td className="py-2 w-full pl-2">{item.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
