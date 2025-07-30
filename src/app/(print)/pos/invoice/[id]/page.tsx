
'use client';

import { useSearchParams } from 'next/navigation';
import React, { useEffect } from 'react';
import type { CartItem, OrderInfo, ActiveOrder } from '@/app/(pos)/pos-system/page';
import { Skeleton } from '@/components/ui/skeleton';

function PosInvoicePrint() {
  const searchParams = useSearchParams();
  const [order, setOrder] = React.useState<ActiveOrder | null>(null);
  const [orderInfo, setOrderInfo] = React.useState<OrderInfo | null>(null);
  const [cashierName, setCashierName] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const orderData = searchParams.get('order');
    const orderInfoData = searchParams.get('orderInfo');
    const cashier = searchParams.get('cashier');

    if (orderData && orderInfoData) {
      try {
        setOrder(JSON.parse(orderData));
        setOrderInfo(JSON.parse(orderInfoData));
        setCashierName(cashier || 'N/A');
      } catch (e) {
        console.error("Failed to parse order data", e);
      }
    }
    setIsLoading(false);
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && order) {
      document.title = `Receipt - ${order.name}`;
      setTimeout(() => window.print(), 500);
    }
  }, [isLoading, order]);

  if (isLoading || !order || !orderInfo) {
    return (
      <div className="w-[58mm] bg-white text-black p-2 font-mono">
        <Skeleton className="h-5 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-full mt-1" />
        <div className="my-2 border-t border-dashed border-black"></div>
        <div className="space-y-2">
            {Array.from({length: 3}).map((_, i) => (
                <div key={i}>
                    <Skeleton className="h-4 w-full" />
                    <div className="flex justify-between">
                         <Skeleton className="h-4 w-1/4" />
                         <Skeleton className="h-4 w-1/4" />
                    </div>
                </div>
            ))}
        </div>
        <div className="my-2 border-t border-dashed border-black"></div>
         <div className="space-y-1 mt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-[58mm] bg-white text-black p-1 font-mono text-[9px] leading-snug">
      <div className="text-center">
        <h1 className="font-bold text-sm">Payshia Store</h1>
        <p>#455, Pelmadulla, Rathnapura</p>
        <p>045-222-2222</p>
        <p>www.payshia.com</p>
      </div>

      <div className="my-2 border-t border-dashed border-black"></div>
      
      <div>
        <p>Date: {new Date().toLocaleString()}</p>
        <p>Receipt#: {order.id}</p>
        <p>Cashier: {cashierName}</p>
      </div>

      <div className="my-2 border-t border-dashed border-black"></div>

      {/* Items */}
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left">ITEM</th>
            <th className="text-center">QTY</th>
            <th className="text-right">PRICE</th>
          </tr>
        </thead>
        <tbody>
          {order.cart.map((item: CartItem) => (
            <tr key={item.product.id}>
              <td colSpan={3}>{item.product.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="my-2 border-t border-dashed border-black"></div>

      {/* Totals */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${orderInfo.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount:</span>
          <span>-${(orderInfo.discount + orderInfo.itemDiscounts).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax:</span>
          <span>${orderInfo.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-xs mt-1 border-t border-black pt-1">
          <span>TOTAL:</span>
          <span>${orderInfo.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="my-2 border-t border-dashed border-black"></div>

      <div className="text-center mt-2">
        <p className="font-bold">Thank You!</p>
        <p>Please come again.</p>
      </div>
    </div>
  );
}


export default function POSInvoicePage() {
    return (
        <React.Suspense fallback={<div className="w-[58mm] bg-white text-black p-2 font-mono">Loading...</div>}>
            <PosInvoicePrint />
        </React.Suspense>
    )
}
