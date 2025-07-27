
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
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
import { useRouter, useSearchParams } from "next/navigation";
import type { PurchaseOrder, Supplier, Product, ProductVariant } from "@/lib/types";
import { CalendarIcon, PlusCircle, Trash2, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";

const grnItemBatchSchema = z.object({
    batchNumber: z.string().min(1, "Batch number is required."),
    mfgDate: z.date().optional(),
    expDate: z.date().optional(),
    receivedQty: z.coerce.number().min(1, "Quantity must be at least 1."),
});

const grnItemSchema = z.object({
  sku: z.string().min(1, "Product is required."),
  productName: z.string(),
  poQuantity: z.number(),
  batches: z.array(grnItemBatchSchema).min(1, "At least one batch is required."),
});

const grnFormSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  supplierId: z.string().min(1, "Supplier is required."),
  poId: z.string().min(1, "Purchase order is required."),
  items: z.array(grnItemSchema),
}).refine(data => {
    return data.items.every(item => {
        const totalReceived = item.batches.reduce((sum, batch) => sum + batch.receivedQty, 0);
        return totalReceived <= item.poQuantity;
    });
}, {
    message: "Total received quantity cannot exceed the purchase order quantity for an item.",
    path: ["items"],
});

type GrnFormValues = z.infer<typeof grnFormSchema>;

export function GrnForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const poId = searchParams.get('poId');
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const defaultValues: Partial<GrnFormValues> = {
    date: new Date(),
    items: [],
  };

  const form = useForm<GrnFormValues>({
    resolver: zodResolver(grnFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    async function fetchPoData() {
        if (!poId) {
            toast({
                variant: 'destructive',
                title: 'No Purchase Order ID',
                description: 'A purchase order must be specified to create a GRN.'
            })
            setIsLoading(false);
            return;
        };

        try {
            const poResponse = await fetch(`https://server-erp.payshia.com/purchase-orders/${poId}`);
            if (!poResponse.ok) throw new Error('Failed to fetch PO data');
            const poData: PurchaseOrder = await poResponse.json();
            
            if (poData.supplier_id) {
                 const supplierResponse = await fetch(`https://server-erp.payshia.com/suppliers/${poData.supplier_id}`);
                 if (supplierResponse.ok) {
                    const supplierData: Supplier = await supplierResponse.json();
                    setSupplier(supplierData);
                    form.setValue('supplierId', supplierData.supplier_id);
                 }
            }
            
            setPurchaseOrder(poData);
            form.setValue('poId', poData.id);

            if (poData.items) {
                 const productsResponse = await fetch(`https://server-erp.payshia.com/products`);
                 const variantsResponse = await fetch(`https://server-erp.payshia.com/product-variants`);
                 const products: Product[] = await productsResponse.json();
                 const variants: ProductVariant[] = await variantsResponse.json();

                 const newItems = poData.items.map(item => {
                    const product = products.find(p => p.id === item.product_id);
                    const variant = variants.find(v => v.id === item.product_variant_id);
                    return {
                        sku: variant?.sku || `SKU-${item.product_variant_id}`,
                        productName: product?.name || 'Unknown Product',
                        poQuantity: item.quantity,
                        batches: [{
                            batchNumber: '',
                            receivedQty: item.quantity,
                        }]
                    }
                 });
                 replace(newItems);
            }

        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Failed to load PO Data',
                description: 'Could not fetch the purchase order details from the server.',
            })
        } finally {
            setIsLoading(false);
        }

    }
    fetchPoData();
  }, [poId, toast, form, replace]);


  function onSubmit(data: GrnFormValues) {
    console.log(data);
    toast({
      title: "GRN Created",
      description: `The GRN for PO #${purchaseOrder?.po_number} has been successfully created.`,
    });
    router.push('/purchasing/grn');
  }

  if (isLoading) {
    return <div><Skeleton className="h-96 w-full" /></div>
  }

  if (!poId || !purchaseOrder) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Could not load Purchase Order. Please go back to the PO list and try again.</p>
                <Button onClick={() => router.push('/purchasing/purchase-orders')} className="mt-4">Go to PO List</Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">New Goods Received Note</h1>
                 <p className="text-muted-foreground">Record incoming stock from a supplier against a PO.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full">Cancel</Button>
                <Button type="submit" className="w-full">Save GRN</Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>GRN Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Receiving Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="space-y-2">
                    <FormLabel>Supplier</FormLabel>
                    <Input readOnly value={supplier?.supplier_name || ''} />
                </div>
                 <div className="space-y-2">
                    <FormLabel>Purchase Order</FormLabel>
                    <Input readOnly value={purchaseOrder.po_number || ''} />
                </div>
            </CardContent>
        </Card>

        {fields.map((item, itemIndex) => (
            <Card key={item.id}>
                 <CardHeader>
                    <CardTitle className="text-lg">{item.productName} ({item.sku})</CardTitle>
                    <CardDescription>
                        Ordered Quantity: <span className="font-bold">{item.poQuantity}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BatchDetailsFieldArray itemIndex={itemIndex} control={form.control} />
                </CardContent>
            </Card>
        ))}
      </form>
    </Form>
  );
}

function BatchDetailsFieldArray({ itemIndex, control }: { itemIndex: number, control: any }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `items.${itemIndex}.batches`
    });

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Batch Number</TableHead>
                        <TableHead>MFD</TableHead>
                        <TableHead>EXP</TableHead>
                        <TableHead>Received Qty</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {fields.map((batch, batchIndex) => (
                        <TableRow key={batch.id}>
                            <TableCell>
                                 <FormField
                                    control={control}
                                    name={`items.${itemIndex}.batches.${batchIndex}.batchNumber`}
                                    render={({ field }) => (
                                        <FormItem><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )}
                                />
                            </TableCell>
                            <TableCell>
                                <FormField
                                    control={control}
                                    name={`items.${itemIndex}.batches.${batchIndex}.mfgDate`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                variant={"outline"}
                                                className={cn("w-[150px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                >
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TableCell>
                             <TableCell>
                                <FormField
                                    control={control}
                                    name={`items.${itemIndex}.batches.${batchIndex}.expDate`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                variant={"outline"}
                                                className={cn("w-[150px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                >
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TableCell>
                            <TableCell>
                                <FormField
                                    control={control}
                                    name={`items.${itemIndex}.batches.${batchIndex}.receivedQty`}
                                    render={({ field }) => (
                                        <FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}
                                />
                            </TableCell>
                            <TableCell>
                                {fields.length > 1 && (
                                    <Button variant="ghost" size="icon" onClick={() => remove(batchIndex)}>
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ batchNumber: '', receivedQty: 1 })}
                className="mt-4"
            >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Batch
            </Button>
        </div>
    )
}
