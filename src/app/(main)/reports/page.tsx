
'use client';

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense, useCallback } from 'react';
import type { User, Supplier, Product, ProductVariant, Collection, Color, Size, Brand } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ReportFilters } from '@/components/reports/report-filters';
import { ReportList } from '@/components/reports/report-list';
import { CustomerReportView } from '@/components/reports/customer-report-view';
import { SupplierReportView } from '@/components/reports/supplier-report-view';
import { ItemMasterReportView } from '@/components/reports/item-master-report-view';
import { cn } from '@/lib/utils';
import { useLocation } from '@/components/location-provider';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { allReports, reportCategories } from '@/lib/report-list';


interface ProductWithVariants {
    product: Product;
    variants: ProductVariant[];
}
type ReportData = User[] | Supplier[] | ProductWithVariants[];

function ReportsPage() {
    const searchParams = useSearchParams();
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [reportData, setReportData] = useState<ReportData>([]);
    const { company_id } = useLocation();
    const { toast } = useToast();

    const handleShowReport = useCallback((data: ReportData) => {
        setReportData(data);
    }, []);
    
    const handleSelectReport = useCallback((name: string) => {
        setSelectedReport(name);
        setReportData([]);
    }, []);
    
    const handlePrintReport = useCallback(() => {
        if (!company_id) return;
        let url = '';
        if (selectedReport === 'Customer Master Report') {
            url = `/reports-print/customer-report/print?company_id=${company_id}`;
        } else if (selectedReport === 'Supplier Master Report') {
            url = `/reports-print/supplier-report/print?company_id=${company_id}`;
        } else if (selectedReport === 'Item Master Report') {
             url = `/reports-print/item-master-report/print?company_id=${company_id}`;
        }
        
        if (url) {
            window.open(url, '_blank');
        } else {
             toast({ title: "Coming Soon", description: "This report is not yet available for printing." });
        }
    }, [selectedReport, company_id, toast]);

    const handleExportCSV = useCallback(() => {
        if (reportData.length === 0) {
            toast({ variant: 'destructive', title: 'No data', description: 'Please view the report first to export.' });
            return;
        }

        let headers: string[] = [];
        let rows: string[][] = [];
        let filename = 'report.csv';

        if(selectedReport === 'Customer Master Report' && reportData.length > 0 && 'customer_first_name' in reportData[0]) {
            headers = ["Customer Name", "Phone Number", "Email", "Address"];
            rows = (reportData as User[]).map(customer => [
                `"${customer.customer_first_name} ${customer.customer_last_name}"`,
                customer.phone_number || '',
                customer.email_address || '',
                `"${customer.address_line1 || ''}, ${customer.city}"`
            ]);
            filename = 'customer_report.csv';
        } else if (selectedReport === 'Supplier Master Report' && reportData.length > 0 && 'supplier_name' in reportData[0]) {
             headers = ["Supplier Name", "Contact Person", "Phone", "Email"];
            rows = (reportData as Supplier[]).map(supplier => [
                `"${supplier.supplier_name}"`,
                `"${supplier.contact_person}"`,
                supplier.telephone,
                supplier.email
            ]);
            filename = 'supplier_report.csv';
        } else if (selectedReport === 'Item Master Report' && reportData.length > 0 && 'product' in reportData[0]) {
            headers = ['Product Name', 'SKU', 'Category', 'Brand', 'Stock'];
            rows = (reportData as ProductWithVariants[]).flatMap(p => 
                p.variants.map(v => ([
                    p.product.name,
                    v.sku,
                    p.product.category,
                    'N/A', // Placeholder for brand
                    String(v.stock || 0)
                ]))
            );
            filename = 'item_master_report.csv';
        }

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [reportData, selectedReport, toast]);
    
    const handleExportPdf = useCallback(() => {
        if (reportData.length === 0) {
            toast({ variant: 'destructive', title: 'No data', description: 'Please view the report first to export.' });
            return;
        }
        
        const doc = new jsPDF();
        doc.text(selectedReport || 'Report', 14, 16);

        let head: string[][] = [];
        let body: (string | number)[][] = [];
        let filename = 'report.pdf';

        if(selectedReport === 'Customer Master Report' && reportData.length > 0 && 'customer_first_name' in reportData[0]) {
            head = [['Customer Name', 'Phone Number', 'Email', 'Address']];
            body = (reportData as User[]).map(customer => [
                `${customer.customer_first_name} ${customer.customer_last_name}`,
                customer.phone_number || '',
                customer.email_address || '',
                `${customer.address_line1 || ''}, ${customer.city}`
            ]);
            filename = 'customer_report.pdf';
        } else if (selectedReport === 'Supplier Master Report' && reportData.length > 0 && 'supplier_name' in reportData[0]) {
            head = [['Supplier Name', 'Contact Person', 'Phone', 'Email']];
            body = (reportData as Supplier[]).map(supplier => [
                supplier.supplier_name,
                supplier.contact_person,
                supplier.telephone,
                supplier.email,
            ]);
            filename = 'supplier_report.pdf';
        } else if (selectedReport === 'Item Master Report' && reportData.length > 0 && 'product' in reportData[0]) {
            head = [['Product Name', 'SKU', 'Category', 'Brand', 'Stock']];
            body = (reportData as ProductWithVariants[]).flatMap(p => 
                p.variants.map(v => ([
                    p.product.name,
                    v.sku,
                    p.product.category,
                    'N/A',
                    v.stock || 0
                ]))
            );
            filename = 'item_master_report.pdf';
        }

        autoTable(doc, { head, body, startY: 25 });
        doc.save(filename);
    }, [reportData, selectedReport, toast]);

    useEffect(() => {
      const reportParam = searchParams.get('report');
      if (reportParam && allReports.find(r => r.name === reportParam)) {
          handleSelectReport(reportParam);
      }
    }, [searchParams, handleSelectReport]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports Center</h1>
        <p className="text-muted-foreground">
          Access all your business analytics and insights from one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        <div className={cn("md:col-span-1", selectedReport && "hidden md:block")}>
           <ReportList
              reportCategories={reportCategories}
              selectedReport={selectedReport}
              onSelectReport={handleSelectReport}
           />
        </div>

        <div className={cn("md:col-span-3 w-full", !selectedReport && "hidden md:flex")}>
            <div className="w-full space-y-8">
                {selectedReport ? (
                     <div className="w-full space-y-8">
                        <ReportFilters 
                            key={selectedReport} // Add key to force re-mount on report change
                            reportName={selectedReport} 
                            onBack={() => setSelectedReport(null)} 
                            onShowReport={handleShowReport}
                            onPrintReport={handlePrintReport}
                            onExportCsv={handleExportCSV}
                            onExportPdf={handleExportPdf}
                            reportData={reportData}
                        />
                         {reportData.length > 0 && selectedReport === 'Customer Master Report' && (
                            <CustomerReportView customers={reportData as User[]} />
                         )}
                         {reportData.length > 0 && selectedReport === 'Supplier Master Report' && (
                            <SupplierReportView suppliers={reportData as Supplier[]} />
                         )}
                          {reportData.length > 0 && selectedReport === 'Item Master Report' && (
                            <ItemMasterReportView products={reportData as ProductWithVariants[]} />
                         )}
                    </div>
                ) : (
                    <div className="flex w-full items-center justify-center h-full border-2 border-dashed rounded-lg min-h-[400px]">
                        <p className="text-muted-foreground">Select a report to see filters</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

function ReportsPageWrapper() {
  return (
    <Suspense fallback={<div>Loading reports...</div>}>
      <ReportsPage />
    </Suspense>
  )
}

export default ReportsPageWrapper;
