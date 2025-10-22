
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Product, ProductVariant, StockInfo } from "@/lib/types";
import { Loader2, Trash2, CalendarIcon } from "lucide-react";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation } from "./location-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "./ui/table";
import { fetcher } from "@/lib/api";
import { format } from "date-fns";
import { Textarea } from "./ui/textarea";
import { Combobox } from "./ui/combobox";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface ProductWithApiResponse {
    product: Product;
    variants: { variant: ProductVariant }[];
}

const adjustmentItemSchema = z.object({
  productVariantId: z.string().min(1, "Product is required."),
  selectedBatch: z.string().min(1, "A batch must be selected."),
  currentStock: z.number().default(0),
  newQuantity: z.coerce.number().min(0, "Quantity must be a positive number.").default(0),
  costPrice: z.number().default(0),
  reason: z.string().optional(),
});

const stockAdjustmentFormSchema = z.object({
  date: z.date({ required_error: "An adjustment date is required." }),
  type: z.enum(["Adjustment", "Wastage"], { required_error: "An adjustment type is required." }),
  remark: z.string().optional(),
  items: z.array(adjustmentItemSchema).min(1, "At least one adjustment item is required."),
});

type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentFormSchema>;

export function StockAdjustmentForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
  const { company_id, currentLocation } = useLocation();
  const [availableBatches, setAvailableBatches] = useState<Record<number, StockInfo[]>>({});

  const form = useForm<StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentFormSchema),
    defaultValues: {
      date: new Date(),
      type: "Adjustment",
      items: [],
    },
    mode: "onChange",
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Reset form if location changes
  useEffect(() => {
    replace([]);
  }, [currentLocation, replace]);

  useEffect(() => {
    async function fetchProducts() {
      if (!company_id) return;
      setIsLoading(true);
      try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${company_id}`);
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch products.' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, [company_id, toast]);

  const allSkus = useMemo(() => {
    return products.flatMap(p =>
      (p.variants || []).map(v => ({
        label: `${p.product.name} (${v.variant.sku})`,
        value: v.variant.id,
        productId: p.product.id,
        costPrice: v.variant.cost_price ? parseFloat(String(v.variant.cost_price)) : 0,
      }))
    );
  }, [products]);

  const handleProductSelect = useCallback(async (variantId: string, index: number) => {
    if (!currentLocation) {
        toast({ variant: 'destructive', title: 'Location not set', description: 'Please select a location first.' });
        return;
    }
    const skuDetails = allSkus.find(s => s.value === variantId);
    if (!skuDetails) return;

    form.setValue(`items.${index}.costPrice`, skuDetails.costPrice);

    try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stock-entries/summary?company_id=${company_id}&product_id=${skuDetails.productId}&product_variant_id=${variantId}&location_id=${currentLocation.location_id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch stock for this product.');
        }
        const data = await response.json();
        const batches = (data.grouped_by_expire_date || []).filter((b: StockInfo) => parseFloat(b.stock_balance) > 0);
        
        batches.sort((a: StockInfo, b: StockInfo) => {
            if (a.expire_date === '0000-00-00') return 1;
            if (b.expire_date === '0000-00-00') return -1;
            return new Date(a.expire_date).getTime() - new Date(b.expire_date).getTime();
        });

        setAvailableBatches(prev => ({ ...prev, [index]: batches }));
        
        // Auto-select the first batch (soonest to expire)
        if (batches.length > 0) {
            const firstBatch = batches[0];
            form.setValue(`items.${index}.selectedBatch`, JSON.stringify(firstBatch));
            form.setValue(`items.${index}.currentStock`, parseFloat(firstBatch.stock_balance));
            form.setValue(`items.${index}.newQuantity`, parseFloat(firstBatch.stock_balance));
        } else {
             form.setValue(`items.${index}.selectedBatch`, '');
             form.setValue(`items.${index}.currentStock`, 0);
             form.setValue(`items.${index}.newQuantity`, 0);
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({ variant: 'destructive', title: 'Error fetching stock', description: errorMessage });
        form.setValue(`items.${index}.currentStock`, 0);
    }
  }, [company_id, currentLocation, allSkus, form, toast]);


  async function onSubmit(data: StockAdjustmentFormValues) {
    if (!currentLocation || !company_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'No location or company selected.' });
      return;
    }
    setIsSubmitting(true);
    const itemsWithStockChange = data.items.filter(item => item.newQuantity - item.currentStock !== 0);

    if (itemsWithStockChange.length === 0) {
        toast({ title: 'No Changes', description: 'No stock adjustments were needed.'});
        setIsSubmitting(false);
        return;
    }

    try {
        for (const item of itemsWithStockChange) {
            const variance = item.newQuantity - item.currentStock;
            const skuDetails = allSkus.find(s => s.value === item.productVariantId);
            const batchInfo: StockInfo = JSON.parse(item.selectedBatch);

            if (!skuDetails) {
                throw new Error(`Could not find product details for one of the items.`);
            }

            const payload = {
                product_id: parseInt(skuDetails.productId, 10),
                product_variant_id: parseInt(item.productVariantId, 10),
                company_id: company_id,
                location_id: parseInt(currentLocation.location_id, 10),
                set_quantity: item.newQuantity,
                variance: variance,
                cost_price: item.costPrice,
                patch_code: batchInfo.patch_code,
                expire_date: batchInfo.expire_date,
                created_by: "admin_user",
                updated_by: "admin_user",
                is_active: 1
            };
            
            const response = await fetcher(`https://qa-server-erp.payshia.com/stock-adjesments`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            
             if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save one or more stock adjustments.');
            }
        }
        
        toast({
            title: "Stock Adjustments Saved",
            description: "The stock levels have been successfully updated.",
        });
        router.refresh();
        form.reset({ items: [] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({ variant: 'destructive', title: 'Submission Failed', description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const watchedItems = form.watch('items');

  const grandTotal = useMemo(() => {
    return watchedItems.reduce((acc, item) => {
        const variance = (item.newQuantity || 0) - (item.currentStock || 0);
        const lineValue = variance * (item.costPrice || 0);
        return acc + lineValue;
    }, 0);
  }, [watchedItems]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Adjustment Details</CardTitle>
                 <CardDescription>
                    Select the date and type of adjustment for location: <strong>{currentLocation?.location_name || 'Not Set'}</strong>
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col justify-end">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
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
                    name="type"
                    render={({ field }) => (
                        <FormItem className="flex flex-col justify-end">
                        <FormLabel>Type</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select adjustment type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Adjustment">Adjustment</SelectItem>
                                <SelectItem value="Wastage">Wastage</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Stock Adjustment / Stock Take</CardTitle>
            <CardDescription>
                Add items and enter the final physical quantity. The system will calculate the variance and adjustment value.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%]">Product</TableHead>
                  <TableHead className="w-[20%]">Batch / Expiry</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Physical Qty</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Cost Price</TableHead>
                  <TableHead className="text-right">Line Value</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                    const item = watchedItems[index];
                    const variance = (item.newQuantity || 0) - (item.currentStock || 0);
                    const lineValue = variance * (item.costPrice || 0);
                    return (
                        <TableRow key={field.id}>
                            <TableCell>
                                <Combobox
                                    options={allSkus}
                                    value={item.productVariantId}
                                    onChange={(value) => {
                                        form.setValue(`items.${index}.productVariantId`, value);
                                        handleProductSelect(value, index);
                                    }}
                                    placeholder="Select an item"
                                />
                            </TableCell>
                            <TableCell>
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.selectedBatch`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <Select onValueChange={(value) => {
                                                field.onChange(value);
                                                const batchInfo: StockInfo = JSON.parse(value);
                                                form.setValue(`items.${index}.currentStock`, parseFloat(batchInfo.stock_balance));
                                                form.setValue(`items.${index}.newQuantity`, parseFloat(batchInfo.stock_balance));
                                            }} value={field.value} disabled={!availableBatches[index]}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select batch" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {(availableBatches[index] || []).map(batch => (
                                                        <SelectItem key={`${batch.patch_code}-${batch.expire_date}`} value={JSON.stringify(batch)}>
                                                            {batch.patch_code} ({parseFloat(batch.stock_balance)})
                                                            {batch.expire_date !== '0000-00-00' && ` - ${format(new Date(batch.expire_date), 'dd/MM/yy')}`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TableCell>
                            <TableCell>
                                <Input type="number" value={item.currentStock} readOnly disabled className="bg-muted border-none" />
                            </TableCell>
                            <TableCell>
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.newQuantity`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TableCell>
                            <TableCell>
                                <Input type="number" value={variance} readOnly disabled className={cn("bg-muted border-none", variance > 0 ? "text-green-600" : variance < 0 ? "text-destructive" : "")} />
                            </TableCell>
                            <TableCell>
                                <Input type="number" value={item.costPrice} readOnly disabled className="bg-muted border-none" />
                            </TableCell>
                            <TableCell className="text-right font-mono">
                                {lineValue.toFixed(2)}
                            </TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} className="text-right font-bold">Total Adjustment Value</TableCell>
                  <TableCell className={cn("text-right font-bold font-mono", grandTotal > 0 ? "text-green-600" : grandTotal < 0 ? "text-destructive" : "")}>{grandTotal.toFixed(2)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
             <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ productVariantId: "", selectedBatch: "", currentStock: 0, newQuantity: 0, costPrice: 0, reason: "" })}
                className="mt-4"
                >
                Add another item
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col items-end gap-4">
             <div className="w-full max-w-sm">
                <FormField
                    control={form.control}
                    name="remark"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Remark / Reason for Adjustment</FormLabel>
                        <FormControl>
                            <Textarea placeholder="e.g. Monthly stock take, Damaged goods disposal" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Adjustments
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
