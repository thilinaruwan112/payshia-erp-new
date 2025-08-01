
'use client'

import { type SupplierReturn, type Supplier } from '@/lib/types';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { supplierReturns, suppliers } from '@/lib/data';

interface PrintViewProps {
    id: string;
}

export function SupplierReturnPrintView({ id }: PrintViewProps) {
  const [sReturn, setSReturn] = useState<SupplierReturn | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    // Mocking API call
    const returnData = supplierReturns.find(r => r.id === id);
    if (returnData) {
        setSReturn(returnData);
        const supplierData = suppliers.find(s => s.id === returnData.supplierId);
        setSupplier(supplierData || null);
    } else {
        notFound();
    }
    setIsLoading(false);
  }, [id]);
  
  useEffect(() => {
    if (sReturn) {
        document.title = `${sReturn.id} - Return Note - Payshia ERP`;
    }
  }, [sReturn]);

  useEffect(() => {
    if (!isLoading && sReturn) {
        setTimeout(() => window.print(), 500);
    }
  }, [isLoading, sReturn]);
  
  
  if (isLoading) {
    return <PrintViewSkeleton />;
  }

  if (!sReturn) {
    return <div>Return Note not found or failed to load.</div>;
  }


  return (
    <div className="bg-white text-black font-[Poppins] text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8 flex flex-col">
      <header className="flex justify-between items-start pb-6 border-b-2 border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payshia ERP</h1>
          <p>#455, 533A3, Pelmadulla</p>
          <p>Rathnapura, 70070</p>
          <p>info@payshia.com</p>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-bold uppercase text-gray-700">Supplier Return Note</h2>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1">Return To</h3>
          <p className="font-bold text-gray-800">{supplier?.supplier_name}</p>
          <p>{supplier?.street_name}</p>
          <p>{supplier?.city}, {supplier?.zip_code}</p>
          <p>{supplier?.email}</p>
        </div>
        <div className="text-right">
          <div className="grid grid-cols-2 gap-1">
            <span className="font-semibold text-gray-600">Return #:</span>
            <span>{sReturn.id}</span>
            <span className="font-semibold text-gray-600">GRN Ref #:</span>
            <span>{sReturn.grnId}</span>
            <span className="font-semibold text-gray-600">Date:</span>
            <span>{format(new Date(sReturn.date), "dd MMM, yyyy")}</span>
          </div>
        </div>
      </section>

      <section className="mt-8 flex-grow">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
              <th className="p-3 w-1/2">Description (SKU)</th>
              <th className="p-3 text-right">Returned Qty</th>
              <th className="p-3 text-right">Unit Price</th>
              <th className="p-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sReturn.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="p-3">{item.sku}</td>
                <td className="p-3 text-right">{item.returnedQty}</td>
                <td className="p-3 text-right">${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-3 text-right">${(item.returnedQty * item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex justify-end mt-6">
        <div className="w-full max-w-xs space-y-2 text-gray-700">
           <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t-2 border-gray-200">
            <span>Total Value</span>
            <span>${sReturn.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </section>

       <footer className="mt-auto pt-6 text-center text-gray-500 text-xs">
         <div className="mt-12 pt-6 border-t-2 border-gray-200">
            <p className="font-semibold">Goods returned in good condition.</p>
         </div>
         <div className="flex justify-between items-end text-sm mt-16">
            <div>
                <p className="border-t-2 border-gray-400 border-dotted pt-2 px-12"></p>
                <p>Authorized Signature</p>
            </div>
             <div>
                <p className="border-t-2 border-gray-400 border-dotted pt-2 px-12"></p>
                <p>Supplier Signature</p>
            </div>
        </div>
      </footer>
    </div>
  );
}

function PrintViewSkeleton() {
  return (
    <div className="p-8">
      <Skeleton className="h-[800px] w-full" />
    </div>
  );
}
