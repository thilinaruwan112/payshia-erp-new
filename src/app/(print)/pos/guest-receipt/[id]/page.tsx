
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
import { openCenteredPopup } from '@/lib/utils';

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
  const [steward, setSteward] = useState<User | null>(null);
  const [cashier, setCashier] = useState<User | null>(null);
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
            
            const fetchPromises: Promise<any>[] = [];

            if (data.customer_code) {
                fetchPromises.push(fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${data.customer_code}`).then(res => res.ok ? res.json() : null));
            } else {
                fetchPromises.push(Promise.resolve(null));
            }

            if (data.company_id && data.location_id) {
                fetchPromises.push(fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/companies/${data.company_id}`).then(res => res.ok ? res.json() : null));
                fetchPromises.push(fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/locations/${data.location_id}`).then(res => res.ok ? res.json() : null));
            } else {
                fetchPromises.push(Promise.resolve(null), Promise.resolve(null));
            }
            
            if (data.steward_id && data.steward_id !== "N/A") {
                fetchPromises.push(fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${data.steward_id}`).then(res => res.ok ? res.json() : null));
            } else {
                fetchPromises.push(Promise.resolve(null));
            }

            if(data.created_by) {
                fetchPromises.push(fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`).then(async res => {
                    if(res.ok) {
                        const allUsersRes = await res.json();
                        const allUsers = allUsersRes.data;
                        return allUsers.find((u:User) => u.user_name === data.created_by) || null;
                    }
                    return null;
                }));
            } else {
                fetchPromises.push(Promise.resolve(null));
            }

            const [customerData, companyData, locationData, stewardData, cashierData] = await Promise.all(fetchPromises);

            setCustomer(customerData);
            setCompany(companyData);
            setLocation(locationData);
            setSteward(stewardData?.data);
            setCashier(cashierData);

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

    const initJSPM = () => {
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
    setTimeout(initJSPM, 500);
  }, []);

  const handlePrint = async () => {
    if (!receiptRef.current) return;
    
    setTimeout(() => {
        openCenteredPopup(`/pos/guest-receipt/${id}?company_id=${companyId}`, 'Guest Receipt', 400, 800);
    }, 500);
  };

  useEffect(() => {
    if (!isLoading && invoice) {
        document.title = `Guest Receipt - ${invoice.invoice_number}`;
        handlePrint();
    }
  }, [isLoading, invoice, isJspmConnected, id, companyId]);

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
  
  const calculateInclusivePrice = (basePrice: number) => {
    const isDineIn = invoice.remark?.toLowerCase().includes('dine-in');
    const serviceChargeForItem = isDineIn ? basePrice * 0.10 : 0;
    const tdl = basePrice * 0.01;
    const baseForSscl = basePrice + serviceChargeForItem;
    const sscl = baseForSscl * 0.025;
    const baseForVat = baseForSscl + tdl + sscl;
    const vat = baseForVat * 0.18;
    return basePrice + serviceChargeForItem + tdl + sscl + vat;
  }
  
  const subtotal = (invoice.items || []).reduce((acc, item) => {
    const basePrice = parseFloat(String(item.item_price));
    const inclusivePrice = calculateInclusivePrice(basePrice);
    const quantity = parseFloat(String(item.quantity));
    const itemDiscount = parseFloat(String(item.item_discount));
    return acc + (inclusivePrice * quantity) - itemDiscount;
  }, 0);

  const totalDiscount = parseFloat(invoice.discount_amount);
  const grandTotal = parseFloat(invoice.grand_total);
  

  const getOrderTypeOrTable = (tableId: string) => {
    const tableIdNum = parseInt(tableId, 10);
    if (tableIdNum > 0) return 'Dine-In';
    if (tableIdNum === 0) return 'Take Away';
    if (tableIdNum === -1) return 'Retail';
    if (tableIdNum === -2) return 'Delivery';
    return null;
  }

  const orderTypeOrTable = getOrderTypeOrTable(invoice.table_id);
  const cashierName = cashier ? `${cashier.first_name} ${cashier.last_name}` : invoice.created_by;
  const stewardName = steward ? `${steward.first_name} ${steward.last_name}` : null;


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
          <div className="flex justify-between"><p>Customer: {customer?.first_name} {customer?.last_name || ''} ({invoice.customer_code})</p></div>
          <div className="flex justify-between"><p>Date: {format(new Date(invoice.current_time.replace(' ', 'T')), "yyyy-MM-dd HH:mm:ss")}</p></div>
          <div className="flex justify-between"><p>Cashier: {cashierName}</p></div>
          {orderTypeOrTable && <div className="flex justify-between"><p className="font-semibold">Bill Type:</p><p>{orderTypeOrTable} {parseInt(invoice.table_id) > 0 ? `(Table: ${invoice.table_id})` : ''}</p></div>}
          {stewardName && <div className="flex justify-between"><p>Steward: {stewardName}</p></div>}
        </div>

        <div className="my-2 border-t-2 border-dashed border-black"></div>

        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left">ITEM</th>
              <th className="text-center w-[20%]">QTY</th>
              <th className="text-right w-[25%]">PRICE</th>
              <th className="text-right w-[25%]">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, index) => {
              const basePrice = parseFloat(String(item.item_price));
              const inclusivePrice = calculateInclusivePrice(basePrice);
              const quantity = parseFloat(String(item.quantity));
              const itemDiscount = parseFloat(String(item.item_discount));
              const lineTotal = (inclusivePrice * quantity) - itemDiscount;

              return (
                <React.Fragment key={index}>
                  <tr>
                    <td colSpan={4} className="pt-1">{item.product_print_name}</td>
                  </tr>
                  <tr className="align-top">
                    <td></td>
                    <td className="text-center">{quantity.toFixed(3)}</td>
                    <td className="text-right">{basePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="text-right">{lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                   {itemDiscount > 0 && (
                     <tr>
                        <td colSpan={3} className="text-right text-xs">Discount:</td>
                        <td className="text-right text-xs">-{itemDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  )}
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
          <div className="flex justify-between font-bold text-base mt-1 border-t border-black pt-1">
            <span>TOTAL:</span>
            <span>{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
