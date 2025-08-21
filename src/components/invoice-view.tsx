

'use client'

import { type Invoice, type User, type Product, type ProductVariant } from '@/lib/types';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Printer, FileText, Download } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface InvoiceViewProps {
    id: string;
}

const getStatusColor = (status: Invoice['invoice_status']) => {
  switch (status) {
    case 'Draft':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case 'Sent':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'Paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Overdue':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};


export function InvoiceView({ id }: InvoiceViewProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [isVehicleDialogVisible, setVehicleDialogVisible] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [printType, setPrintType] = useState<'dispatch' | 'gatepass' | null>(null);


  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await fetch(`https://server-erp.payshia.com/invoices/full/${id}`);
        if (!response.ok) {
           if (response.status === 404) notFound();
           throw new Error('Failed to fetch invoice data');
        }
        const data: Invoice = await response.json();
        setInvoice(data);
        if (data.customer) {
          setCustomer(data.customer);
        }

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load invoice',
          description: error instanceof Error ? error.message : 'Could not fetch data from the server.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, toast]);
  
  if (isLoading) {
    return <InvoiceViewSkeleton />;
  }

  if (!invoice) {
    return <div>Invoice not found or failed to load.</div>;
  }

  const invoiceItems = invoice.items?.map(item => ({
    ...item,
    total_cost: parseFloat(String(item.item_price)) * parseFloat(String(item.quantity)),
  }));
  
  const handlePrint = (showBankDetails: boolean) => {
    const url = `/sales/invoices/${invoice.invoice_number}/print?showBankDetails=${showBankDetails}`;
    window.open(url, '_blank');
  };

  const handlePrintWithVehicle = () => {
    if (printType) {
      const url = `/sales/invoices/${invoice.invoice_number}/${printType === 'dispatch' ? 'dispatch-note' : 'gate-pass'}?vehicleNo=${encodeURIComponent(vehicleNumber)}`;
      window.open(url, '_blank');
      setVehicleDialogVisible(false);
      setVehicleNumber('');
      setPrintType(null);
    }
  }


  return (
    <>
    <div className="space-y-6 print:text-black">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Invoice: {invoice.invoice_number}
            </h1>
            <p className="text-muted-foreground">
                Created on {new Date(invoice.invoice_date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
              </Button>
               <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Print Options</AlertDialogTitle>
                            <AlertDialogDescription>
                                Do you want to include bank details for payment on the printed invoice?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                             <AlertDialogAction onClick={() => handlePrint(false)}>
                                Print without Bank Details
                            </AlertDialogAction>
                            <AlertDialogAction onClick={() => handlePrint(true)}>
                                Print with Bank Details
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
               <Button variant="outline" onClick={() => { setPrintType('dispatch'); setVehicleDialogVisible(true); }}>
                  <FileText className="mr-2 h-4 w-4" />
                  Dispatch Note
              </Button>
               <Button variant="outline" onClick={() => { setPrintType('gatepass'); setVehicleDialogVisible(true); }}>
                  <FileText className="mr-2 h-4 w-4" />
                  Gate Pass
              </Button>
          </div>
        </div>

        <Card className="print-card-styles">
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                     <CardTitle>Invoice {invoice.invoice_number}</CardTitle>
                     <CardDescription>
                         <Badge variant="secondary" className={cn('mt-2', getStatusColor(invoice.invoice_status))}>
                           {invoice.invoice_status}
                        </Badge>
                     </CardDescription>
                </div>
                <div className="text-right">
                    <p className="font-semibold text-lg">Payshia ERP</p>
                    <p className="text-sm text-muted-foreground">#455, 533A3, Pelmadulla</p>
                </div>
            </CardHeader>
             <CardContent>
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 mb-8">
                     <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Billed To</p>
                        <p className="font-semibold">{customer?.customer_first_name} {customer?.customer_last_name}</p>
                        <p className="text-sm text-muted-foreground">{customer?.address_line1}, {customer?.city_id}</p>
                     </div>
                     <div className="space-y-1 text-right">
                        <p className="text-sm font-medium text-muted-foreground">Invoice Date</p>
                        <p className="font-semibold">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                         <p className="text-sm font-medium text-muted-foreground mt-2">Due Date</p>
                        <p className="font-semibold">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                     </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Discount</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoiceItems?.map((item, index) => (
                           <TableRow key={index}>
                                <TableCell>{item.productName}</TableCell>
                                <TableCell className="text-right">{parseFloat(String(item.quantity))}</TableCell>
                                <TableCell className="text-right font-mono">${parseFloat(String(item.item_price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right font-mono text-destructive">-${parseFloat(String(item.item_discount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right font-mono">${item.total_cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                           </TableRow>
                        ))}
                    </TableBody>
                </Table>

             </CardContent>
             <CardFooter className="flex justify-end">
                <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-mono">${parseFloat(invoice.inv_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-destructive">
                        <span>Total Discount</span>
                        <span className="font-mono">-${parseFloat(invoice.discount_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Service Charge</span>
                        <span className="font-mono">${parseFloat(invoice.service_charge).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                        <span>Grand Total</span>
                        <span className="font-mono">${parseFloat(invoice.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </CardFooter>
         </Card>
    </div>
    <Dialog open={isVehicleDialogVisible} onOpenChange={setVehicleDialogVisible}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Enter Vehicle Number</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-4">
                 <Label htmlFor="vehicle-no">
                        Vehicle No.
                    </Label>
                <Input
                    id="vehicle-no"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g. ABC-1234"
                />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setVehicleDialogVisible(false)}>Cancel</Button>
                <Button type="submit" onClick={handlePrintWithVehicle}>Continue to Print</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  </>
  );
}

function InvoiceViewSkeleton() {
  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-24" />
             <Skeleton className="h-10 w-32" />
             <Skeleton className="h-10 w-32" />
             <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                 <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-6 w-24 mt-2 rounded-full" />
                 </div>
                 <div className="text-right">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48 mt-2" />
                 </div>
            </CardHeader>
             <CardContent>
                 <div className="grid grid-cols-2 gap-4 mb-8">
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-5 w-32" />
                         <Skeleton className="h-4 w-48" />
                     </div>
                     <div className="space-y-2 text-right">
                        <Skeleton className="h-4 w-16 ml-auto" />
                        <Skeleton className="h-5 w-24 ml-auto" />
                        <Skeleton className="h-4 w-16 ml-auto mt-2" />
                        <Skeleton className="h-5 w-24 ml-auto" />
                     </div>
                 </div>

                <div className="space-y-2">
                    {Array.from({length: 3}).map((_, i) => (
                        <div key={i} className="flex justify-between items-center py-2">
                            <Skeleton className="h-4 flex-1 max-w-sm" />
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    ))}
                </div>
            </CardContent>
             <CardFooter className="flex justify-end">
                 <div className="w-full max-w-sm space-y-4">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-8 w-full mt-2" />
                 </div>
            </CardFooter>
         </Card>
    </div>
  );
}
