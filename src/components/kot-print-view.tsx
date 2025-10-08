
'use client';

import React, { useEffect, useState, useRef } from 'react';
import type { Invoice, InvoiceItem, Product, Location } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import Image from 'next/image';
import { fetcher } from '@/lib/api';

interface KotPrintViewProps {
  invoiceId: string;
  companyId: string | null;
}

// Extend the Window interface for JSPrintManager
declare global {
  interface Window {
      JSPM: any;
  }
}


export function KotPrintView({ invoiceId, companyId }: KotPrintViewProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [itemsToPrint, setItemsToPrint] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const kotRef = useRef<HTMLDivElement>(null);
  const [isJspmConnected, setIsJspmConnected] = useState(false);


  useEffect(() => {
    async function fetchProducts() {
      if (!companyId) return;
      try {
        const response = await fetcher(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/get/filter/by-company?company_id=${companyId}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        setProducts(await response.json());
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error Fetching Products',
          description: 'Could not load product list for KOT.',
        });
      }
    }
    fetchProducts();
  }, [companyId, toast]);

  useEffect(() => {
    async function fetchInvoiceData() {
        if (!invoiceId || !companyId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/pos-invoices?invoicenumber=${invoiceId}&company_id=${companyId}`;
            const response = await fetcher(url);

            if (!response.ok) {
                throw new Error('Failed to fetch invoice data for KOT.');
            }
            const invoiceData: Invoice = await response.json();
            setInvoice(invoiceData);
            
            // Filter items to only include those not yet printed
            const unprintedItems = (invoiceData.items || []).filter(item => item.printed_status !== '1');
            setItemsToPrint(unprintedItems);
            
            if (invoiceData.location_id) {
                const locResponse = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/locations/${invoiceData.location_id}`);
                if (locResponse.ok) {
                    setLocation(await locResponse.json());
                }
            }

        } catch (error) {
            toast({
            variant: 'destructive',
            title: 'Error Fetching KOT Data',
            description:
                error instanceof Error
                ? error.message
                : 'An unknown error occurred.',
            });
        } finally {
            setIsLoading(false);
        }
    }

    fetchInvoiceData();
  }, [invoiceId, companyId, toast]);

   useEffect(() => {
    if (typeof window !== "undefined") {
      const initJSPM = () => {
        if (!window.JSPM) {
          console.error("JSPM script not loaded! Make sure the client app is running.");
          return;
        }
        try {
            const { JSPrintManager } = window.JSPM;
            JSPrintManager.auto_reconnect = true;
            JSPrintManager.start();

            JSPrintManager.WS.onOpen = () => {
                console.log("✅ JSPM Connected!");
                setIsJspmConnected(true);
            };

            JSPrintManager.WS.onClose = () => {
                console.log("❌ JSPM Disconnected!");
                setIsJspmConnected(false);
            };
        } catch (error) {
            console.error("Failed to initialize JSPM:", error);
        }
      };
      // Give JSPM a moment to load on the window object
      setTimeout(initJSPM, 500);
    }
  }, []);

  const handlePrint = async () => {
    if (!kotRef.current) return;

    if (!window.JSPM || !isJspmConnected) {
        console.warn("JSPM not ready or not connected. Falling back to browser print.");
        setTimeout(() => window.print(), 500);
        return;
    }

    try {
        const element = kotRef.current;
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: null });

        const b64Prefix = "data:image/png;base64,";
        const imgBase64DataUri = canvas.toDataURL("image/png");
        const imgBase64Content = imgBase64DataUri.substring(b64Prefix.length);

        const { ClientPrintJob, InstalledPrinter, PrintFile, FileSourceType } = window.JSPM;

        const cpj = new ClientPrintJob();
        // IMPORTANT: Change "Microsoft Print to PDF" to the actual name of your kitchen printer.
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
    if (!isLoading && invoice && products.length > 0 && itemsToPrint.length > 0) {
      document.title = `KOT - ${invoice.invoice_number}`;
       // Wait for JSPM to connect before printing
      if (isJspmConnected) {
        handlePrint();
      } else {
        // Fallback or wait logic if JSPM is not yet connected
        const timeout = setTimeout(() => {
            if (isJspmConnected) {
                handlePrint();
            } else {
                console.warn("JSPM did not connect in time, falling back to browser print.");
                window.print();
            }
        }, 2000); // Wait 2 seconds for connection
        return () => clearTimeout(timeout);
      }
    }
  }, [isLoading, invoice, products, itemsToPrint, isJspmConnected]);

  const getProductName = (productId: number) => {
    return (
      products.find((p) => p.id === String(productId))?.name ||
      `Product ID: ${productId}`
    );
  };
  
  if (isLoading) {
    return (
      <div className="w-[80mm] bg-white text-black p-2 font-mono">
        <div className="text-center">
          <Skeleton className="h-6 w-24 mx-auto" />
        </div>
        <div className="my-2 border-t border-dashed border-black"></div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="my-2 border-t-2 border-dashed border-black"></div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-8 w-full" />
            </div>
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
  
  if (itemsToPrint.length === 0) {
      return (
         <div className="w-[80mm] bg-white text-black p-4 font-mono text-lg text-center">
            <h1 className="text-xl font-bold mb-4">KOT</h1>
            <p>No new items to print for order #{invoice.invoice_number}.</p>
            <p className="mt-4 text-sm">You can close this window.</p>
        </div>
      )
  }
  
  const logoUrl = location?.logo_path ? `${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${location.logo_path}` : null;

  return (
    <div ref={kotRef} className="w-[80mm] bg-white text-black p-2 font-mono text-sm leading-tight">
      <div className="text-center mb-2">
        {logoUrl && <Image src={logoUrl} alt="logo" width={40} height={40} className="mx-auto my-1" />}
        <h1 className="font-bold text-xl">K.O.T</h1>
      </div>

      <div className="flex justify-between text-xs">
        <p>
          Order:{' '}
          {invoice.remark?.includes('Dine-In')
            ? invoice.table_id
            : 'Take Away'}
        </p>
        <p>{format(new Date(), 'dd/MM/yy HH:mm')}</p>
      </div>
      <div className="flex justify-between text-xs">
        <p>Cashier: {invoice.created_by}</p>
        <p>Inv #: {invoice.invoice_number}</p>
      </div>

      <div className="my-2 border-t-2 border-dashed border-black"></div>

      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left w-[15%]">QTY</th>
            <th className="text-left">ITEM</th>
          </tr>
        </thead>
        <tbody>
          {itemsToPrint.map((item, index) => (
            <tr key={index}>
              <td className="py-1 align-top font-bold text-base">
                {parseFloat(String(item.quantity))}
              </td>
              <td className="py-1 align-top font-semibold">
                {getProductName(item.product_id)}
              </td>
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
