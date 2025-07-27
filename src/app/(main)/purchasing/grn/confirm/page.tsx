
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { CalendarIcon, Loader2, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import React, { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { GrnFormValues } from "@/components/grn-form";

// We reuse the same schema for validation on the confirmation page
const grnBatchSchema = z.object({
    batchNumber: z.string().min(1, "Batch number is required."),
    mfgDate: z.date().optional(),
    expDate: z.date().optional(),
    receivedQty: z.coerce.number().min(0.01, "Quantity must be greater than 0."),
});

const grnItemSchema = z.object({
  sku: z.string(),
  productName: z.string(),
  receivable: z.number(),
  unitRate: z.number(),
  productVariantId: z.string(),
  batches: z.array(grnBatchSchema).min(1, "At least one batch is required."),
});

const grnFormSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  locationId: z.string().min(1, "Location is required"),
  supplierId: z.string(),
  supplierName: z.string().optional(),
  poNumber: z.string().optional(),
  currency: z.string().default('LKR'),
  taxType: z.string().default('VAT'),
  paymentStatus: z.string().default('Unpaid'),
  poId: z.string(),
  items: z.array(grnItemSchema),
  remark: z.string().optional(),
}).refine(data => {
    return data.items.every(item => {
        const totalReceived = item.batches.reduce((sum, batch) => sum + batch.receivedQty, 0);
        return totalReceived <= item.receivable;
    });
}, {
    message: "Total received quantity for an item cannot exceed the receivable quantity.",
    path: ["items"],
});


export default function GrnConfirmationPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<GrnFormValues>({
        resolver: zodResolver(grnFormSchema),
        mode: 'onChange',
    });

    useEffect(() => {
        setIsLoading(true);
        try {
            const savedData = localStorage.getItem('grnConfirmationData');
            if (!savedData) {
                toast({ variant: 'destructive', title: 'Error', description: 'No GRN data found. Redirecting...' });
                router.replace('/purchasing/grn');
                return;
            }
            const parsedData = JSON.parse(savedData, (key, value) => {
                if (key === 'date' || key === 'mfgDate' || key === 'expDate') {
                    return value ? parseISO(value) : undefined;
                }
                return value;
            });
            form.reset(parsedData);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load GRN data.' });
            router.replace('/purchasing/grn');
        } finally {
            setIsLoading(false);
        }
    }, [router, toast, form]);
    
    const { fields } = useFieldArray({ control: form.control, name: "items" });
    const watchedItems = form.watch("items") || [];
    const subTotal = watchedItems.reduce((acc, item) => {
        const itemTotal = item.batches.reduce((batchAcc, batch) => batchAcc + (batch.receivedQty * item.unitRate), 0);
        return acc + itemTotal;
    }, 0);

    const onSubmit = async (data: GrnFormValues) => {
        setIsSubmitting(true);
        console.log("Final GRN Data:", data);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast({
            title: "GRN Created Successfully!",
            description: `The goods received for PO #${data.poNumber} have been recorded.`,
        });
        localStorage.removeItem('grnConfirmationData');
        router.push('/purchasing/grn');
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-nowrap">Confirm GRN</h1>
                        <p className="text-muted-foreground">Review and edit the details below before saving the GRN.</p>
                    </div>
                     <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button variant="outline" type="button" onClick={() => router.back()} className="w-full" disabled={isSubmitting}>
                            <Pencil className="mr-2 h-4 w-4" /> Go Back & Edit
                        </Button>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm & Save GRN
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>GRN for PO #{form.getValues().poNumber}</CardTitle>
                        <CardDescription>
                            From Supplier: {form.getValues().supplierName} | Date: {form.getValues().date ? format(form.getValues().date, 'PPP') : '...'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Batch No.</TableHead>
                                    <TableHead>MFD</TableHead>
                                    <TableHead>EXP</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Rate</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.flatMap((item, itemIndex) => 
                                    item.batches.map((batch, batchIndex) => (
                                        <TableRow key={`${item.id}-${batchIndex}`}>
                                            <TableCell className="font-medium">{item.productName}</TableCell>
                                            <TableCell>{batch.batchNumber}</TableCell>
                                            <TableCell>{batch.mfgDate ? format(batch.mfgDate, "dd/MM/yy") : 'N/A'}</TableCell>
                                            <TableCell>{batch.expDate ? format(batch.expDate, "dd/MM/yy") : 'N/A'}</TableCell>
                                            <TableCell className="text-right">{batch.receivedQty}</TableCell>
                                            <TableCell className="text-right font-mono">${item.unitRate.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-mono">${(batch.receivedQty * item.unitRate).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                             <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={6} className="text-right font-bold">Grand Total</TableCell>
                                    <TableCell className="text-right font-bold font-mono">${subTotal.toFixed(2)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </CardContent>
                </Card>
            </form>
        </Form>
    );
}
