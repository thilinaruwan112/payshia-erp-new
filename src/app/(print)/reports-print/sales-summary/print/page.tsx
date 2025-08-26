
'use client'

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import type { Invoice } from '@/lib/types';
import { format } from 'date-fns';

function PrintViewContent() {
  const searchParams = useSearchParams();
  const [reportData, setReportData] = useState<Invoice[]>([]);
  
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');
  const location = searchParams.get('location');
  const dataString = searchParams.get('data');

  useEffect(() => {
    if (dataString) {
      setReportData(JSON.parse(decodeURIComponent(dataString)));
    }
  }, [dataString]);

  useEffect(() => {
    if (reportData.length > 0) {
      document.title = `Sale Summary Report - ${fromDate} to ${toDate}`;
      setTimeout(() => window.print(), 1000);
    }
  }, [reportData, fromDate, toDate]);

  const totals = React.useMemo(() => {
    return reportData.reduce((acc, inv) => {
        acc.subTotal += parseFloat(inv.inv_amount || '0');
        acc.discount += parseFloat(inv.discount_amount || '0');
        acc.charge += parseFloat(inv.service_charge || '0');
        acc.grandTotal += parseFloat(inv.grand_total || '0');
        return acc;
    }, { subTotal: 0, discount: 0, charge: 0, grandTotal: 0, return: 0 });
  }, [reportData]);
  
  return (
    <div className="bg-white text-black font-sans text-sm w-[210mm] min-h-[297mm] shadow-lg print:shadow-none p-8">
        <header className="flex justify-between items-start pb-4 border-b">
            <div>
                <h1 className="text-lg font-bold">Payshia Software Solutions</h1>
                <p>#533A3, Rathnapura Road</p>
                <p>Pelmadulla, 70070</p>
                <p>Tel: 0770481363 / 0721185012</p>
                <p>Email: info@payshia.com</p>
                <p>Web: www.payshia.com</p>
            </div>
            <div className="text-right">
                <h2 className="text-2xl font-bold uppercase">Sale Summary Report</h2>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="font-semibold">From Date:</span>
                    <span>{fromDate}</span>
                    <span className="font-semibold">To Date:</span>
                    <span>{toDate}</span>
                    <span className="font-semibold">Location:</span>
                    <span>{location}</span>
                </div>
            </div>
        </header>
        <p className="text-xs text-gray-600 mt-2">Report is generated on {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>

        <main className="mt-6">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#3B5998] text-white">
                        <th className="p-2 border border-gray-300">Date</th>
                        <th className="p-2 border border-gray-300">Invoice #</th>
                        <th className="p-2 border border-gray-300">Customer</th>
                        <th className="p-2 border border-gray-300 text-right">Sub Total</th>
                        <th className="p-2 border border-gray-300 text-right">Discount</th>
                        <th className="p-2 border border-gray-300 text-right">Charge</th>
                        <th className="p-2 border border-gray-300 text-right">Return</th>
                        <th className="p-2 border border-gray-300 text-right">Grand Total</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.map((invoice) => (
                        <tr key={invoice.id} className="border-b">
                            <td className="p-2 border border-gray-300">{format(new Date(invoice.invoice_date), 'yyyy-MM-dd')}</td>
                            <td className="p-2 border border-gray-300">{invoice.invoice_number}</td>
                            <td className="p-2 border border-gray-300">{(invoice as any).customerName}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{parseFloat(invoice.inv_amount).toFixed(2)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{parseFloat(invoice.discount_amount).toFixed(2)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{parseFloat(invoice.service_charge).toFixed(2)}</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">0.00</td>
                            <td className="p-2 border border-gray-300 text-right font-mono">{parseFloat(invoice.grand_total).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="font-bold bg-gray-100">
                        <td colSpan={3} className="p-2 border border-gray-300 text-right">Totals</td>
                        <td className="p-2 border border-gray-300 text-right font-mono">{totals.subTotal.toFixed(2)}</td>
                        <td className="p-2 border border-gray-300 text-right font-mono">{totals.discount.toFixed(2)}</td>
                        <td className="p-2 border border-gray-300 text-right font-mono">{totals.charge.toFixed(2)}</td>
                        <td className="p-2 border border-gray-300 text-right font-mono">{totals.return.toFixed(2)}</td>
                        <td className="p-2 border border-gray-300 text-right font-mono">{totals.grandTotal.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </main>
    </div>
  )
}

export default function PrintSalesSummaryPage() {
    return (
        <Suspense fallback={<div>Loading report...</div>}>
            <PrintViewContent />
        </Suspense>
    )
}
