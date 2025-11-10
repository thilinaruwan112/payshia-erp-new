
'use client';

// Import the external CSS file
import '@/app/(print)/pos/print-receipt.css';

import { notFound, useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useRef, Suspense } from 'react';
import type { Invoice, User, Location, Table, InvoiceItem } from '@/lib/types';
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
                        const allUsers = allUsersRes.data;
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

  const handlePrint = () => {
    if (!receiptRef.current) return;
    window.print();
    setTimeout(() => window.close(), 100);
  };

  useEffect(() => {
    if (!isLoading && invoice) {
      document.title = `Guest Receipt - ${invoice.invoice_number}`;
      handlePrint();
    }
  }, [isLoading, invoice]);

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

  const calculateInclusivePrice = (basePrice: number) => {
    if (!location || !invoice) return basePrice;

    const orderType = getOrderTypeOrTable(invoice.table_id);

    let serviceCharge = 0;
    if (orderType?.startsWith('Dine-In') && location.service_charge_status === 'Enabled') {
        serviceCharge = basePrice * 0.10;
    }
    
    let tdl = 0;
    if (location.tdl_status === 'Enabled') {
      tdl = (basePrice + serviceCharge) * 0.01;
    }

    const baseForSscl = basePrice + serviceCharge;
    let sscl = 0;
    if (location.sscl_status === 'Enabled') {
      sscl = baseForSscl * 0.025;
    }
    
    const baseForVat = baseForSscl + tdl + sscl;
    let vat = 0;
    if (location.vat_status === 'Enabled') {
      vat = baseForVat * 0.18;
    }

    return basePrice + serviceCharge + tdl + sscl + vat;
  }

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
  
  const totalDiscount = parseFloat(invoice.discount_amount);
  
  const adjustedItems = (invoice.items || []).map(item => {
    const basePrice = parseFloat(String(item.item_price));
    const inclusivePrice = calculateInclusivePrice(basePrice);
    const displayPrice = inclusivePrice * 0.9;
    const quantity = parseFloat(String(item.quantity));
    const lineTotal = displayPrice * quantity;
    return { ...item, displayPrice, lineTotal };
  });

  const subtotal = adjustedItems.reduce((acc, item) => acc + item.lineTotal, 0);
  const serviceCharge = subtotal * 0.1; // 10% of the new subtotal
  const grandTotal = subtotal + serviceCharge - totalDiscount;
  
  const itemCount = invoice.items?.length || 0;
  const totalQuantity = (invoice.items || []).reduce((acc, item) => acc + parseFloat(String(item.quantity)), 0);

  
  const orderTypeOrTable = getOrderTypeOrTable(invoice.table_id);
  const cashierName = cashier ? `${cashier.first_name} ${cashier.last_name}` : invoice.created_by;
  const stewardName = steward ? `${steward.first_name} ${steward.last_name}` : null;
  const customerName = customer ? `${customer.customer_first_name} ${customer.customer_last_name}` : `(ID: ${invoice.customer_code})`;

  return (
    <div className="flex flex-col items-center">
      <div id="receipt-print-area" ref={receiptRef} className="shadow-lg w-[80mm] bg-white text-black p-2 font-mono text-sm leading-tight">
        <div className="text-center mb-2">
          {logoUrl && <Image src={logoUrl} alt="logo" width={100} height={50} className="mx-auto my-1" priority />}
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
            <tr className="font-semibold">
              <td className="text-left w-[10%]">Item</td>
              <td className="text-left w-[20%]">Marked Price</td>
              <td className="text-center w-[20%]">Our Price</td>
              <td className="text-right w-[10%]">Qty</td>
              <td className="text-right w-[20%]">Amount</td>
            </tr>
          </thead>
          <tbody>
            {adjustedItems.map((item, index) => {
              const basePrice = parseFloat(String(item.item_price));
              const inclusivePrice = calculateInclusivePrice(basePrice);
              const itemDiscount = parseFloat(String(item.item_discount)) || 0;
              const displayPrice = item.displayPrice;
              const ourPrice = displayPrice - (itemDiscount / item.quantity); // Distribute item discount
              const quantity = parseFloat(String(item.quantity));
              const lineTotal = ourPrice * quantity;
              
              return (
                <React.Fragment key={index}>
                    <tr className="border-t border-dashed border-black">
                        <td colSpan={5}>{index + 1}. {item.variant_sku} | {item.product_print_name}</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td className="text-left">{inclusivePrice.toFixed(2)}</td>
                        <td className="text-center">{ourPrice.toFixed(2)}</td>
                        <td className="text-right">{quantity.toFixed(2)}</td>
                        <td className="text-right font-semibold">{lineTotal.toFixed(2)}</td>
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
            <span>{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Service Charge:</span>
            <span>{serviceCharge.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Discount:</span>
            <span>-{totalDiscount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base mt-1 border-t border-black pt-1">
            <span>TOTAL:</span>
            <span>{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="my-2 border-t-2 border-dashed border-black"></div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Item Count:</span>
            <span>{itemCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Sold Quantity:</span>
            <span>{totalQuantity.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center mt-4 text-xs space-y-1 border-t pt-2">
            <p className="font-bold">Thank You!</p>
            <p>For inquiries, please contact us within 24 hours.</p>
            <p>Software by Payshia</p>
            <p>0770481363 | www.payshia.com</p>
        </div>
      </div>
      <Button className="w-full mt-2 print:hidden max-w-[80mm]" onClick={handlePrint}>Print</Button>
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
