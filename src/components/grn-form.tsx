

"use client";

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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import type { PurchaseOrder, Supplier, Product, ProductVariant, Location } from "@/lib/types";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";


const grnBatchSchema = z.object({
    batchNumber: z.string().min(1, "Batch number is required."),
    mfgDate: z.date().optional(),
    expDate: z.date().optional(),
    receivedQty: z.coerce.number().min(0.01, "Quantity must be greater than 0."),
});

const grnItemSchema = z.object({
  sku: z.string(),
  productId: z.string(),
  productName: z.string(),
  receivable: z.number(), // This is the balance qty
  alreadyReceived: z.number(),
  orderQty: z.number(),
  unitRate: z.number(),
  productVariantId: z.string(),
  batches: z.array(grnBatchSchema).min(1, "At least one batch is required."),
});


const grnFormSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  locationId: z.string().min(1, "Location is required"),
  supplierId: z.string(),
  currency: z.string().default('LKR'),
  taxType: z.string().default('VAT'),
  paymentStatus: z.string().default('Unpaid'),
  poId: z.string(),
  items: z.array(grnItemSchema),
  remark: z.string().optional(),
}).refine(data => {
    return data.items.every(item => {
        const totalReceivedInForm = item.batches.reduce((sum, batch) => sum + batch.receivedQty, 0);
        // Receivable here is the balance quantity
        return totalReceivedInForm <= item.receivable;
    });
}, {
    message: "Total received quantity for an item cannot exceed the balance quantity.",
    path: ["items"],
});


export type GrnFormValues = z.infer<typeof grnFormSchema>;

export function GrnForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const poId = searchParams.get('poId');

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const form = useForm<GrnFormValues>({
    resolver: zodResolver(grnFormSchema),
    defaultValues: {
        date: new Date(),
        items: [],
        remark: "",
        currency: "LKR",
    },
    mode: "onChange",
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    async function fetchInitialData() {
        if (!poId) {
            toast({ variant: 'destructive', title: 'No Purchase Order ID' });
            setIsLoading(false);
            return;
        };

        try {
            const [poResponse, suppliersResponse, productsResponse, variantsResponse, locationsResponse] = await Promise.all([
                 fetch(`https://server-erp.payshia.com/purchase-orders/${poId}`),
                 fetch('https://server-erp.payshia.com/suppliers'),
                 fetch('https://server-erp.payshia.com/products'),
                 fetch('https://server-erp.payshia.com/product-variants'),
                 fetch('https://server-erp.payshia.com/locations')
            ]);
            
            if (!poResponse.ok) throw new Error('Failed to fetch PO data');
            const poData: PurchaseOrder = await poResponse.json();
            const suppliersData: Supplier[] = await suppliersResponse.json();
            const productsData: Product[] = await productsResponse.json();
            const variantsData: ProductVariant[] = await variantsResponse.json();
            const locationsData: Location[] = await locationsResponse.json();

            const currentSupplier = suppliersData.find(s => s.supplier_id === poData.supplier_id) || null;
            
            setPurchaseOrder(poData);
            setSupplier(currentSupplier);
            setLocations(locationsData);
            
            form.setValue('poId', poData.id);
            form.setValue('supplierId', poData.supplier_id);
            form.setValue('locationId', poData.location_id);
            form.setValue('currency', poData.currency);
            form.setValue('taxType', poData.tax_type);

            if (poData.items) {
                 const newItemsPromises = poData.items.map(async (item) => {
                    const product = productsData.find(p => p.id === item.product_id);
                    const variant = variantsData.find(v => v.id === item.product_variant_id);

                    const receivedQtyResponse = await fetch(`https://server-erp.payshia.com/purchase-order-items/total-received-qty/?product_id=${item.product_id}&product_variant_id=${item.product_variant_id}&po_number=${poData.po_number}&company_id=1`);
                    let alreadyReceived = 0;
                    if(receivedQtyResponse.ok) {
                        const receivedQtyData = await receivedQtyResponse.json();
                        alreadyReceived = parseFloat(receivedQtyData.total_received_qty) || 0;
                    }
                    
                    const orderQty = parseFloat(String(item.quantity));
                    const receivable = orderQty - alreadyReceived;

                    return {
                        sku: variant?.sku || `SKU-${item.product_variant_id}`,
                        productId: item.product_id,
                        productName: product?.name || 'Unknown Product',
                        orderQty: orderQty,
                        alreadyReceived: alreadyReceived,
                        receivable: receivable,
                        unitRate: parseFloat(String(item.order_rate)),
                        productVariantId: item.product_variant_id,
                        batches: [{
                            batchNumber: '',
                            receivedQty: receivable > 0 ? receivable : 0,
                            mfgDate: undefined,
                            expDate: undefined
                        }]
                    }
                 });
                 const newItems = await Promise.all(newItemsPromises);
                 replace(newItems);
            }

        } catch (error) {
             toast({ variant: 'destructive', title: 'Failed to load PO Data' });
        } finally {
            setIsLoading(false);
        }

    }
    fetchInitialData();
  }, [poId, toast, form, replace]);


  async function onSubmit(data: GrnFormValues) {
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please check the form for errors before proceeding.',
      });
      return;
    }
    // Store data in local storage and navigate
    try {
      const fullGrnData = {
        ...data,
        supplierName: supplier?.supplier_name,
        poNumber: purchaseOrder?.po_number,
      }
      localStorage.setItem('grnConfirmationData', JSON.stringify(fullGrnData));
      router.push('/purchasing/grn/confirm');
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Could not proceed',
        description: 'Failed to prepare data for confirmation.',
      });
    }
  }

  const watchedItems = form.watch("items");
  const subTotal = watchedItems.reduce((acc, item) => {
    const itemTotal = item.batches.reduce((batchAcc, batch) => batchAcc + (batch.receivedQty * item.unitRate), 0);
    return acc + itemTotal;
  }, 0);
  
  if (isLoading) {
    return <Card><CardContent><Skeleton className="h-96 w-full" /></CardContent></Card>
  }

  if (!poId || !purchaseOrder) {
    return (
        <Card>
            <CardHeader><CardTitle>Error</CardTitle></CardHeader>
            <CardContent>
                <p>Could not load Purchase Order. Please go back to the PO list and try again.</p>
                <Button onClick={() => router.push('/purchasing/grn')} className="mt-4">Go to Receivable List</Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <Form {...form}>
       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl">Create Goods Received Note</CardTitle>
                        <CardDescription>Receive items against Purchase Order: {purchaseOrder.po_number}</CardDescription>
                    </div>
                     <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button variant="outline" type="button" onClick={() => router.back()} className="w-full">Cancel</Button>
                        <Button type="submit" className="w-full">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Proceed to Confirmation
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Date</FormLabel>
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
                 <FormField
                    control={form.control}
                    name="locationId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Location</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a location" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {locations.map(loc => (
                                    <SelectItem key={loc.location_id} value={loc.location_id}>{loc.location_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="space-y-2">
                    <FormLabel>Supplier</FormLabel>
                    <Input readOnly value={supplier?.supplier_name || ''} disabled />
                </div>
                 <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="LKR">LKR</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="taxType"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tax Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a tax type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="inclusive">Inclusive</SelectItem>
                                <SelectItem value="exclusive">Exclusive</SelectItem>
                                <SelectItem value="VAT">VAT</SelectItem>
                                <SelectItem value="GST">GST</SelectItem>
                                <SelectItem value="No Tax">No Tax</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="paymentStatus"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Payment Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Unpaid">Unpaid</SelectItem>
                                <SelectItem value="Partial">Partial</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>

        <div className="space-y-4">
          {fields.map((item, index) => (
             <BatchDetailsFieldArray key={item.id} form={form} itemIndex={index} />
          ))}
        </div>
        <div className="flex justify-end">
            <Card className="w-full max-w-md">
                <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-mono font-medium">${subTotal.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax (Calculated)</span>
                        <span className="font-mono font-medium">$0.00</span>
                    </div>
                     <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                        <span>Grand Total</span>
                        <span className="font-mono">${subTotal.toFixed(2)}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
      </form>
    </Form>
  );
}

// Helper component to manage nested batches for a single item
function BatchDetailsFieldArray({ form, itemIndex }: { form: any, itemIndex: number }) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: `items.${itemIndex}.batches`,
    });

    const item = form.watch(`items.${itemIndex}`);
    const totalReceivedInForm = item.batches.reduce((sum: number, batch: any) => sum + Number(batch.receivedQty || 0), 0);
    const hasError = totalReceivedInForm > item.receivable;

    return (
        <Card>
            <CardHeader className="bg-muted/50">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-lg">{item.productName} ({item.sku})</CardTitle>
                        <CardDescription>
                            Order Qty: {item.orderQty} | Received: {item.alreadyReceived} | Balance: {item.receivable} | Rate: ${item.unitRate.toFixed(2)}
                        </CardDescription>
                    </div>
                     {hasError && (
                        <span className="text-sm font-medium text-destructive">
                            Received quantity exceeds balance quantity!
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-4 overflow-x-auto">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Batch No.</TableHead>
                            <TableHead>MFD</TableHead>
                            <TableHead>EXP</TableHead>
                            <TableHead className="w-[150px]">Received Qty</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((batch, batchIndex) => (
                             <TableRow key={batch.id}>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${itemIndex}.batches.${batchIndex}.batchNumber`}
                                        render={({ field }) => (
                                            <FormItem><FormControl><Input placeholder="Batch ABC" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${itemIndex}.batches.${batchIndex}.mfgDate`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant={"outline"} className={cn("w-[150px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
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
                                        control={form.control}
                                        name={`items.${itemIndex}.batches.${batchIndex}.expDate`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant={"outline"} className={cn("w-[150px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
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
                                        control={form.control}
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
            </CardContent>
            <CardFooter>
                 <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ batchNumber: '', receivedQty: 0 })}
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Batch
                </Button>
            </CardFooter>
        </Card>
    );
}
