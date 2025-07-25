
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
import { useRouter } from "next/navigation";
import type { Product, PurchaseOrderItem, Supplier } from "@/lib/types";
import { CalendarIcon, Trash2, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";
import React, { useEffect, useState } from "react";
import { Textarea } from "./ui/textarea";
import { useLocation } from "./location-provider";
import { Switch } from "./ui/switch";

const purchaseOrderItemSchema = z.object({
      product_id: z.string().min(1, "Product is required."),
      quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
      unit_cost: z.coerce.number().min(0, "Cost must be a positive number."),
      // These are not in the form but part of the type, so we make them optional
      purchase_order_id: z.string().optional(),
      total_cost: z.coerce.number().optional(),
});

const purchaseOrderFormSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required."),
  date: z.date({ required_error: "PO date is required." }),
  expectedDelivery: z.date({ required_error: "Expected delivery date is required." }),
  status: z.enum(["Draft", "Sent", "Cancelled"]),
  items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required."),
  notes: z.string().optional(),
  taxType: z.string().min(1, "Tax type is required."),
  isActive: z.boolean().default(true),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;

interface PurchaseOrderFormProps {
    suppliers: Supplier[];
}

export function PurchaseOrderForm({ suppliers }: PurchaseOrderFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { currentLocation } = useLocation();
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  const defaultValues: Partial<PurchaseOrderFormValues> = {
    date: new Date(),
    expectedDelivery: addDays(new Date(), 14),
    status: 'Draft',
    items: [
        { product_id: '', quantity: 1, unit_cost: 0 },
    ],
    notes: '',
    taxType: 'VAT',
    isActive: true,
  };

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const watchedItems = form.watch("items");
  const supplierId = form.watch("supplierId");

  useEffect(() => {
    async function fetchProductsBySupplier(supplierId: string) {
        setIsLoadingProducts(true);
        setAvailableProducts([]);
        replace([{ product_id: '', quantity: 1, unit_cost: 0 }]);
        try {
            const response = await fetch(`https://server-erp.payshia.com/products/filter/by-supplier?supplier_id=${supplierId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch products for supplier');
            }
            const data = await response.json();
            setAvailableProducts(data);
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            toast({
                variant: 'destructive',
                title: 'Error',
                description: `Could not fetch products for the selected supplier: ${errorMessage}`,
            });
        } finally {
            setIsLoadingProducts(false);
        }
    }

    if (supplierId) {
        fetchProductsBySupplier(supplierId);
    }
  }, [supplierId, replace, toast]);


  const total = watchedItems.reduce((total, item) => {
    const quantity = Number(item.quantity) || 0;
    const cost = Number(item.unit_cost) || 0;
    return total + (quantity * cost);
  }, 0);

  async function onSubmit(data: PurchaseOrderFormValues) {
    if (!currentLocation) {
        toast({
            variant: "destructive",
            title: "No Location Selected",
            description: "Please select a business location before creating a PO.",
        });
        return;
    }
    setIsLoading(true);

    const poStatusMap = {
        Draft: 0,
        Sent: 1,
        Cancelled: 2
    };

    const poPayload = {
      location_id: parseInt(currentLocation.location_id, 10),
      supplier_id: parseInt(data.supplierId, 10),
      currency: "LKR",
      tax_type: data.taxType,
      sub_total: total,
      created_by: "admin",
      created_at: format(data.date, 'yyyy-MM-dd HH:mm:ss'),
      is_active: data.isActive ? 1 : 0,
      po_status: poStatusMap[data.status],
      remarks: data.notes || '',
      company_id: 1,
    };

    try {
        const poResponse = await fetch('https://server-erp.payshia.com/purchase-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(poPayload),
        });

        const poResult = await poResponse.json();

        if (!poResponse.ok) {
            throw new Error(poResult.message || 'Failed to create purchase order shell.');
        }

        const purchaseOrderId = poResult.id;

        for (const item of data.items) {
            const itemPayload = {
                purchase_order_id: purchaseOrderId,
                product_id: parseInt(item.product_id, 10),
                quantity: item.quantity,
                unit_cost: item.unit_cost,
                total_cost: item.quantity * item.unit_cost
            };
            
            const itemResponse = await fetch('https://server-erp.payshia.com/purchase-order-items', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(itemPayload),
            });

             if (!itemResponse.ok) {
                const itemError = await itemResponse.json();
                const productName = availableProducts.find(p => p.id === item.product_id)?.name || `product ID ${item.product_id}`;
                throw new Error(`Failed to add item "${productName}" to PO. Reason: ${itemError.message || 'Unknown error'}`);
            }
        }
        
        toast({
            title: "Purchase Order Created",
            description: `PO #${poResult.po_number} has been created successfully.`,
        });
        router.push('/purchasing/purchase-orders');
        router.refresh();

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: "destructive",
            title: "Failed to create Purchase Order",
            description: errorMessage,
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">New Purchase Order</h1>
                 <p className="text-muted-foreground">Create a new PO to send to a supplier.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full" disabled={isLoading}>Cancel</Button>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Purchase Order
                </Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>PO Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col justify-end">
                            <FormLabel>Supplier</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a supplier" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {suppliers.map(s => (
                                        <SelectItem key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col justify-end">
                        <FormLabel>PO Date</FormLabel>
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
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="expectedDelivery"
                    render={({ field }) => (
                        <FormItem className="flex flex-col justify-end">
                        <FormLabel>Expected Delivery</FormLabel>
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
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="taxType"
                    render={({ field }) => (
                        <FormItem className="flex flex-col justify-end">
                            <FormLabel>Tax Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a tax type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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
                    name="status"
                    render={({ field }) => (
                        <FormItem className="flex flex-col justify-end">
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Sent">Sent</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-col justify-end">
                            <FormLabel>Active</FormLabel>
                             <div className="h-10 flex items-center">
                                <FormControl>
                                    <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </div>
                        </FormItem>
                    )}
                    />
            </CardContent>
        </Card>


        <Card>
            <CardHeader>
                <CardTitle>PO Items</CardTitle>
                <CardDescription>Add the products you want to order from the supplier.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">Product</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Cost</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {isLoadingProducts ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    <Loader2 className="h-6 w-6 animate-spin inline-block mr-2" />
                                    Loading products...
                                </TableCell>
                            </TableRow>
                         ) : (
                            fields.map((field, index) => {
                                const selectedProduct = availableProducts.find(p => p.id === watchedItems[index]?.product_id);
                                const cost = watchedItems[index]?.unit_cost || 0;
                                const quantity = watchedItems[index]?.quantity || 0;
                                const total = cost * quantity;

                                return (
                                    <TableRow key={field.id}>
                                        <TableCell>
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.product_id`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Select
                                                            onValueChange={(value) => {
                                                                field.onChange(value);
                                                                const selected = availableProducts.find(p => p.id === value);
                                                                form.setValue(`items.${index}.unit_cost`, parseFloat(selected?.cost_price as string) || 0);
                                                            }}
                                                            defaultValue={field.value}
                                                            disabled={!supplierId || availableProducts.length === 0}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select a product" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {availableProducts.map(product => (
                                                                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.quantity`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input type="number" placeholder="1" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.unit_cost`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input type="number" {...field} startIcon="Rs" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right font-mono">Rs{total.toFixed(2)}</TableCell>
                                        <TableCell>
                                            {fields.length > 1 && (
                                                <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                         )}
                    </TableBody>
                </Table>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', quantity: 1, unit_cost: 0 })} className="mt-4" disabled={!supplierId}>
                    Add another item
                </Button>
            </CardContent>
            <CardFooter className="flex flex-col items-end gap-4">
                 <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total</span>
                        <span className="font-mono">Rs{total.toFixed(2)}</span>
                    </div>
                </div>
                <div className="w-full">
                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Add any additional notes, terms, or instructions for the supplier."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
