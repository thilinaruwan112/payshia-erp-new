
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

type DocumentType = 'Invoice' | 'Receipt' | 'Transfer Note' | 'Purchase Order' | 'Production Note';
type DocumentDetails = {
    type: DocumentType;
    id: string;
    date: string;
    amount?: number;
    customerOrSupplier?: string;
};

// Mock fetch function - in a real app, this would be an API call
const fetchDocumentDetails = async (type: DocumentType, id: string): Promise<DocumentDetails | null> => {
    console.log(`Searching for ${type} with ID: ${id}`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    // This is mock data. A real implementation would hit different endpoints based on type.
    if (id.toLowerCase().includes('inv')) {
        return { type: 'Invoice', id, date: '2023-10-01', amount: 150.99, customerOrSupplier: 'John Doe' };
    }
    if (id.toLowerCase().includes('po')) {
        return { type: 'Purchase Order', id, date: '2023-09-28', amount: 2500.00, customerOrSupplier: 'Global Supplies Inc.' };
    }
    return null;
};


export default function CancellationPage() {
    const { toast } = useToast();
    const [docType, setDocType] = useState<DocumentType | ''>('');
    const [docId, setDocId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [details, setDetails] = useState<DocumentDetails | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleSearch = async () => {
        if (!docType || !docId) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a document type and enter an ID.' });
            return;
        }
        setIsLoading(true);
        setDetails(null);
        const result = await fetchDocumentDetails(docType, docId);
        if (result) {
            setDetails(result);
        } else {
            toast({ variant: 'destructive', title: 'Not Found', description: `Could not find a ${docType} with ID: ${docId}` });
        }
        setIsLoading(false);
    };
    
    const handleCancel = () => {
        // In a real app, you'd make an API call to a specific cancellation endpoint
        console.log(`Cancelling document:`, details);
        toast({
            title: `Cancellation Processed`,
            description: `${details?.type} #${details?.id} has been cancelled (simulated).`,
        });
        // Reset state after cancellation
        setDetails(null);
        setDocId('');
        setIsConfirmOpen(false);
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
                                    value={docId} 
                                    onChange={(e) => setDocId(e.target.value)}
                                    disabled={!docType}
                                />
                                <Button onClick={handleSearch} disabled={!docType || !docId || isLoading}>
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
                             <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Document ID</span><span className="font-semibold font-mono">{details.id}</span></div>
                             <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Date</span><span className="font-semibold">{details.date}</span></div>
                             {details.customerOrSupplier && <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Customer/Supplier</span><span className="font-semibold">{details.customerOrSupplier}</span></div>}
                             {details.amount && <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Amount</span><span className="font-semibold font-mono">${details.amount.toFixed(2)}</span></div>}
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
                            <span className="font-bold text-foreground">{details?.id}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Go Back</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel} className="bg-destructive hover:bg-destructive/90">
                            Confirm Cancellation
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
