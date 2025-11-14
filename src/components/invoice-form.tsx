
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
import type { Product, User, Order, ProductVariant } from "@/lib/types";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";
import React, { useEffect, useState, useMemo } from "react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useLocation } from "./location-provider";
import { Combobox } from "./ui/combobox";
import { fetcher } from "@/lib/api";

type StockInfo = {
    product_id: string;
    expire_date: string;
    total_in: string;
    total_out: string;
    stock_balance: string;
    patch_code: string;
    product_variant_id: string;
    manufacture_date?: string; // Adding this for payload consistency
}

interface ProductWithApiResponse {
  product: Product;
  variants: { variant: ProductVariant }[];
}

const invoiceItemSchema = z.object({
    sku: z.string().min(1, "Product is required."),
    productId: z.string().min(1),
    productVariantId: z.string().min(1),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
    unitPrice: z.coerce.number().min(0, "Unit price must be a positive number."),
    costPrice: z.coerce.number().min(0),
    discount: z.coerce.number().min(0, "Discount must be positive.").optional(),
    selectedBatch: z.string(), // Now optional based on refine
    recipeType: z.string().optional(),
});

const invoiceFormSchema = z.object({
  invoiceType: z.enum(["Retail", "Wholesale"]),
  customerId: z.string().min(1, "Customer is required."),
  orderId: z.string().optional(),
  invoiceDate: z.date({ required_error: "Invoice date is required." }),
  dueDate: z.date({ required_error: "Due date is required." }),
  status: z.enum(["1", "2", "3", "4"]), // 1=Active/Paid, 2=Pending/Hold, 3=Cancelled, 4=Draft
  items: z.array(invoiceItemSchema).min(1, "At least one item is required."),
  discount: z.coerce.number().min(0).optional(),
  serviceCharge: z.coerce.number().min(0).optional(),
  tdl: z.coerce.number().min(0).optional(),
  sscl: z.coerce.number().min(0).optional(),
  vat: z.coerce.number().min(0).optional(),
  remark: z.string().optional(),
}).refine(data => {
    return data.items.every(item => {
        if (item.recipeType === 'ala cart') {
            return true; // No batch selection required
        }
        return item.selectedBatch && item.selectedBatch.length > 0;
    });
}, {
    message: "A batch must be selected for non-'A La Carte' items.",
    path: ["items"], // You can refine the path to point to a specific item if needed
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
    customers: User[];
    orders: Order[];
}

export function InvoiceForm({ customers, orders }: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { currentLocation, company_id } = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);
  const [productsWithVariants, setProductsWithVariants] = React.useState<ProductWithApiResponse[]>([]);
  const [availableBatches, setAvailableBatches] = React.useState<Record<number, StockInfo[]>>({});

  React.useEffect(() => {
    async function fetchProducts() {
        if (!company_id) return;
        setIsLoading(true);
         try {
            const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${company_id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            const data = await response.json();
            setProductsWithVariants(data.products || []);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error fetching products',
                description: 'Could not load product data for the form.',
            });
        } finally {
            setIsLoading(false);
        }
    }
    fetchProducts();
  }, [company_id, toast]);


  const allSkus = productsWithVariants.flatMap(p => 
    (p.variants || []).map(v => ({
      key: `${p.product.id}-${v.variant.id}`, // Unique key
      label: `${p.product.name} (${v.variant.sku})`,
      value: v.variant.id, // Use variant ID as value
      productId: p.product.id,
      sellingPrice: parseFloat(String(p.product.price)),
      wholesalePrice: p.product.wholesale_price ? parseFloat(String(p.product.wholesale_price)) : parseFloat(String(p.product.price)),
      costPrice: p.product.cost_price ? parseFloat(String(p.product.cost_price)) : 0,
      skuString: v.variant.sku,
      recipeType: p.product.recipe_type
  })));
  
  const defaultValues: Partial<InvoiceFormValues> = {
    invoiceType: "Retail",
    invoiceDate: new Date(),
    dueDate: addDays(new Date(), 30),
    status: '1', // Default to Active/Paid
    items: [],
    discount: 0,
    serviceCharge: 0,
    tdl: 0,
    sscl: 0,
    vat: 0,
  };

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const watchedItems = form.watch("items");
  const customerId = form.watch("customerId");
  const billDiscount = form.watch("discount") || 0;
  const invoiceType = form.watch("invoiceType");

  const availableOrders = React.useMemo(() => {
    if (!customerId) return [];
    const customer = customers.find(c => c.customer_id === customerId);
    if (!customer) return [];
    return orders.filter(o => o.customerName === `${customer.customer_first_name} ${customer.customer_last_name}` && o.status !== 'Cancelled');
  }, [customerId, customers, orders]);
  
  const handleOrderChange = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        const newItems = order.items.map(item => {
            const product = allSkus.find(s => s.skuString === item.sku);
            const price = invoiceType === 'Wholesale' ? product?.wholesalePrice : product?.sellingPrice;
            return {
                sku: product?.skuString || '',
                productId: product?.productId || '',
                productVariantId: product?.value || '',
                quantity: item.quantity,
                unitPrice: Number(price) || 0,
                costPrice: Number(product?.costPrice) || 0,
                discount: 0,
                selectedBatch: '',
                recipeType: product?.recipeType,
            }
        });
        form.setValue('orderId', order.id);
        replace(newItems);
    }
  }

  const handleProductSelect = async (productId: string, variantId: string, index: number) => {
    if (!productId || !variantId || !company_id || !currentLocation) return;
    const skuDetails = allSkus.find(s => s.value === variantId);
    if (skuDetails?.recipeType === 'ala cart') {
        setAvailableBatches(prev => ({...prev, [index]: [] }));
        form.setValue(`items.${index}.selectedBatch`, ''); // Clear batch selection
        return;
    }

    try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stock-entries/summary?company_id=${company_id}&product_id=${productId}&product_variant_id=${variantId}&location_id=${currentLocation.location_id}`);
        if (!response.ok) {
            throw new Error("Failed to fetch stock");
        }
        const data = await response.json();
        const batches = data.grouped_by_expire_date.filter((b: StockInfo) => parseFloat(b.stock_balance) > 0);
        setAvailableBatches(prev => ({ ...prev, [index]: batches }));
        form.setValue(`items.${index}.selectedBatch`, ''); // Reset batch on product change
    } catch (error) {
        console.error(error);
        setAvailableBatches(prev => ({...prev, [index]: []}));
        toast({variant: 'destructive', title: 'Error', description: 'Could not fetch stock for this product.'});
    }
  }

 const { subtotal, itemDiscounts, calculatedServiceCharge, calculatedTdl, calculatedSscl, calculatedVat } = React.useMemo(() => {
    let sub = 0;
    let itemDisc = 0;

    for (const item of watchedItems) {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        sub += quantity * unitPrice;
        itemDisc += Number(item.discount) || 0;
    }

    const baseForTaxes = sub - itemDisc;
    
    let serviceCharge = 0;
    if (currentLocation?.service_charge_status === 'Enabled' && invoiceType !== "Wholesale") {
      serviceCharge = baseForTaxes * 0.10;
    }

    let tdl = 0;
    if (currentLocation?.tdl_status === 'Enabled') {
      tdl = (baseForTaxes + serviceCharge) * 0.01;
    }
    
    const baseForSscl = baseForTaxes + serviceCharge;
    let sscl = 0;
    if (currentLocation?.sscl_status === 'Enabled') {
       sscl = baseForSscl * 0.025;
    }
    
    const baseForVat = baseForTaxes + serviceCharge + tdl + sscl;
    let vat = 0;
    if (currentLocation?.vat_status === 'Enabled') {
       vat = baseForVat * 0.18;
    }

    return { subtotal: sub, itemDiscounts: itemDisc, calculatedServiceCharge: serviceCharge, calculatedTdl: tdl, calculatedSscl: sscl, calculatedVat: vat };
  }, [watchedItems, invoiceType, currentLocation]);

  const serviceChargeValue = form.watch("serviceCharge") || 0;
  const tdlValue = form.watch("tdl") || 0;
  const ssclValue = form.watch("sscl") || 0;
  const vatValue = form.watch("vat") || 0;

  useEffect(() => {
    form.setValue('serviceCharge', calculatedServiceCharge, { shouldValidate: true });
    form.setValue('tdl', calculatedTdl, { shouldValidate: true });
    form.setValue('sscl', calculatedSscl, { shouldValidate: true });
    form.setValue('vat', calculatedVat, { shouldValidate: true });
  }, [calculatedServiceCharge, calculatedTdl, calculatedSscl, calculatedVat, form]);

  const totalDiscountAmount = itemDiscounts + billDiscount;
  const grandTotal = subtotal - totalDiscountAmount + serviceChargeValue + tdlValue + ssclValue + vatValue;

  async function onSubmit(data: InvoiceFormValues) {
    setIsLoading(true);
    
    if (!currentLocation || !company_id) {
        toast({ variant: 'destructive', title: 'Error', description: 'No location or company selected.' });
        setIsLoading(false);
        return;
    }
    
    const selectedCustomer = customers.find(c => c.customer_id === data.customerId);

    const payload = {
        invoice_date: format(data.invoiceDate, 'yyyy-MM-dd'),
        inv_amount: subtotal,
        grand_total: grandTotal,
        discount_amount: totalDiscountAmount,
        discount_percentage: subtotal > 0 ? (totalDiscountAmount / subtotal) * 100 : 0,
        customer_code: data.customerId,
        service_charge: data.serviceCharge,
        tendered_amount: data.status === '1' ? grandTotal : 0, // 1 is Active/Paid
        close_type: "Cash",
        invoice_status: data.status,
        payment_status: "Pending",
        current_time: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        location_id: parseInt(currentLocation.location_id, 10),
        table_id: 0,
        order_ready_status: 1,
        created_by: "Admin User",
        is_active: 1,
        steward_id: "STW-001",
        cost_value: data.items.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0),
        remark: data.remark || "",
        ref_hold: null,
        company_id: company_id,
        ecommerce_payment_status: 1,
        vat_amount: data.vat,
        sscl_tax: data.sscl,
        tdl: data.tdl,
        chanel: "test", // Hardcoded as per sample
        billing_address: selectedCustomer ? {
            user_id: selectedCustomer.customer_id,
            address_type: "billing",
            first_name: selectedCustomer.customer_first_name,
            last_name: selectedCustomer.customer_last_name,
            phone: selectedCustomer.phone_number,
            address_line1: selectedCustomer.address_line1 || "",
            address_line2: selectedCustomer.address_line2 || "",
            city: selectedCustomer.city_id || "",
            state: "Western Province", // Placeholder
            postal_code: "10100", // Placeholder
            country: "Sri Lanka",
            is_default: 1,
            save_info: 1
        } : undefined,
        items: data.items.map(item => {
            const batchInfo: StockInfo | null = item.selectedBatch ? JSON.parse(item.selectedBatch) : null;
            const skuDetails = allSkus.find(s => s.value === item.productVariantId);
            return {
                user_id: 1, // Default user_id as per example
                product_id: parseInt(item.productId),
                item_price: item.unitPrice,
                item_discount: item.discount || 0,
                quantity: item.quantity,
                customer_id: parseInt(data.customerId),
                table_id: 0,
                cost_price: item.costPrice,
                is_active: 1,
                hold_status: 0,
                printed_status: 0,
                product_variant_id: parseInt(item.productVariantId),
                patch_code: batchInfo?.patch_code || 'N/A',
                expire_date: batchInfo?.expire_date || '0000-00-00',
                company_id: company_id,
            }
        })
    };

    try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/invoices`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create invoice.');
        }

        const result = await response.json();
        toast({
            title: "Invoice Created Successfully!",
            description: `Invoice #${result.invoice_number} has been created.`,
        });
        
        window.open(`/sales-print/invoices/${result.invoice_number}/print?company_id=${company_id}`, '_blank');
        
        router.push('/sales/invoices');
        router.refresh();

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: "destructive",
            title: "Failed to create invoice",
            description: errorMessage,
        });
    } finally {
        setIsLoading(false);
    }
  }
  
  const customerOptions = customers.map(c => ({
      value: c.customer_id,
      label: `${c.customer_first_name} ${c.customer_last_name}`,
  }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">New Invoice</h1>
                 <p className="text-muted-foreground">Create a new retail or wholesale invoice for a customer.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full" disabled={isLoading}>Cancel</Button>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Invoice
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="invoiceType"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Invoice Type</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex items-center space-x-4"
                              >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="Retail" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Retail
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="Wholesale" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Wholesale
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    <div></div>
                    <FormField
                        control={form.control}
                        name="customerId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Customer</FormLabel>
                                <Combobox
                                    options={customerOptions}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select a customer..."
                                    notFoundText="No customer found."
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormItem>
                        <FormLabel>From Order (Optional)</FormLabel>
                        <Select onValueChange={handleOrderChange} disabled={!customerId}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an order to populate" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {availableOrders.map(o => (
                                    <SelectItem key={o.id} value={o.id}>{o.id} - ${o.total.toFixed(2)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormItem>
                    <div className="md:col-span-2">
                        <FormField
                            control={form.control}
                            name="remark"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Remarks (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Special delivery instructions" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Invoice Settings</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="invoiceDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Invoice Date</FormLabel>
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
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Due Date</FormLabel>
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
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="1">Active</SelectItem>
                                    <SelectItem value="2">Pending</SelectItem>
                                    <SelectItem value="3">Cancelled</SelectItem>
                                    <SelectItem value="4">Draft</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
        </div>


        <Card>
            <CardHeader>
                <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30%]">Product</TableHead>
                            <TableHead className="w-[20%]">Batch</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {fields.map((field, index) => {
                            const unitPrice = watchedItems[index]?.unitPrice || 0;
                            const quantity = watchedItems[index]?.quantity || 0;
                            const discount = watchedItems[index]?.discount || 0;
                            const total = (unitPrice * quantity) - discount;
                            const isAlaCarte = watchedItems[index]?.recipeType === 'ala cart';

                            return (
                                <TableRow key={field.id}>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.productVariantId`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Select
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            const selected = allSkus.find(s => s.value === value);
                                                            form.setValue(`items.${index}.sku`, selected?.skuString || '');
                                                            form.setValue(`items.${index}.productId`, selected?.productId || '');
                                                            form.setValue(`items.${index}.recipeType`, selected?.recipeType || 'standard');
                                                            handleProductSelect(selected?.productId || '', selected?.value || '', index);
                                                            const price = invoiceType === 'Wholesale' ? selected?.wholesalePrice : selected?.sellingPrice;
                                                            form.setValue(`items.${index}.unitPrice`, Number(price) || 0);
                                                            form.setValue(`items.${index}.costPrice`, Number(selected?.costPrice) || 0);
                                                            form.setValue(`items.${index}.selectedBatch`, ''); // Reset batch on product change
                                                        }}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a product" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {allSkus.map(sku => (
                                                                <SelectItem key={sku.key} value={sku.value}>{sku.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {!isAlaCarte && (
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.selectedBatch`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Select onValueChange={field.onChange} value={field.value} disabled={!availableBatches[index]}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select batch" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {(availableBatches[index] || []).map(batch => (
                                                                    <SelectItem key={batch.patch_code} value={JSON.stringify(batch)}>
                                                                        {batch.patch_code} (Qty: {parseFloat(batch.stock_balance).toFixed(2)})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
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
                                            name={`items.${index}.unitPrice`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="number" {...field} startIcon="$" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.discount`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="number" {...field} startIcon="$" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right font-mono">${total.toFixed(2)}</TableCell>
                                    <TableCell>
                                        {fields.length > 1 && (
                                            <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                         })}
                    </TableBody>
                </Table>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ sku: '', productId: '', productVariantId: '', quantity: 1, unitPrice: 0, costPrice: 0, discount: 0, selectedBatch: '' })} className="mt-4">
                    Add another item
                </Button>
            </CardContent>
            <CardFooter className="flex justify-end">
                <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-mono">${subtotal.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-destructive">
                        <span>Item-wise Discount</span>
                        <span className="font-mono">-${itemDiscounts.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-destructive">
                        <span className="flex-1 mr-4">Overall Discount</span>
                         <FormField
                            control={form.control}
                            name={`discount`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input type="number" {...field} startIcon="$" className="h-8 max-w-[120px]" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className={cn("justify-between", invoiceType === 'Wholesale' ? 'hidden' : 'flex')}>
                        <span className="flex-1 mr-4">Service Charge</span>
                         <FormField
                            control={form.control}
                            name={`serviceCharge`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input type="number" {...field} startIcon="$" className="h-8 max-w-[120px]" readOnly disabled />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className={cn("justify-between", currentLocation?.tdl_status !== 'Enabled' ? 'hidden' : 'flex')}>
                        <span className="flex-1 mr-4">TDL</span>
                         <FormField
                            control={form.control}
                            name={`tdl`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input type="number" {...field} startIcon="$" className="h-8 max-w-[120px]" readOnly disabled />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className={cn("justify-between", currentLocation?.sscl_status !== 'Enabled' ? 'hidden' : 'flex')}>
                        <span className="flex-1 mr-4">SSCL</span>
                         <FormField
                            control={form.control}
                            name={`sscl`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input type="number" {...field} startIcon="$" className="h-8 max-w-[120px]" readOnly disabled />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className={cn("justify-between", currentLocation?.vat_status !== 'Enabled' ? 'hidden' : 'flex')}>
                        <span className="flex-1 mr-4">VAT</span>
                         <FormField
                            control={form.control}
                            name={`vat`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input type="number" {...field} startIcon="$" className="h-8 max-w-[120px]" readOnly disabled />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Grand Total</span>
                        <span className="font-mono">${Number(grandTotal).toFixed(2)}</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
