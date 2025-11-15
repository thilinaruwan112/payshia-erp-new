
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
import type { Product, User, ProductVariant } from "@/lib/types";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";
import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "./location-provider";
import { Combobox } from "./ui/combobox";
import { fetcher } from "@/lib/api";

interface ProductWithApiResponse {
  product: Product;
  variants: { variant: ProductVariant }[];
}

const quotationItemSchema = z.object({
    sku: z.string().min(1, "Product is required."),
    productId: z.string().min(1),
    productVariantId: z.string().min(1),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
    unitPrice: z.coerce.number().min(0, "Unit price must be a positive number."),
    costPrice: z.coerce.number().min(0),
    discount: z.coerce.number().min(0, "Discount must be positive.").optional(),
});

const quotationFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required."),
  quotationDate: z.date({ required_error: "Quotation date is required." }),
  expiryDate: z.date({ required_error: "Expiry date is required." }),
  status: z.enum(["1", "2", "3", "4"]), // 1=Sent, 2=Accepted, 3=Rejected, 4=Draft
  items: z.array(quotationItemSchema).min(1, "At least one item is required."),
  discount: z.coerce.number().min(0).optional(),
  serviceCharge: z.coerce.number().min(0).optional(),
  tdl: z.coerce.number().min(0).optional(),
  sscl: z.coerce.number().min(0).optional(),
  vat: z.coerce.number().min(0).optional(),
  remark: z.string().optional(),
});

type QuotationFormValues = z.infer<typeof quotationFormSchema>;

interface QuotationFormProps {
    customers: User[];
}

export function QuotationForm({ customers }: QuotationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { currentLocation, company_id } = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);
  const [productsWithVariants, setProductsWithVariants] = React.useState<ProductWithApiResponse[]>([]);
  
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
      key: `${p.product.id}-${v.variant.id}`,
      label: `${p.product.name} (${v.variant.sku})`,
      value: v.variant.id,
      productId: p.product.id,
      sellingPrice: parseFloat(String(p.product.price)),
      wholesalePrice: p.product.wholesale_price ? parseFloat(String(p.product.wholesale_price)) : parseFloat(String(p.product.price)),
      costPrice: p.product.cost_price ? parseFloat(String(p.product.cost_price)) : 0,
      skuString: v.variant.sku
  })));
  
  const defaultValues: Partial<QuotationFormValues> = {
    quotationDate: new Date(),
    expiryDate: addDays(new Date(), 30),
    status: '1',
    items: [],
    discount: 0,
    serviceCharge: 0,
    tdl: 0,
    sscl: 0,
    vat: 0,
  };

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const watchedItems = form.watch("items");
  const billDiscount = form.watch("discount") || 0;

  const totals = useMemo(() => {
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
    if (currentLocation?.service_charge_status === 'Enabled') {
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

    const baseForVat = baseForSscl + tdl + sscl;
    let vat = 0;
    if (currentLocation?.vat_status === 'Enabled') {
      vat = baseForVat * 0.18;
    }

    const finalGrandTotal = baseForTaxes + serviceCharge + tdl + sscl + vat - billDiscount;

    return {
      subtotal: sub,
      itemDiscounts: itemDisc,
      serviceCharge,
      tdl,
      sscl,
      vat,
      grandTotal: finalGrandTotal,
    };
  }, [JSON.stringify(watchedItems), billDiscount, currentLocation]);

  useEffect(() => {
    form.setValue('serviceCharge', totals.serviceCharge);
    form.setValue('tdl', totals.tdl);
    form.setValue('sscl', totals.sscl);
    form.setValue('vat', totals.vat);
  }, [totals, form]);


  async function onSubmit(data: QuotationFormValues) {
    setIsLoading(true);
    // Placeholder for actual API submission
    console.log("Submitting Quotation:", data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
        title: "Quotation Created",
        description: "The quotation has been saved successfully.",
    });
    router.push('/sales/quotation');
    setIsLoading(false);
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
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">New Quotation</h1>
                 <p className="text-muted-foreground">Create a new price quotation for a customer.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full" disabled={isLoading}>Cancel</Button>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Quotation
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Quotation Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <div className="md:col-span-2">
                        <FormField
                            control={form.control}
                            name="remark"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Remarks (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Special terms and conditions" {...field} />
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
                    <CardTitle>Quotation Settings</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="quotationDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Quotation Date</FormLabel>
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
                        name="expiryDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Expiry Date</FormLabel>
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
                                    <SelectItem value="1">Sent</SelectItem>
                                    <SelectItem value="2">Accepted</SelectItem>
                                    <SelectItem value="3">Rejected</SelectItem>
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
                <CardTitle>Quotation Items</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">Product</TableHead>
                            <TableHead className="w-[120px]">Qty</TableHead>
                            <TableHead className="w-[180px]">Unit Price</TableHead>
                            <TableHead className="w-[180px]">Discount</TableHead>
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
                            
                            return (
                                <TableRow key={field.id}>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.sku`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Combobox
                                                        options={allSkus}
                                                        value={field.value}
                                                        onChange={(value) => {
                                                            const selected = allSkus.find(s => s.value === value);
                                                            field.onChange(value);
                                                            form.setValue(`items.${index}.productVariantId`, selected?.value || '');
                                                            form.setValue(`items.${index}.productId`, selected?.productId || '');
                                                            form.setValue(`items.${index}.unitPrice`, Number(selected?.sellingPrice) || 0);
                                                            form.setValue(`items.${index}.costPrice`, Number(selected?.costPrice) || 0);
                                                        }}
                                                        placeholder="Select a product"
                                                        notFoundText="No product found."
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
                                                        <Input type="number" placeholder="1" {...field} className="w-24" />
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
                                                        <Input type="number" {...field} className="min-w-[150px] pl-10" startIcon={"LKR"} />
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
                                                        <Input type="number" {...field} className="min-w-[150px] pl-10" startIcon={"LKR"} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right font-mono">LKR {total.toFixed(2)}</TableCell>
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
                <Button type="button" variant="outline" size="sm" onClick={() => append({ sku: '', productId: '', productVariantId: '', quantity: 1, unitPrice: 0, costPrice: 0, discount: 0 })} className="mt-4">
                    Add another item
                </Button>
            </CardContent>
            <CardFooter className="flex justify-end">
                <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-mono">LKR {totals.subtotal.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-destructive">
                        <span>Item-wise Discount</span>
                        <span className="font-mono">-LKR {totals.itemDiscounts.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-destructive">
                        <span className="flex-1 mr-4">Overall Discount</span>
                         <FormField
                            control={form.control}
                            name={`discount`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input type="number" {...field} className="h-8 max-w-[150px] pl-10" startIcon={"LKR"} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    {currentLocation?.service_charge_status === 'Enabled' && (
                      <div className="flex justify-between">
                          <span>Service Charge (10%)</span>
                          <span className="font-mono">LKR {totals.serviceCharge.toFixed(2)}</span>
                      </div>
                    )}
                    {currentLocation?.tdl_status === 'Enabled' && (
                         <div className="flex justify-between">
                            <span>TDL (1%)</span>
                            <span className="font-mono">LKR {totals.tdl.toFixed(2)}</span>
                        </div>
                    )}
                    {currentLocation?.sscl_status === 'Enabled' && (
                         <div className="flex justify-between">
                            <span>SSCL (2.5%)</span>
                            <span className="font-mono">LKR {totals.sscl.toFixed(2)}</span>
                        </div>
                    )}
                     {currentLocation?.vat_status === 'Enabled' && (
                         <div className="flex justify-between">
                            <span>VAT (18%)</span>
                            <span className="font-mono">LKR {totals.vat.toFixed(2)}</span>
                        </div>
                    )}
                     <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Grand Total</span>
                        <span className="font-mono">LKR {Number(totals.grandTotal).toFixed(2)}</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
