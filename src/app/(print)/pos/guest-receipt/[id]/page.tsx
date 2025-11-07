
'use client';

// Import the external CSS file
import '@/app/(print)/pos/print-receipt.css';



import { notFound, useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useRef, Suspense } from 'react';
import type { Invoice, User, Location } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fetcher } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

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
  const searchParams = useSearchParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isJspmConnected, setIsJspmConnected] = useState(false);
  const companyId = searchParams.get('company_id');

   useEffect(() => {
    async function fetchInvoiceData() {
        if (!id || !companyId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pos-invoices?invoicenumber=${id}&company_id=${companyId}`);
            if (!response.ok) {
                 if (response.status === 404) notFound();
                throw new Error('Failed to fetch invoice data.');
            }
            const data: Invoice = await response.json();
            setInvoice(data);
            
            if (data.customer_code) {
                const customerResponse = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${data.customer_code}`);
                if (customerResponse.ok) {
                    const customerData = await customerResponse.json();
                    setCustomer(customerData);
                }
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
  }, [id, companyId, toast]);


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
                size: 80mm ${heightInMm + 5}mm; /* Add some buffer */
                margin: 0;
            }
        }
    `;
    document.head.appendChild(style);

    window.print();

    // Optional: Clean up the style element after printing
    // The timeout is to ensure the print dialog has had time to process the styles
    
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
  
  const subtotal = (invoice.items || []).reduce((acc, item) => acc + (parseFloat(String(item.item_price)) * parseFloat(String(item.quantity))), 0);
  const totalItemCount = (invoice.items || []).reduce((acc, item) => acc + parseFloat(String(item.quantity)), 0);
  const totalDiscount = parseFloat(invoice.discount_amount);
  const serviceCharge = parseFloat(invoice.service_charge);

  const tdl = parseFloat(invoice.tdl || "0");
  const sscl = parseFloat(invoice.sscl_tax || "0");
  const vat = parseFloat(invoice.vat_amount || "0");

  const total = subtotal - totalDiscount + serviceCharge + tdl + sscl + vat;
  
  const customerName = customer ? `${customer.customer_first_name} ${customer.customer_last_name}` : 'Walk-in';
  
  const getOrderTypeOrTable = (tableId: string) => {
    if (tableId === '0') return 'Take Away';
    if (tableId === '-1') return 'Retail';
    if (tableId === '-2') return 'Delivery';
    if (parseInt(tableId, 10) > 0) return `Table: ${tableId}`;
    return null;
  }

  const orderTypeOrTable = getOrderTypeOrTable(invoice.table_id);

  return (
    <div className="flex flex-col items-center">
      <div id="receipt-print-area" ref={receiptRef} className="shadow-lg w-[80mm] bg-white text-black p-2 font-mono text-sm leading-tight">
        <div className="text-center mb-2">
          {logoUrl && <Image src={logoUrl} alt="logo" width={40} height={40} className="mx-auto my-1" />}
          <p>{location?.location_name}</p>
          <p>{location?.address_line1}, {location?.city}</p>
          <p>Tel: {location?.phone_1}</p>
          <div className="my-2 border-t-2 border-dashed border-black"></div>
          <h1 className="font-bold text-lg">GUEST RECEIPT</h1>
        </div>
        
        <div className="text-xs space-y-0.5">
          <div className="flex justify-between"><p>Invoice #: {invoice.invoice_number}</p></div>
          <div className="flex justify-between"><p>Customer: {customerName} ({invoice.customer_code})</p></div>
          <div className="flex justify-between"><p>Date: {format(new Date(invoice.current_time.replace(' ', 'T')), "yyyy-MM-dd HH:mm:ss")}</p></div>
          <div className="flex justify-between"><p>Cashier: {invoice.created_by}</p></div>
          {orderTypeOrTable && <div className="flex justify-between font-semibold"><p>Bill Type:</p><p>{orderTypeOrTable}</p></div>}
          {invoice.steward_id !== "N/A" && <div className="flex justify-between"><p>Steward: {invoice.steward_id}</p></div>}
        </div>

        <div className="my-2 border-t-2 border-dashed border-black"></div>

        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left w-[25%]">QTY</th>
              <th className="text-left w-[25%]">PRICE</th>
              <th className="text-left w-[25%]">DISC</th>
              <th className="text-right w-[25%]">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, index) => {
              const basePrice = parseFloat(String(item.item_price));
              const lineTotal = basePrice * parseFloat(String(item.quantity));
              const itemDiscount = parseFloat(String(item.item_discount));
              return (
                <React.Fragment key={index}>
                  <tr>
                    <td colSpan={4} className="pt-1">{item.product_print_name}</td>
                  </tr>
                  <tr className="align-top">
                    <td>{parseFloat(String(item.quantity)).toFixed(3)}</td>
                    <td>{basePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>{itemDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="text-right">{(lineTotal - itemDiscount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </React.Fragment>
              )
            })}
          </tbody>
        </table>

        <div className="my-2 border-t-2 border-dashed border-black"></div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
           <div className="flex justify-between">
            <span>Total Discount:</span>
            <span>-{totalDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          {serviceCharge > 0 && (
            <div className="flex justify-between">
              <span>Service Charge:</span>
              <span>{serviceCharge.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
          {tdl > 0 && (
            <div className="flex justify-between">
              <span>TDL (1%):</span>
              <span>{tdl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
          {sscl > 0 && (
            <div className="flex justify-between">
              <span>SSCL (2.5%):</span>
              <span>{sscl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
          {vat > 0 && (
            <div className="flex justify-between">
              <span>VAT (18%):</span>
              <span>{vat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>No of Goods:</span>
            <span>{totalItemCount}</span>
          </div>
          <div className="flex justify-between font-bold text-base mt-1 border-t border-black pt-1">
            <span>TOTAL:</span>
            <span>{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="text-center mt-4 text-xs space-y-1 border-t pt-2">
            <p>Software by Payshia</p>
            <p>0770481363 | www.payshia.com</p>
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
