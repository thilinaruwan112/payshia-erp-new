
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Loader2, Info, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { fetcher } from '@/lib/api';
import { useLocation } from '@/components/location-provider';
import type { Invoice, StockTransfer, User, PurchaseOrder } from '@/lib/types';


type DocumentType = 'Invoice' | 'Receipt' | 'Transfer Note' | 'Purchase Order' | 'Production Note';

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

type DocumentDetails = {
    type: DocumentType;
    id: string; // This will be the internal DB ID
    number: string; // This is the user-facing number like INV-001
    date: string;
    amount?: number;
    customerOrSupplier?: string;
    customer_id?: string;
};


// Mock fetch function - in a real app, this would be an API call
const fetchDocumentDetails = async (type: DocumentType, number: string, companyId: number | null): Promise<DocumentDetails | null> => {
    console.log(`Searching for ${type} with number: ${number}`);
    if (!companyId) return null;

    if (type === 'Invoice') {
        const response = await fetcher(`https://server-erp.payshia.com/invoices/full/?invoicenumber=${number}&company_id=${companyId}`);
        if (response.ok) {
            const invoice: Invoice = await response.json();
            const customer = invoice.customer;
            return {
                type: 'Invoice',
                id: invoice.id,
                number: invoice.invoice_number,
                date: invoice.invoice_date,
                amount: parseFloat(invoice.grand_total),
                customerOrSupplier: customer ? `${customer.customer_first_name} ${customer.customer_last_name}` : 'Walk-in Customer'
            }
        }
    } else if (type === 'Transfer Note') {
        const response = await fetcher(`https://server-erp.payshia.com/stock-transfers/filter/by-company?company_id=${companyId}`);
        if (response.ok) {
            const transfers: StockTransfer[] = await response.json();
            const transfer = transfers.find(t => t.stock_transfer_number === number);
            if (transfer) {
                return {
                    type: 'Transfer Note',
                    id: transfer.id,
                    number: transfer.stock_transfer_number,
                    date: transfer.transfer_date,
                    customerOrSupplier: `From & To locations in details`
                }
            }
        }
    } else if (type === 'Receipt') {
        const response = await fetcher(`https://server-erp.payshia.com/receipts/filter?company_id=${companyId}&rec_number=${number}`);
        if (response.ok) {
            const receipts: Receipt[] = await response.json();
            const receipt = receipts[0];
            if (receipt) {
                 const customerResponse = await fetcher(`https://server-erp.payshia.com/customers/${receipt.customer_id}`);
                 let customerName = 'N/A';
                 if (customerResponse.ok) {
                     const customer: User = await customerResponse.json();
                     customerName = `${customer.customer_first_name} ${customer.customer_last_name}`
                 }
                return {
                    type: 'Receipt',
                    id: receipt.id,
                    number: receipt.rec_number,
                    date: receipt.date,
                    amount: parseFloat(receipt.amount),
                    customer_id: receipt.customer_id,
                    customerOrSupplier: customerName,
                }
            }
        }
    } else if (type === 'Purchase Order') {
        const response = await fetcher(`https://server-erp.payshia.com/purchase-orders/filter/?company_id=${companyId}`);
         if (response.ok) {
            const purchaseOrders: PurchaseOrder[] = await response.json();
            const po = purchaseOrders.find(p => p.po_number === number);
             if (po) {
                return {
                    type: 'Purchase Order',
                    id: po.id,
                    number: po.po_number,
                    date: po.created_at,
                    amount: parseFloat(po.sub_total),
                    customerOrSupplier: po.supplierName || `Supplier ID: ${po.supplier_id}`
                }
            }
        }
    }
    
    return null;
};


export default function CancellationPage() {
    const { toast } = useToast();
    const { company_id } = useLocation();
    const [docType, setDocType] = useState<DocumentType | ''>('');
    const [docNumber, setDocNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [details, setDetails] = useState<DocumentDetails | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);

    React.useEffect(() => {
        const name = localStorage.getItem('userName');
        if (name) {
            setUserName(name);
        }
    }, []);

    const handleSearch = async () => {
        if (!docType || !docNumber) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a document type and enter a number.' });
            return;
        }
        setIsLoading(true);
        setDetails(null);
        const result = await fetchDocumentDetails(docType, docNumber, company_id);
        if (result) {
            setDetails(result);
        } else {
            toast({ variant: 'destructive', title: 'Not Found', description: `Could not find a ${docType} with number: ${docNumber}` });
        }
        setIsLoading(false);
    };
    
    const handleCancel = async () => {
        if (!details) return;

        setIsLoading(true);

        try {
            if (details.type === 'Invoice') {
                const response = await fetcher(`https://server-erp.payshia.com/invoices/${details.id}/reverse`, {
                    method: 'POST',
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to cancel the invoice.');
                }
            } else if (details.type === 'Transfer Note') {
                const payload = { is_active: 0, updated_by: userName || 'admin' };
                const response = await fetcher(`https://server-erp.payshia.com/stock-transfers/${details.id}/status`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to cancel the transfer note.');
                }
            } else if (details.type === 'Receipt') {
                const response = await fetcher(`https://server-erp.payshia.com/receipts/${details.id}/deactivate`, {
                    method: 'PUT',
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to cancel the receipt.');
                }
            } else if (details.type === 'Purchase Order') {
                const payload = { is_active: 0 };
                const response = await fetcher(`https://server-erp.payshia.com/purchase-orders/${details.id}/status`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });

                const responseData = await response.json();

                if (responseData.error) {
                     if (responseData.error === "Cannot deactivate PO that has GRN records") {
                        throw new Error("This PO cannot be cancelled because it has already been received in a GRN.");
                    }
                    throw new Error(responseData.error);
                }

                if (!response.ok) {
                    throw new Error(responseData.message || 'Failed to cancel the purchase order.');
                }
            }
             else {
                 // Mock cancellation for other types
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            toast({
                title: `Cancellation Processed`,
                description: `${details?.type} #${details?.number} has been cancelled.`,
            });
            // Reset state after cancellation
            setDetails(null);
            setDocNumber('');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            toast({
                variant: 'destructive',
                title: 'Cancellation Failed',
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
            setIsConfirmOpen(false);
        }
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Cancellation</h1>
                <p className="text-muted-foreground">
                    A central place to cancel various transactions in the system. Use with caution.
                </p>
            </div>
            
            <Card className="max-w-3xl">
                <CardHeader>
                    <CardTitle>Step 1: Find Document</CardTitle>
                    <CardDescription>Select the type of document and enter its number to find it.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 space-y-2">
                             <Label htmlFor="doc-type">Document Type</Label>
                             <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
                                <SelectTrigger id="doc-type">
                                    <SelectValue placeholder="Select a type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Invoice">Invoice</SelectItem>
                                    <SelectItem value="Receipt">Receipt</SelectItem>
                                    <SelectItem value="Transfer Note">Transfer Note</SelectItem>
                                    <SelectItem value="Purchase Order">Purchase Order</SelectItem>
                                    <SelectItem value="Production Note">Production Note</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="doc-id">Document Number</Label>
                            <div className="flex gap-2">
                                <Input 
                                    id="doc-id" 
                                    placeholder="e.g., INV-00123" 
                                    value={docNumber} 
                                    onChange={(e) => setDocNumber(e.target.value)}
                                    disabled={!docType}
                                />
                                <Button onClick={handleSearch} disabled={!docType || !docNumber || isLoading}>
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

             {details && (
                <Card className="max-w-3xl animate-in fade-in">
                    <CardHeader>
                        <CardTitle>Step 2: Confirm & Cancel</CardTitle>
                        <CardDescription>Review the details below. If this is the correct document, you can proceed with cancellation.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 border rounded-md bg-muted/50 space-y-2">
                            <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Document Type</span><span className="font-semibold">{details.type}</span></div>
                             <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Document #</span><span className="font-semibold font-mono">{details.number}</span></div>
                             <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Date</span><span className="font-semibold">{details.date}</span></div>
                             {details.customerOrSupplier && <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Customer/Supplier</span><span className="font-semibold">{details.customerOrSupplier}</span></div>}
                             {details.amount != null && <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Amount</span><span className="font-semibold font-mono">${details.amount.toFixed(2)}</span></div>}
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button variant="destructive" onClick={() => setIsConfirmOpen(true)}>
                            <XCircle className="mr-2 h-4 w-4" /> Cancel Document
                        </Button>
                    </CardFooter>
                </Card>
             )}
             
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently cancel the document{' '}
                            <span className="font-bold text-foreground">{details?.number}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Go Back</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel} className="bg-destructive hover:bg-destructive/90" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Cancellation
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

    
