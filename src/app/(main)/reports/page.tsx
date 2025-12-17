
'use client'

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense, useCallback } from 'react';
import type { User, Supplier, Product, ProductVariant, PurchaseOrder, Invoice, GoodsReceivedNote, StockTransfer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ReportFilters } from '@/components/reports/report-filters';
import { ReportList } from '@/components/reports/report-list';
import { CustomerReportView } from '@/components/reports/customer-report-view';
import { SupplierReportView } from '@/components/reports/supplier-report-view';
import { ItemMasterReportView } from '@/components/reports/item-master-report-view';
import { PurchaseOrderReportView } from '@/components/reports/purchase-order-report-view';
import { SalesSummaryReportView } from '@/components/reports/sales-summary-report-view';
import { GrnReportView } from '@/components/reports/grn-report-view';
import { InvoiceReportView } from '@/components/reports/invoice-report-view';
import { ItemWiseSalesReportView } from '@/components/reports/item-wise-sales-report-view';
import { InvoiceWiseSalesReportView } from '@/components/reports/invoice-wise-sales-report-view';
import { StockBalanceReportView } from '@/components/reports/stock-balance-report-view';
import { BinCardReportView } from '@/components/reports/bin-card-report-view';
import { StockTransferReportView } from '@/components/reports/stock-transfer-report-view';
import { DayEndSalesReportView } from '@/components/reports/day-end-sales-report-view';
import { cn } from '@/lib/utils';
import { useLocation } from '@/components/location-provider';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { allReports, reportCategories } from '@/lib/report-list';
import { format } from 'date-fns';


interface ProductWithVariants {
    product: Product;
    variants: ProductVariant[];
}
type ReportData = any;

function ReportsPage() {
    const searchParams = useSearchParams();
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [reportData, setReportData] = useState<ReportData>([]);
    const [customers, setCustomers] = useState<User[]>([]);
    const { company_id, availableLocations } = useLocation();
    const { toast } = useToast();
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
    const [singleDate, setSingleDate] = React.useState<Date | undefined>(new Date());
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});


    const handleShowReport = useCallback((data: ReportData) => {
        setReportData(data);
    }, []);
    
    const handleSelectReport = useCallback((name: string) => {
        setSelectedReport(name);
        setReportData([]);
    }, []);
    
    useEffect(() => {
        // Fetch customers once for use in other reports like Sales Summary
        async function fetchInitialData() {
             if (!company_id) return;
             try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/company/filter/?company_id=${company_id}`);
                if (res.ok) setCustomers(await res.json());
             } catch (error) {
                 console.error("Failed to fetch initial customer data", error);
             }
        }
        fetchInitialData();
    }, [company_id]);

    const handlePrintReport = useCallback(() => {
        if (!company_id) return;
        let url = '';
        if (selectedReport === 'Customer Master Report') {
            url = `/reports-print/customer-report/print?company_id=${company_id}`;
        } else if (selectedReport === 'Supplier Master Report') {
            url = `/reports-print/supplier-report/print?company_id=${company_id}`;
        } else if (selectedReport === 'Item Master Report') {
             url = `/reports-print/item-master-report/print?company_id=${company_id}`;
        } else if (selectedReport === 'Purchase Order Report') {
            url = `/reports-print/purchase-order-report/print?company_id=${company_id}`;
        } else if (selectedReport === 'Sales Summary Report' || selectedReport === 'Invoice Report') {
            const reportDataString = encodeURIComponent(JSON.stringify(reportData));
            const reportPath = selectedReport === 'Invoice Report' ? 'invoice-report' : 'sales-summary';
            const params = new URLSearchParams({ company_id: String(company_id) });
             if (dateRange?.from) params.append('from_date', format(dateRange.from, 'yyyy-MM-dd'));
             if (dateRange?.to) params.append('to_date', format(dateRange.to, 'yyyy-MM-dd'));
             if (filterValues['location'] && filterValues['location'] !== 'all') {
                const loc = availableLocations.find(l => l.location_id === filterValues['location']);
                if (loc) params.append('location', loc.location_name);
             }
            url = `/reports-print/sales-summary/print?${params.toString()}`;
        } else if (selectedReport === 'GRN Report') {
             url = `/reports-print/grn-report/print?company_id=${company_id}`;
        } else if (selectedReport === 'Day End Sale Report') {
            if (!singleDate || !filterValues['location'] || filterValues['location'] === 'all') {
                toast({ title: "Missing Filters", description: "Please select a date and a specific location to print the Day End Report.", variant: "destructive" });
                return;
            }
            const params = new URLSearchParams({ 
                company_id: String(company_id),
                date: format(singleDate, 'yyyy-MM-dd'),
                location_id: filterValues['location'],
                location: availableLocations.find(l => l.location_id === filterValues['location'])?.location_name || '',
            });
            url = `/reports-print/day-end-sale/print?${params.toString()}`;
        }
        
        if (url) {
            window.open(url, '_blank');
        } else {
             toast({ title: "Coming Soon", description: "This report is not yet available for printing." });
        }
    }, [selectedReport, company_id, toast, reportData, dateRange, filterValues, availableLocations, singleDate]);

    const handleExportCSV = useCallback(() => {
        if (!reportData || (Array.isArray(reportData) && reportData.length === 0)) {
            toast({ variant: 'destructive', title: 'No data', description: 'Please view the report first to export.' });
            return;
        }

        let headers: string[] = [];
        let rows: string[][] = [];
        let filename = 'report.csv';
        const dataToExport = Array.isArray(reportData) ? reportData : reportData.items || reportData.data || [];

        if(selectedReport === 'Customer Master Report' && dataToExport.length > 0 && 'customer_first_name' in dataToExport[0]) {
            headers = ["Customer Name", "Phone Number", "Email", "Address"];
            rows = (dataToExport as User[]).map(customer => [
                `"${customer.customer_first_name} ${customer.customer_last_name}"`,
                customer.phone_number || '',
                customer.email_address || '',
                `"${customer.address_line1 || ''}, ${customer.city}"`
            ]);
            filename = 'customer_report.csv';
        } else if (selectedReport === 'Supplier Master Report' && dataToExport.length > 0 && 'supplier_name' in dataToExport[0]) {
             headers = ["Supplier Name", "Contact Person", "Phone", "Email"];
            rows = (dataToExport as Supplier[]).map(supplier => [
                `"${supplier.supplier_name}"`,
                `"${supplier.contact_person}"`,
                supplier.telephone,
                supplier.email
            ]);
            filename = 'supplier_report.csv';
        } else if (selectedReport === 'Item Master Report' && dataToExport.length > 0 && 'product' in dataToExport[0]) {
            headers = ['Product Name', 'SKU', 'Category', 'Brand', 'Stock'];
            rows = (dataToExport as ProductWithVariants[]).flatMap(p => 
                p.variants.map(v => ([
                    p.product.name,
                    v.sku,
                    p.product.category,
                    'N/A', // Placeholder for brand
                    String(v.stock || 0)
                ]))
            );
            filename = 'item_master_report.csv';
        } else if (selectedReport === 'Item Wise Sales') {
            headers = ['Product Name', 'SKU', 'Total Quantity', 'Total Sales', 'Total Cost', 'Total Discount', 'Gross Profit'];
            rows = (dataToExport).map((item: any) => [
                `"${item.product_name}"`,
                `"${item.variant_sku}"`,
                item.total_quantity,
                item.total_sales,
                item.total_cost,
                item.total_discount,
                item.gross_profit,
            ]);
            filename = 'item_wise_sales.csv';
        }


        if (headers.length === 0) {
            toast({ variant: 'destructive', title: 'Export Not Ready', description: 'CSV export is not configured for this report yet.' });
            return;
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
        if (!reportData || (Array.isArray(reportData) && reportData.length === 0)) {
            toast({ variant: 'destructive', title: 'No data', description: 'Please view the report first to export.' });
            return;
        }
        
        const doc = new jsPDF();
        doc.text(selectedReport || 'Report', 14, 16);

        let head: string[][] = [];
        let body: (string | number)[][] = [];
        let filename = 'report.pdf';
        const dataToExport = Array.isArray(reportData) ? reportData : reportData.items || reportData.data || [];

        if(selectedReport === 'Customer Master Report' && dataToExport.length > 0 && 'customer_first_name' in dataToExport[0]) {
            head = [['Customer Name', 'Phone Number', 'Email', 'Address']];
            body = (dataToExport as User[]).map(customer => [
                `${customer.customer_first_name} ${customer.customer_last_name}`,
                customer.phone_number || '',
                customer.email_address || '',
                `${customer.address_line1 || ''}, ${customer.city}`
            ]);
            filename = 'customer_report.pdf';
        } else if (selectedReport === 'Supplier Master Report' && dataToExport.length > 0 && 'supplier_name' in dataToExport[0]) {
            head = [['Supplier Name', 'Contact Person', 'Phone', 'Email']];
            body = (dataToExport as Supplier[]).map(supplier => [
                supplier.supplier_name,
                supplier.contact_person,
                supplier.telephone,
                supplier.email,
            ]);
            filename = 'supplier_report.pdf';
        } else if (selectedReport === 'Item Master Report' && dataToExport.length > 0 && 'product' in dataToExport[0]) {
            head = [['Product Name', 'SKU', 'Category', 'Brand', 'Stock']];
            body = (dataToExport as ProductWithVariants[]).flatMap(p => 
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

        if (head.length === 0) {
            toast({ variant: 'destructive', title: 'Export Not Ready', description: 'PDF export is not configured for this report yet.' });
            return;
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

    const hasData = Array.isArray(reportData) ? reportData.length > 0 : (reportData?.items?.length > 0 || reportData?.invoices?.length > 0 || reportData?.data?.length > 0 || reportData?.transactions?.length > 0 || reportData?.transfers?.length > 0 || Object.keys(reportData).length > 2);

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
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            singleDate={singleDate}
                            setSingleDate={setSingleDate}
                            filterValues={filterValues}
                            setFilterValues={setFilterValues}
                        />
                         {hasData && selectedReport === 'Customer Master Report' && (
                            <CustomerReportView customers={reportData as User[]} />
                         )}
                         {hasData && selectedReport === 'Supplier Master Report' && (
                            <SupplierReportView suppliers={reportData as Supplier[]} />
                         )}
                          {hasData && selectedReport === 'Item Master Report' && (
                            <ItemMasterReportView products={reportData as ProductWithVariants[]} />
                         )}
                         {hasData && selectedReport === 'Purchase Order Report' && (
                            <PurchaseOrderReportView purchaseOrders={reportData as PurchaseOrder[]} />
                         )}
                          {hasData && selectedReport === 'Sales Summary Report' && (
                            <SalesSummaryReportView invoices={reportData as Invoice[]} customers={customers} />
                         )}
                         {hasData && selectedReport === 'GRN Report' && (
                            <GrnReportView grns={reportData as GoodsReceivedNote[]} />
                         )}
                         {hasData && selectedReport === 'Invoice Report' && (
                            <InvoiceReportView invoices={reportData as Invoice[]} customers={customers} />
                         )}
                          {hasData && selectedReport === 'Item Wise Sales' && (
                            <ItemWiseSalesReportView reportData={reportData} />
                         )}
                         {hasData && selectedReport === 'Invoice Wise Sales Report' && (
                            <InvoiceWiseSalesReportView reportData={reportData} />
                         )}
                         {hasData && selectedReport === 'Stock Balance Report' && (
                            <StockBalanceReportView reportData={reportData} />
                         )}
                          {hasData && selectedReport === 'Bin Card Report' && (
                            <BinCardReportView reportData={reportData} />
                         )}
                         {hasData && selectedReport === 'Stock Transfer Report' && (
                            <StockTransferReportView reportData={reportData} />
                         )}
                         {hasData && selectedReport === 'Day End Sale Report' && (
                            <DayEndSalesReportView reportData={reportData} />
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
