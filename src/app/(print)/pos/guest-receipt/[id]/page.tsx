
'use client';

import { notFound, useParams } from 'next/navigation';
import React, { useEffect, useState, useRef, Suspense } from 'react';
import type { Invoice, User, Location, Product, InvoiceItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Image from 'next/image';
import { fetcher } from '@/lib/api';

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
  const { id } = useParams() as { id: string };
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isJspmConnected, setIsJspmConnected] = useState(false);

  useEffect(() => {
    async function fetchInvoiceData() {
        if (!id) return;
        setIsLoading(true);
        try {
            const companyId = localStorage.getItem('companyId');
            if (!companyId) throw new Error("Company not found");

            const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pos-invoices?invoicenumber=${id}&company_id=${companyId}`);
            if (!response.ok) {
                 if (response.status === 404) notFound();
                throw new Error('Failed to fetch invoice data.');
            }
            const data: Invoice = await response.json();
            setInvoice(data);
            
            if (data.customer_code) {
                const customerRes = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${data.customer_code}`);
                if (customerRes.ok) setCustomer(await customerRes.json());
            }

            if (data.company_id && data.location_id) {
                const [companyRes, locationRes] = await Promise.all([
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies/${data.company_id}`),
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/locations/${data.location_id}`),
                ]);
                if (companyRes.ok) setCompany(await companyRes.json());
                if (locationRes.ok) setLocation(await locationRes.json());
            }

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load invoice data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchInvoiceData();
  }, [id, toast]);


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
  
  const logoUrl = location?.logo_path ? `${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${location.logo_path}` : null;
  
  return (
    <div className="flex flex-col items-center">
      <div id="receipt-print-area" ref={receiptRef} className="w-[80mm] bg-white text-black p-2 font-mono text-sm leading-tight">
        <div className="text-center mb-2">
          {logoUrl && <Image src={logoUrl} alt="logo" width={60} height={60} className="mx-auto my-1" />}
          <p className="text-xs">{location?.address_line1}, {location?.city}</p>
          <p className="text-xs">Tel: {location?.phone_1}</p>
          <div className="my-2 border-t-2 border-dashed border-black"></div>
          <h1 className="font-bold text-lg">GUEST RECEIPT</h1>
        </div>
        
        <div className="text-xs space-y-0.5">
          <div className="flex justify-between"><p>Invoice #: {invoice.invoice_number}</p></div>
          <div className="flex justify-between"><p>Customer: {customer?.first_name || 'Walk-in'}</p></div>
          <div className="flex justify-between"><p>Date: {format(new Date(invoice.invoice_date), "yyyy-MM-dd HH:mm:ss")}</p></div>
          <div className="flex justify-between"><p>Cashier: {invoice.created_by}</p></div>
          {invoice.steward_id !== "N/A" && <div className="flex justify-between"><p>Steward: {invoice.steward_id}</p></div>}
          {invoice.table_id !== '0' && <div className="flex justify-between"><p>Table: {invoice.table_id}</p></div>}
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
            {invoice.items?.map((item, index) => (
              <tr key={index}>
                <td className="py-1 align-top w-[50%]">{item.productName}</td>
                <td className="py-1 align-top text-center">{parseFloat(String(item.quantity))}</td>
                <td className="py-1 align-top text-right">{parseFloat(String(item.item_price)).toFixed(2)}</td>
                <td className="py-1 align-top text-right">{(parseFloat(String(item.item_price)) * parseFloat(String(item.quantity))).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="my-2 border-t-2 border-dashed border-black"></div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{parseFloat(invoice.inv_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{parseFloat(invoice.discount_amount).toFixed(2)}</span>
          </div>
         <div className="flex justify-between">
          <span>Service Charge:</span>
          <span>{parseFloat(invoice.service_charge).toFixed(2)}</span>
        </div>
          <div className="flex justify-between font-bold text-base mt-1 border-t border-black pt-1">
            <span>TOTAL:</span>
            <span>{parseFloat(invoice.grand_total).toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center mt-4 text-xs">
            <p>Thank You!</p>
        </div>
      </div>
      <Button className="w-full mt-2 print:hidden max-w-[80mm]" onClick={() => window.print()}>Print</Button>
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
