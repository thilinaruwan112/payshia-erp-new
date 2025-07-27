
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
import { CalendarIcon, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

const grnItemSchema = z.object({
  sku: z.string(),
  productName: z.string(),
  unit: z.string(),
  stock: z.number(),
  receivable: z.number(),
  receivedQty: z.coerce.number().min(0, "Cannot be negative.").optional(),
  mfgDate: z.date().optional(),
  expDate: z.date().optional(),
  unitRate: z.number(),
  amount: z.number(),
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
        const received = item.receivedQty || 0;
        return received <= item.receivable;
    });
}, {
    message: "Received quantity cannot exceed the receivable quantity for an item.",
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
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<GrnFormValues>({
    resolver: zodResolver(grnFormSchema),
    defaultValues: {
        date: new Date(),
        items: [],
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
                 const newItems = poData.items.map(item => {
                    const product = productsData.find(p => p.id === item.product_id);
                    const variant = variantsData.find(v => v.id === item.product_variant_id);
                    const receivableQty = parseFloat(String(item.quantity)); // Ensure this is a number
                    const unitRate = parseFloat(String(item.order_rate)); // Ensure this is a number
                    return {
                        sku: variant?.sku || `SKU-${item.product_variant_id}`,
                        productName: product?.name || 'Unknown Product',
                        unit: product?.stock_unit || 'Nos',
                        stock: 0, // In a real app, this would be fetched
                        receivable: receivableQty,
                        receivedQty: receivableQty, // Default to receivable
                        unitRate: unitRate,
                        amount: receivableQty * unitRate,
                    }
                 });
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


  function onSubmit(data: GrnFormValues) {
    console.log(data);
    toast({
      title: "GRN Created",
      description: `The GRN for PO #${purchaseOrder?.po_number} has been successfully created.`,
    });
    router.push('/purchasing/grn');
  }

  const watchedItems = form.watch("items");

  const subTotal = watchedItems.reduce((acc, item) => {
    const receivedQty = item.receivedQty || 0;
    return acc + (receivedQty * item.unitRate);
  }, 0);
  const taxAmount = subTotal * 0.15; // Assuming 15% tax
  const grandTotal = subTotal + taxAmount;


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
                            Process
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
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[25%]">Item/Service</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Receivable</TableHead>
                            <TableHead>Received Qty</TableHead>
                            <TableHead>Mf. Date</TableHead>
                            <TableHead>Exp. Date</TableHead>
                            <TableHead>Unit Rate</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {fields.map((item, index) => {
                            const unitRate = item.unitRate || 0;
                            const receivedQty = watchedItems[index]?.receivedQty || 0;
                            const amount = unitRate * receivedQty;
                            
                             return (
                                <TableRow key={item.id}>
                                    <TableCell>{item.productName}</TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                    <TableCell>{item.stock}</TableCell>
                                    <TableCell>{item.receivable.toFixed(3)}</TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.receivedQty`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="number" {...field} className="min-w-[100px]" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                     <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.mfgDate`}
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
                                            name={`items.${index}.expDate`}
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
                                    <TableCell className="text-right">${item.unitRate.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">${amount.toFixed(2)}</TableCell>
                                </TableRow>
                             )
                         })}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={8} className="text-right">Sub Total</TableCell>
                            <TableCell className="text-right">${subTotal.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={8} className="text-right">Tax (15%)</TableCell>
                            <TableCell className="text-right">${taxAmount.toFixed(2)}</TableCell>
                        </TableRow>
                         <TableRow>
                            <TableCell colSpan={8} className="text-right font-bold">Grand Total</TableCell>
                            <TableCell className="text-right font-bold">${grandTotal.toFixed(2)}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </CardContent>
            <CardFooter>
                 <div className="space-y-2">
                    <Label>Remark</Label>
                    <Textarea placeholder="Add Comment here" {...form.register('remark')} />
                </div>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
