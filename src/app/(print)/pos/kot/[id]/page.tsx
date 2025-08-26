
'use client';

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

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
      html2canvas: any;
  }
}

export default function KOTPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const [kotData, setKotData] = useState<KotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const printTriggered = useRef(false);
  const kotRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handlePrint = () => {
        if (!kotRef.current) return;

        if (window.JSPM) {
            window.JSPM.JSPrintManager.auto_reconnect = true;
            window.JSPM.JSPrintManager.start();
            window.JSPM.JSPrintManager.WS.onStatusChanged = function () {
                if (window.JSPM.JSPrintManager.websocket_status === window.JSPM.WSStatus.Open) {
                    window.html2canvas(kotRef.current!, { scale: 2 }).then((canvas: any) => {
                        const cpj = new window.JSPM.ClientPrintJob();
                        const myPrinter = new window.JSPM.InstalledPrinter('KOT-Printer');
                        
                        myPrinter.paperName = '80(72.1) x 297 mm';
                        cpj.clientPrinter = myPrinter;

                        const b64Prefix = "data:image/png;base64,";
                        const imgBase64DataUri = canvas.toDataURL("image/png");
                        const imgBase64Content = imgBase64DataUri.substring(b64Prefix.length);

                        const myImageFile = new window.JSPM.PrintFile(imgBase64Content, window.JSPM.FileSourceType.Base64, `KOT-${kotData?.orderId}.png`, 1);
                        cpj.files.push(myImageFile);
                        cpj.sendToClient();

                        setTimeout(() => window.close(), 2000);
                    }).catch((err: any) => {
                        console.error("html2canvas error:", err);
                        window.print();
                    });
                } else {
                     console.warn("JSPM not connected. Falling back to browser print.");
                     window.print();
                }
            };
        } else {
            console.warn("JSPM not found. Falling back to browser print.");
            window.print();
        }
    };
    
    if (!isLoading && kotData && !printTriggered.current) {
      document.title = `KOT - ${kotData.orderName}`;
      printTriggered.current = true;
      setTimeout(handlePrint, 500);
    }
  }, [isLoading, kotData]);

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
