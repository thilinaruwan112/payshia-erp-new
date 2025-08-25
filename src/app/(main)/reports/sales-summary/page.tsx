
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { type Invoice, type User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Printer } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import type { DateRange } from 'react-day-picker';
import { Skeleton } from '@/components/ui/skeleton';

export default function SalesSummaryPage() {
  const { company_id, availableLocations, currentLocation } = useLocation();
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allCustomers, setAllCustomers] = useState<User[]>([]);
  const [reportData, setReportData] = useState<Invoice[]>([]);

  useEffect(() => {
    if (currentLocation) {
        setSelectedLocationId(currentLocation.location_id);
    }
  }, [currentLocation]);

  useEffect(() => {
    async function fetchInitialData() {
        if (!company_id) return;
        setIsLoading(true);
        try {
            const [invoicesRes, customersRes] = await Promise.all([
                fetch(`https://server-erp.payshia.com/invoices/filter/hold/by-company-status?company_id=${company_id}&invoice_status=1`),
                fetch(`https://server-erp.payshia.com/customers/company/filter/?company_id=${company_id}`)
            ]);
            if (!invoicesRes.ok) throw new Error('Failed to fetch invoices');
            if (!customersRes.ok) throw new Error('Failed to fetch customers');
            setAllInvoices(await invoicesRes.json() || []);
            setAllCustomers(await customersRes.json() || []);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch initial data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchInitialData();
  }, [company_id, toast]);

  const handleRetrieveData = () => {
    let filteredInvoices = allInvoices;

    if (selectedLocationId) {
        filteredInvoices = filteredInvoices.filter(inv => inv.location_id === selectedLocationId);
    }

    if (dateRange?.from && dateRange?.to) {
        const from = dateRange.from;
        const to = dateRange.to;
        filteredInvoices = filteredInvoices.filter(inv => {
            const invDate = new Date(inv.invoice_date);
            return invDate >= from && invDate <= to;
        });
    }

    const dataWithCustomer = filteredInvoices.map(inv => ({
        ...inv,
        customerName: allCustomers.find(c => c.customer_id === inv.customer_code)?.name || 'Walk-in Customer'
    }));
    
    setReportData(dataWithCustomer);
  };
  
  const handlePrint = () => {
    const from = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
    const to = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
    const locationName = availableLocations.find(l => l.location_id === selectedLocationId)?.location_name || 'All Locations';
    const reportDataString = encodeURIComponent(JSON.stringify(reportData));
    
    window.open(`/reports/sales-summary/print?from=${from}&to=${to}&location=${encodeURIComponent(locationName)}&data=${reportDataString}`, '_blank');
  };

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
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Sales Summary Report</CardTitle>
          <CardDescription>
            Filter and view sales invoices by date range and location.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
                <p className="text-sm font-medium">Date Range</p>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                        dateRange.to ? (
                            <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(dateRange.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Pick a date</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                    />
                    </PopoverContent>
                </Popover>
            </div>
             <div className="space-y-2">
                <p className="text-sm font-medium">Location</p>
                <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {availableLocations.map(loc => (
                            <SelectItem key={loc.location_id} value={loc.location_id}>{loc.location_name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button onClick={handleRetrieveData} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Retrieve Data
            </Button>
            <Button onClick={handlePrint} variant="outline" disabled={reportData.length === 0}>
                <Printer className="mr-2 h-4 w-4" />
                Print
            </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Report</CardTitle>
            <CardDescription>Showing {reportData.length} invoices.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">Sub Total</TableHead>
                            <TableHead className="text-right">Discount</TableHead>
                            <TableHead className="text-right">Charge</TableHead>
                            <TableHead className="text-right">Return</TableHead>
                            <TableHead className="text-right">Grand Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell>{format(new Date(invoice.invoice_date), 'yyyy-MM-dd')}</TableCell>
                                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                                <TableCell>{(invoice as any).customerName}</TableCell>
                                <TableCell className="text-right font-mono">${parseFloat(invoice.inv_amount).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">${parseFloat(invoice.discount_amount).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">${parseFloat(invoice.service_charge).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">$0.00</TableCell>
                                <TableCell className="text-right font-mono">${parseFloat(invoice.grand_total).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow className="font-bold">
                            <TableCell colSpan={3} className="text-right">Totals</TableCell>
                            <TableCell className="text-right font-mono">${totals.subTotal.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono">${totals.discount.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono">${totals.charge.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono">${totals.return.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono">${totals.grandTotal.toFixed(2)}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
