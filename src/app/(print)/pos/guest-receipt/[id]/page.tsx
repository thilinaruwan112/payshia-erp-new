
'use client';

// Import the external CSS file
import '@/app/(print)/pos/print-receipt.css';



import { notFound, useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useRef, Suspense } from 'react';
import type { Invoice, User, Location, Table } from '@/lib/types';
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
  const [steward, setSteward] = useState<User | null>(null);
  const [cashier, setCashier] = useState<User | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
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
                fetchPromises.push(fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/master-tables/filter/by-company?company_id=${data.company_id}`).then(res => res.ok ? res.json() : []));
            } else {
                fetchPromises.push(Promise.resolve(null), Promise.resolve(null), Promise.resolve(null));
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
                        const allUsers: User[] = allUsersRes.data;
                        return allUsers.find((u:User) => u.user_name === data.created_by) || null;
                    }
                    return null;
                }));
            } else {
                fetchPromises.push(Promise.resolve(null));
            }

            const [customerData, companyData, locationData, tablesData, stewardData, cashierData] = await Promise.all(fetchPromises);

            if (customerData) setCustomer(customerData);
            if (companyData) setCompany(companyData);
            if (locationData) setLocation(locationData);
            if (tablesData) setTables(tablesData);
            if (stewardData) setSteward(stewardData.data);
            if (cashierData) setCashier(cashierData);

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
    
    const printAndClose = () => {
        window.print();
        setTimeout(() => window.close(), 100);
    }
    
    if (!window.JSPM || !isJspmConnected) {
        console.warn("JSPM not ready or not connected. Falling back to browser print.");
        printAndClose();
        return;
    }

    try {
        const element = receiptRef.current;
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: null });

        const b64Prefix = "data:image/png;base64,";
        const imgBase64DataUri = canvas.toDataURL("image/png");
        const imgBase64Content = imgBase64DataUri.substring(b64Prefix.length);

        const { ClientPrintJob, InstalledPrinter, PrintFile, FileSourceType } = window.JSPM;

        const cpj = new ClientPrintJob();
        const myPrinter = new InstalledPrinter("KOT-Printer"); 
        
        cpj.clientPrinter = myPrinter;

        const myImageFile = new PrintFile(
            imgBase64Content,
            FileSourceType.Base64,
            `GR-${invoice?.invoice_number}.png`,
            1
        );
        cpj.files.push(myImageFile);

        cpj.sendToClient();

        setTimeout(() => {
            window.close();
        }, 3000);

    } catch (error) {
        console.error("Printing error:", error);
        alert("An error occurred while printing. Falling back to browser print.");
        printAndClose();
    }
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
  
  const subtotal = (invoice.items || []).reduce((acc, item) => {
    const itemPrice = parseFloat(String(item.item_price));
    const quantity = parseFloat(String(item.quantity));
    return acc + (itemPrice * quantity);
  }, 0);

  const totalDiscount = parseFloat(invoice.discount_amount);
  const grandTotal = parseFloat(invoice.grand_total);
  

  const getOrderTypeOrTable = (tableId: string) => {
    if (parseInt(tableId, 10) > 0) {
      const tableName = tables.find(t => t.id === tableId)?.table_name;
      return `Dine-In (Table: ${tableName || tableId})`;
    }
    if (tableId === '0') return 'Take Away';
    if (tableId === '-1') return 'Retail';
    if (tableId === '-2') return 'Delivery';
    return null;
  }

  const orderTypeOrTable = getOrderTypeOrTable(invoice.table_id);
  const cashierName = cashier ? `${cashier.first_name} ${cashier.last_name}` : invoice.created_by;
  const stewardName = steward ? `${steward.first_name} ${steward.last_name}` : null;
  const customerName = customer ? `${customer.customer_first_name} ${customer.customer_last_name}` : `(ID: ${invoice.customer_code})`;

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
          <div className="flex justify-between"><p>Customer: {customerName}</p></div>
          <div className="flex justify-between"><p>Date: {format(new Date(invoice.current_time.replace(' ', 'T')), "yyyy-MM-dd HH:mm:ss")}</p></div>
          <div className="flex justify-between"><p>Cashier: {cashierName}</p></div>
          {orderTypeOrTable && <div className="flex justify-between"><p className="font-semibold">Bill Type:</p><p>{orderTypeOrTable}</p></div>}
          {stewardName && <div className="flex justify-between"><p>Steward: {stewardName}</p></div>}
        </div>

        <div className="my-2 border-t-2 border-dashed border-black"></div>

        <table className="w-full text-xs">
           <thead>
              <tr>
                <th colSpan={5} className="text-left py-1"># ITEM</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, index) => {
                const basePrice = parseFloat(String(item.item_price));
                const quantity = parseFloat(String(item.quantity));
                const itemDiscount = parseFloat(String(item.item_discount)) || 0;
                const discountedPrice = basePrice;
                const lineTotal = discountedPrice * quantity;

                return (
                  <React.Fragment key={index}>
                    <tr>
                      <td colSpan={5} className="pt-1 font-semibold">
                        - {item.variant_sku} - {item.product_print_name}
                      </td>
                    </tr>
                    <tr className="align-top">
                      <td className="w-[5%] text-left">{index + 1}.</td>
                      <td className="w-[25%] text-right">{basePrice.toFixed(2)}</td>
                      <td className="w-[25%] text-right">{discountedPrice.toFixed(2)}</td>
                      <td className="w-[20%] text-center">{quantity.toFixed(2)}</td>
                      <td className="w-[25%] text-right">{lineTotal.toFixed(2)}</td>
                    </tr>
                    {itemDiscount > 0 && (
                      <tr className="text-xs">
                          <td colSpan={4} className="text-right italic">Discount:</td>
                          <td className="text-right italic">-{itemDiscount.toFixed(2)}</td>
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
            <span>{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Discount:</span>
            <span>-{totalDiscount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base mt-1 border-t border-black pt-1">
            <span>TOTAL:</span>
            <span>{grandTotal.toFixed(2)}</span>
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
