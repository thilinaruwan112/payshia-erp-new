
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ArrowLeft, Printer, FileText, PlusCircle, Trash2 } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { ProductPickerDialog } from "@/components/product-picker-dialog";
import type { Product, ProductVariant } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrency } from "@/components/currency-provider";

const technicianReportSchema = z.object({
  technicianNotes: z.string().min(10, { message: "Technician notes must be at least 10 characters." }),
  partsUsed: z.string().optional(),
});

type TechnicianReportValues = z.infer<typeof technicianReportSchema>;

type JobItem = Product & { variant: ProductVariant; variantName: string; quantity: number };

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const router = useRouter();
  const { id } = params;
  const { currencySymbol } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobItems, setJobItems] = useState<JobItem[]>([]);

  // Mock data - In a real app, you would fetch this based on params.id
  const jobDetails = {
    id: id,
    customer: 'John Doe',
    item: 'Toyota Camry (ABC-1234)',
    reportedIssues: 'Customer states there is a loud grinding noise from the front-right wheel when braking. Also requests an oil change.',
    status: 'In Progress',
    date: '2023-10-26',
    technicianReport: {
        notes: "",
        partsUsed: "",
    }
  };

  const form = useForm<TechnicianReportValues>({
    resolver: zodResolver(technicianReportSchema),
    defaultValues: {
      technicianNotes: jobDetails.technicianReport.notes,
      partsUsed: jobDetails.technicianReport.partsUsed,
    },
  });

  const handleProductsSelected = (products: (Product & { variant: ProductVariant, variantName: string })[]) => {
    const newJobItems: JobItem[] = products.map(p => ({
      ...p,
      quantity: 1, // Default quantity
    }));
    setJobItems(prevItems => {
        const existingIds = new Set(prevItems.map(item => item.variant.id));
        const filteredNewItems = newJobItems.filter(item => !existingIds.has(item.variant.id));
        return [...prevItems, ...filteredNewItems];
    });
  };

  const updateItemQuantity = (variantId: string, newQuantity: number) => {
    setJobItems(prevItems => 
      prevItems.map(item => 
        item.variant.id === variantId ? { ...item, quantity: Math.max(0, newQuantity) } : item
      )
    );
  };

  const removeItem = (variantId: string) => {
    setJobItems(prevItems => prevItems.filter(item => item.variant.id !== variantId));
  };
  
  const totalCost = jobItems.reduce((acc, item) => acc + (parseFloat(String(item.price)) * item.quantity), 0);

  async function onSubmit(data: TechnicianReportValues) {
    setIsSubmitting(true);
    console.log({ jobId: id, report: data, items: jobItems });
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: 'Technician Report Saved',
      description: `The report for job #${id} has been updated.`,
    });
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Job Details: {jobDetails.id}
          </h1>
          <p className="text-muted-foreground">
            View details, add parts, and update the technician report.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
           <Button>
            <FileText className="mr-2 h-4 w-4" />
            Generate Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Job Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-semibold">{jobDetails.status}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Date Opened</span>
                        <span className="font-semibold">{jobDetails.date}</span>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Customer</p>
                        <p className="font-semibold">{jobDetails.customer}</p>
                    </div>
                     <div>
                        <p className="text-muted-foreground">Item</p>
                        <p className="font-semibold">{jobDetails.item}</p>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Reported Issues</CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-muted-foreground">{jobDetails.reportedIssues}</p>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Parts & Services</CardTitle>
                        <CardDescription>Items used or services rendered for this job.</CardDescription>
                    </div>
                    <ProductPickerDialog onProductsSelected={handleProductsSelected}>
                       <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" />Add Item</Button>
                    </ProductPickerDialog>
                </CardHeader>
                 <CardContent>
                   {jobItems.length > 0 ? (
                       <Table>
                           <TableHeader>
                               <TableRow>
                                   <TableHead>Item</TableHead>
                                   <TableHead className="w-24">Qty</TableHead>
                                   <TableHead className="w-32 text-right">Unit Price</TableHead>
                                   <TableHead className="w-32 text-right">Total</TableHead>
                                   <TableHead className="w-12"></TableHead>
                               </TableRow>
                           </TableHeader>
                           <TableBody>
                               {jobItems.map(item => (
                                   <TableRow key={item.variant.id}>
                                       <TableCell className="font-medium">{item.variantName}</TableCell>
                                       <TableCell><Input type="number" value={item.quantity} onChange={e => updateItemQuantity(item.variant.id, parseInt(e.target.value))} className="h-8" /></TableCell>
                                       <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(String(item.price)).toFixed(2)}</TableCell>
                                       <TableCell className="text-right font-mono">{currencySymbol}{(parseFloat(String(item.price)) * item.quantity).toFixed(2)}</TableCell>
                                       <TableCell><Button variant="ghost" size="icon" onClick={() => removeItem(item.variant.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></TableCell>
                                   </TableRow>
                               ))}
                           </TableBody>
                       </Table>
                   ) : (
                       <p className="text-sm text-muted-foreground text-center py-4">No parts or services have been added to this job.</p>
                   )}
                </CardContent>
                {jobItems.length > 0 && (
                    <CardFooter className="flex justify-end">
                        <div className="text-lg font-bold">
                            Total: <span className="font-mono">{currencySymbol}{totalCost.toFixed(2)}</span>
                        </div>
                    </CardFooter>
                )}
            </Card>
           <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Technician's Report</CardTitle>
                        <CardDescription>
                            Enter the findings of the inspection and any parts used.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <FormField
                            control={form.control}
                            name="technicianNotes"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Technician Notes / Diagnosis</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="e.g. Front-right brake pads and rotor are worn and require replacement. Oil change completed..."
                                        className="resize-y min-h-[150px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Report
                        </Button>
                    </CardFooter>
                </Card>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
