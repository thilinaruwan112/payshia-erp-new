

'use client'

import { type SupplierReturn, type Supplier, type Location } from '@/lib/types';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const suppliers: Supplier[] = [
    { supplier_id: 'sup-123', supplier_name: 'Global Textiles Inc.', contact_person: 'John Doe', email: 'contact@globaltextiles.com', telephone: '111-222-3333', street_name: '123 Textile Ave', city: 'Fiberburg', zip_code: '12345', fax: '111-222-3334', opening_balance: '1000' },
    { supplier_id: 'sup-456', supplier_name: 'Leather Goods Co.', contact_person: 'Jane Smith', email: 'sales@leatherco.com', telephone: '444-555-6666', street_name: '456 Hide St', city: 'Tannerville', zip_code: '67890', fax: '444-555-6667', opening_balance: '5000' },
];

const supplierReturns: SupplierReturn[] = [
    {
        id: 'RTN-001',
        grnId: 'GRN-001',
        supplierId: 'sup-123',
        supplierName: 'Global Textiles Inc.',
        date: '2023-10-10',
        totalValue: 150.00,
        items: [
            { sku: 'TS-BLK-M', returnedQty: 10, unitPrice: 15.00, reason: 'Damaged' }
        ]
    },
    {
        id: 'RTN-002',
        grnId: 'GRN-003',
        supplierId: 'sup-456',
        supplierName: 'Leather Goods Co.',
        date: '2023-10-12',
        totalValue: 80.00,
        items: [
            { sku: 'LW-BRN-OS', returnedQty: 2, unitPrice: 40.00, reason: 'Wrong item' }
        ]
    }
];

interface PrintViewProps {
    id: string;
}

interface Company {
    id: string;
    company_name: string;
    company_address: string;
    company_city: string;
    company_email: string;
    company_telephone: string;
}

export function SupplierReturnPrintView({ id }: PrintViewProps) {
  const [sReturn, setSReturn] = useState<SupplierReturn | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    // Mocking API call
    const returnData = supplierReturns.find(r => r.id === id);
    if (returnData) {
        setSReturn(returnData);
        const supplierData = suppliers.find(s => s.supplier_id === returnData.supplierId);
        setSupplier(supplierData || null);
        
        // Mock company and location data
        setCompany({
            id: '1',
            company_name: 'Payshia ERP',
            company_address: '#455, 533A3, Pelmadulla',
            company_city: 'Rathnapura',
            company_email: 'info@payshia.com',
            company_telephone: '045-222-2222',
        });
        setLocation({
             location_id: '1', location_name: 'Main Warehouse', address_line1: '#455, 533A3, Pelmadulla', city: 'Rathnapura', location_code: '', is_active: '', created_at: '', created_by: '', logo_path: '', address_line2: '', phone_1: '', phone_2: '', pos_status: '', pos_token: '', location_type: '', company_id: 1,
        });

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
          <h1 className="text-2xl font-bold text-gray-800">{company?.company_name || 'Payshia ERP'}</h1>
          <p>{location?.address_line1}, {location?.city}</p>
          <p>{company?.company_email}</p>
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
              <th className="p-3 w-[40%]">Description (SKU)</th>
              <th className="p-3 w-[30%]">Reason</th>
              <th className="p-3 text-right">Returned Qty</th>
              <th className="p-3 text-right">Unit Price</th>
              <th className="p-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sReturn.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="p-3">{item.sku}</td>
                <td className="p-3">{item.reason}</td>
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
