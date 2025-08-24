
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
import type { Product, PurchaseOrderItem, Supplier, ProductVariant } from "@/lib/types";
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
import { Combobox } from "./ui/combobox";

const purchaseOrderItemSchema = z.object({
  product_id: z.string().min(1, "Product is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  order_rate: z.coerce.number().min(0, "Cost must be a positive number."),
  order_unit: z.string().optional(),
  product_variant_id: z.string().min(1, "Variant is required."),
  is_active: z.literal(1).default(1),
});

const purchaseOrderFormSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required."),
  delivery_date: z.date({ required_error: "Expected delivery date is required." }),
  po_status: z.enum(["pending", "approved", "rejected"]),
  items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required."),
  remarks: z.string().optional(),
  tax_type: z.string().min(1, "Tax type is required."),
  is_active: z.boolean().default(true),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;

interface PurchaseOrderFormProps {
    suppliers: Supplier[];
}

interface ProductWithVariants {
    product: Product;
    variants: ProductVariant[];
}

export function PurchaseOrderForm({ suppliers }: PurchaseOrderFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { currentLocation, company_id } = useLocation();
  const [availableProducts, setAvailableProducts] = useState<ProductWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  const defaultValues: Partial<PurchaseOrderFormValues> = {
    delivery_date: addDays(new Date(), 14),
    po_status: 'pending',
    items: [
        { product_id: '', product_variant_id: '', quantity: 1, order_rate: 0 },
    ],
    remarks: '',
    tax_type: 'VAT',
    is_active: true,
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
      if (!supplierId || !company_id) {
        setAvailableProducts([]);
        return;
      }
      setIsLoadingProducts(true);
      replace([]); // Clear items when supplier changes
      try {
        const response = await fetch(`https://server-erp.payshia.com/products/filter?supplier_id=${supplierId}&company_id=${company_id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch products for this supplier');
        }
        const data = await response.json();
        setAvailableProducts(data.products || []);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
          variant: 'destructive',
          title: 'Error fetching products',
          description: errorMessage,
        });
        setAvailableProducts([]);
      } finally {
        setIsLoadingProducts(false);
        append({ product_id: '', product_variant_id: '', quantity: 1, order_rate: 0 });
      }
    }
    fetchProductsBySupplier(supplierId);
  }, [supplierId, company_id, toast, replace, append]);
  

  const subTotal = watchedItems.reduce((total, item) => {
    const quantity = Number(item.quantity) || 0;
    const cost = Number(item.order_rate) || 0;
    return total + (quantity * cost);
  }, 0);
  
  const taxAmount = subTotal * 0.15;
  const totalAmount = subTotal + taxAmount;

  async function onSubmit(data: PurchaseOrderFormValues) {
    if (!currentLocation || !company_id) {
        toast({
            variant: "destructive",
            title: "No Location or Company Selected",
            description: "Please select a business location before creating a PO.",
        });
        return;
    }
    setIsLoading(true);

    const poPayload = {
      location_id: parseInt(currentLocation.location_id, 10),
      company_id: company_id, 
      supplier_id: parseInt(data.supplierId, 10),
      total_amount: totalAmount,
      currency: "LKR", 
      tax_type: data.tax_type,
      sub_total: subTotal,
      created_by: "admin", 
      po_status: data.po_status,
      remarks: data.remarks,
      delivery_date: format(data.delivery_date, 'yyyy-MM-dd'),
      is_active: data.is_active ? 1 : 0,
      items: data.items.map(item => {
        const productData = availableProducts.find(p => p.product.id === item.product_id);
        const variant = productData?.variants.find(v => v.id === item.product_variant_id);
        
        if (!variant) {
          throw new Error(`Variant details missing for product ID ${item.product_id}. Cannot create PO.`);
        }

        return {
            product_id: parseInt(item.product_id, 10),
            product_variant_id: parseInt(item.product_variant_id, 10),
            quantity: item.quantity,
            order_unit: productData?.product.stock_unit || 'Nos',
            order_rate: item.order_rate,
            is_active: 1
        }
      }),
    };

    try {
        const response = await fetch('https://server-erp.payshia.com/purchase-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(poPayload),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || result.message || 'Failed to create purchase order.');
        }
        
        toast({
            title: "Purchase Order Created",
            description: `PO #${result.po_number} has been created successfully.`,
        });
        
        // Open print view in new tab
        window.open(`/purchasing/purchase-orders/${result.id}/print`, '_blank');

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
  
  const supplierOptions = suppliers.map(s => ({ value: s.supplier_id, label: s.supplier_name }));
  const productOptions = availableProducts.map(p => ({ value: p.product.id, label: p.product.name }));

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
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col justify-end">
                            <FormLabel>Supplier</FormLabel>
                             <Combobox
                                options={supplierOptions}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select a supplier..."
                                notFoundText="No supplier found."
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="delivery_date"
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
                    name="tax_type"
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
                    name="po_status"
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
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="is_active"
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
                            <TableHead className="w-[30%]">Product</TableHead>
                             <TableHead className="w-[20%]">Variant</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Cost</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {isLoadingProducts ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    <Loader2 className="h-6 w-6 animate-spin inline-block mr-2" />
                                    Loading products...
                                </TableCell>
                            </TableRow>
                         ) : (
                            fields.map((field, index) => {
                                const cost = watchedItems[index]?.order_rate || 0;
                                const quantity = watchedItems[index]?.quantity || 0;
                                const total = cost * quantity;
                                const selectedProductId = watchedItems[index]?.product_id;
                                const productVariants = availableProducts.find(p => p.product.id === selectedProductId)?.variants || [];
                                const variantOptions = productVariants.map(v => ({ value: v.id, label: [v.sku, v.color, v.size].filter(Boolean).join(' - ') }));

                                return (
                                    <TableRow key={field.id}>
                                        <TableCell>
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.product_id`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Combobox
                                                            options={productOptions}
                                                            value={field.value}
                                                            onChange={(value) => {
                                                                field.onChange(value);
                                                                const selected = availableProducts.find(p => p.product.id === value);
                                                                form.setValue(`items.${index}.order_rate`, parseFloat(selected?.product.cost_price as string) || 0);
                                                                form.setValue(`items.${index}.product_variant_id`, ''); // Reset variant
                                                            }}
                                                            placeholder="Select a product..."
                                                            notFoundText="No product found."
                                                            disabled={!supplierId || availableProducts.length === 0}
                                                        />
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.product_variant_id`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Combobox
                                                            options={variantOptions}
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            placeholder="Select a variant..."
                                                            notFoundText="No variant found."
                                                            disabled={!selectedProductId}
                                                        />
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
                                                name={`items.${index}.order_rate`}
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
                <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', product_variant_id: '', quantity: 1, order_rate: 0 })} className="mt-4" disabled={!supplierId}>
                    Add another item
                </Button>
            </CardContent>
            <CardFooter className="flex flex-col items-end gap-4">
                 <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-mono">Rs{subTotal.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Tax (15%)</span>
                        <span className="font-mono">Rs{taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total</span>
                        <span className="font-mono">Rs{totalAmount.toFixed(2)}</span>
                    </div>
                </div>
                <div className="w-full">
                    <FormField
                        control={form.control}
                        name="remarks"
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
