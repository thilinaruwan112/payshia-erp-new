
'use client'

import { type Invoice, type User, type PaymentReceipt } from '@/lib/types';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

type Receipt = {
    id: string;
    rec_number: string;
    type: string;
    is_active: string;
    date: string;
    amount: string;
    created_by: string;
    ref_id: string; // Invoice number
    location_id: string;
    customer_id: string;
    today_invoice: string;
    company_id: string;
    now_time: string;
};

interface ReceiptViewProps {
    id: string;
}


export function ReceiptView({ id }: ReceiptViewProps) {
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        if (!id) return;
        setIsLoading(true);
        try {
            const receiptResponse = await fetch(`https://server-erp.payshia.com/receipts/${id}`);
            if (!receiptResponse.ok) {
                if (receiptResponse.status === 404) notFound();
                throw new Error('Failed to fetch receipt data');
            }
            const receiptData: Receipt = await receiptResponse.json();
            setReceipt(receiptData);

            const [customerResponse, invoiceResponse] = await Promise.all([
                 fetch(`https://server-erp.payshia.com/customers/${receiptData.customer_id}`),
                 fetch(`https://server-erp.payshia.com/invoices/full/${receiptData.ref_id}`)
            ]);
            
             if (customerResponse.ok) {
                setCustomer(await customerResponse.json());
             }
             if (invoiceResponse.ok) {
                setInvoice(await invoiceResponse.json());
             }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to load receipt data',
                description: error instanceof Error ? error.message : 'Could not fetch data from the server.',
            });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [id, toast]);
  
  const getPaymentMethodText = (type: string) => {
    switch (type) {
        case '0': return 'Cash';
        case '1': return 'Card';
        case '2': return 'Bank Transfer';
        default: return type;
    }
  }

  if (isLoading) {
    return <ReceiptViewSkeleton />;
  }

  if (!receipt) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>Could not load receipt data. It may have been deleted.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                </Button>
            </CardContent>
        </Card>
    )
  }

  const amountPaid = parseFloat(receipt.amount);
  const invoiceTotal = invoice ? parseFloat(invoice.grand_total) : 0;
  const balanceDue = invoice ? (invoiceTotal - amountPaid) : 0;

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Receipt: {receipt.rec_number}
            </h1>
            <p className="text-muted-foreground">
                Recorded on {new Date(receipt.date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
              </Button>
              <Button onClick={() => window.open(`/sales/receipts/${receipt.id}/print`, '_blank')}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print A4
              </Button>
               <Button variant="outline" onClick={() => window.open(`/pos/receipt/${receipt.id}/print`, '_blank')}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print POS
              </Button>
          </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-y-4">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Customer</p>
                    <p className="font-semibold">{customer?.customer_first_name} {customer?.customer_last_name || ''}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Reference Invoice</p>
                    <Link href={`/sales/invoices/${receipt.ref_id}`} className="font-semibold text-primary hover:underline">{receipt.ref_id}</Link>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                    <p className="font-semibold">{getPaymentMethodText(receipt.type)}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Amount Paid</p>
                    <p className="font-semibold font-mono text-lg">${amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
            </CardContent>
            {invoice && (
                <CardFooter className="bg-muted/50 p-6">
                    <div className="w-full max-w-sm space-y-2">
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Invoice Total</span>
                            <span className="font-mono">${invoiceTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment Applied</span>
                            <span className="font-mono text-green-600">-${amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                            <span>Balance Due</span>
                            <span className="font-mono">${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </CardFooter>
            )}
        </Card>
    </div>
  )
}


function ReceiptViewSkeleton() {
  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <Card>
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
             <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1"><Skeleton className="h-4 w-16" /><Skeleton className="h-5 w-32" /></div>
                <div className="space-y-1"><Skeleton className="h-4 w-16" /><Skeleton className="h-5 w-24" /></div>
                <div className="space-y-1"><Skeleton className="h-4 w-16" /><Skeleton className="h-5 w-20" /></div>
                <div className="space-y-1"><Skeleton className="h-4 w-16" /><Skeleton className="h-6 w-28" /></div>
             </CardContent>
        </Card>
    </div>
  );
}

