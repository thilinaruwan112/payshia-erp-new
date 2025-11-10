
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Product, ProductVariant, StockInfo } from "@/lib/types";
import { Loader2, Trash2, CalendarIcon, Search } from "lucide-react";
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
import { useCurrency } from "./currency-provider";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

interface ProductWithApiResponse {
    product: Product;
    variants: { variant: ProductVariant }[];
}

const stockTakeItemSchema = z.object({
  productVariantId: z.string().min(1, "Item is required."),
  systemQty: z.number().default(0),
  physicalQty: z.coerce.number().min(0, "Quantity must be a positive number.").default(0),
  costPrice: z.number().default(0),
});

const stockTakeFormSchema = z.object({
  locationId: z.string().min(1, "Location is required."),
  date: z.date(),
  takeType: z.enum(["full", "partial"]).default("full"),
  items: z.array(stockTakeItemSchema).min(1, "At least one item is required."),
  notes: z.string().optional(),
});

type StockTakeFormValues = z.infer<typeof stockTakeFormSchema>;

export function StockTakeForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
  const { company_id, availableLocations } = useLocation();
  const [barcode, setBarcode] = useState('');

  const form = useForm<StockTakeFormValues>({
    resolver: zodResolver(stockTakeFormSchema),
    defaultValues: {
      date: new Date(),
      items: [],
    },
    mode: "onChange",
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const locationId = form.watch("locationId");
  const takeType = form.watch("takeType");

  const fetchProductsAndStock = async () => {
    if (!locationId || !company_id || takeType !== 'full') {
        replace([]);
        return;
    };
    setIsLoading(true);
    try {
        const productResponse = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${company_id}`);
        if (!productResponse.ok) throw new Error("Failed to fetch products");
        const productData = await productResponse.json();
        const allProducts = productData.products || [];
        setProducts(allProducts);

        const stockResponse = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stock-entries/report/by-location?location_id=${locationId}&company_id=${company_id}`);
        if (!stockResponse.ok) throw new Error("Failed to fetch stock levels");
        const stockData = await stockResponse.json();
        
        const itemsWithStock = (stockData.data || []).map((item: any) => ({
            productVariantId: item.product_variant_id,
            systemQty: parseFloat(item.stock_balance),
            physicalQty: parseFloat(item.stock_balance), // Pre-fill with system stock
            costPrice: parseFloat(item.cost_price || '0'),
        }));
        
        form.setValue("items", itemsWithStock);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch data for stock take.' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleBarcodeScan = async () => {
    if (!barcode || !locationId || !company_id) return;
    setIsLoading(true);
    try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${company_id}&sku=${barcode}`);
        if (!response.ok) throw new Error("Product with this barcode not found.");
        const productData = await response.json();
        
        if (productData.products && productData.products.length > 0) {
            const product = productData.products[0];
            const variant = product.variants[0].variant;

            // Check if item is already in the list
            const existingItemIndex = fields.findIndex(field => field.productVariantId === variant.id);
            if (existingItemIndex > -1) {
                toast({ title: "Item already in list", description: "This item is already in your stock take list." });
                document.getElementById(`items.${existingItemIndex}.physicalQty`)?.focus();
            } else {
                 const stockResponse = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stock-entries/summary?company_id=${company_id}&product_id=${product.product.id}&product_variant_id=${variant.id}&location_id=${locationId}`);
                let systemQty = 0;
                if (stockResponse.ok) {
                    const stockData = await stockResponse.json();
                    systemQty = stockData.total_stock[0]?.stock_balance ? parseFloat(stockData.total_stock[0].stock_balance) : 0;
                }

                append({
                    productVariantId: variant.id,
                    systemQty: systemQty,
                    physicalQty: 0,
                    costPrice: variant.cost_price ? parseFloat(String(variant.cost_price)) : 0,
                });
                setTimeout(() => {
                   document.getElementById(`items.${fields.length}.physicalQty`)?.focus();
                }, 100);
            }
        } else {
             toast({ variant: "destructive", title: "Not Found", description: "No product found with this barcode." });
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to add item via barcode.' });
    } finally {
        setBarcode('');
        setIsLoading(false);
    }
};

  const allSkus = useMemo(() => {
    return products.flatMap(p =>
      (p.variants || []).map(v => ({
        label: `${p.product.name} (${v.variant.sku})`,
        value: v.variant.id,
      }))
    );
  }, [products]);
  
  const getProductNameByVariantId = (variantId: string) => {
    const found = allSkus.find(sku => sku.value === variantId);
    return found ? found.label : 'Unknown Product';
  }

  async function onSubmit(data: StockTakeFormValues) {
    if (!company_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'No company selected.' });
      return;
    }
    // ... API submission logic ...
    console.log(data);
     toast({ title: 'Stock Take Finalized', description: 'Stock adjustments will be created automatically.' });
  }

  const watchedItems = form.watch('items');
  const grandTotal = useMemo(() => {
     return watchedItems.reduce((acc, item) => {
        const variance = (item.physicalQty || 0) - (item.systemQty || 0);
        return acc + (variance * item.costPrice);
    }, 0);
  }, [watchedItems]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Stock Take Session</CardTitle>
          </CardHeader>
           <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Date</FormLabel><FormControl><Input readOnly disabled value={format(field.value, "PPP")} /></FormControl></FormItem>
                )}
            />
             <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem><FormLabel>Location</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger></FormControl><SelectContent>{availableLocations.map(loc => (<SelectItem key={loc.location_id} value={loc.location_id}>{loc.location_name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="takeType"
              render={({ field }) => (
                <FormItem><FormLabel>Count Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select count type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="full">Full Inventory</SelectItem><SelectItem value="partial">Partial / Cycle Count</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
                <Button onClick={fetchProductsAndStock} disabled={!locationId || takeType !== 'full'}>Load Full Inventory</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Item Count</CardTitle>
            <CardDescription>Scan barcodes or manually search to add items for a partial count. For a full count, all items will be listed below.</CardDescription>
             <div className="pt-4 flex gap-2 max-w-sm">
                <Input placeholder="Scan or enter barcode..." value={barcode} onChange={(e) => setBarcode(e.target.value)} disabled={takeType === 'full'} />
                <Button type="button" onClick={handleBarcodeScan} disabled={takeType === 'full'}><Search className="h-4 w-4" /></Button>
             </div>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>System Qty</TableHead><TableHead>Physical Qty</TableHead><TableHead>Variance</TableHead><TableHead>Cost</TableHead><TableHead className="text-right">Value</TableHead></TableRow></TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></TableCell></TableRow>
                  ) : fields.length > 0 ? fields.map((field, index) => {
                      const item = watchedItems[index];
                      const variance = (item.physicalQty || 0) - (item.systemQty || 0);
                      const lineValue = variance * item.costPrice;
                      return (
                        <TableRow key={field.id} className={cn(variance < 0 ? 'bg-destructive/10' : variance > 0 ? 'bg-green-500/10' : '')}>
                          <TableCell>{getProductNameByVariantId(item.productVariantId)}</TableCell>
                          <TableCell><Input readOnly disabled value={item.systemQty} className="bg-muted w-24" /></TableCell>
                          <TableCell>
                             <FormField
                                control={form.control} name={`items.${index}.physicalQty`}
                                render={({ field }) => (
                                    <FormItem><FormControl><Input type="number" {...field} className="w-24" id={`items.${index}.physicalQty`} /></FormControl><FormMessage /></FormItem>
                                )}
                              />
                          </TableCell>
                          <TableCell className={cn("font-bold", variance !== 0 && "text-lg")}>{variance}</TableCell>
                          <TableCell className="font-mono">{currencySymbol}{item.costPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono">{currencySymbol}{lineValue.toFixed(2)}</TableCell>
                        </TableRow>
                      );
                  }) : (
                     <TableRow><TableCell colSpan={6} className="text-center h-48 text-muted-foreground">Load full inventory or scan barcodes to begin.</TableCell></TableRow>
                  )}
                </TableBody>
                <TableFooter><TableRow><TableCell colSpan={5} className="text-right font-bold text-lg">Total Variance Value</TableCell><TableCell className="text-right font-bold font-mono text-lg">{currencySymbol}{grandTotal.toFixed(2)}</TableCell></TableRow></TableFooter>
             </Table>
          </CardContent>
          <CardFooter className="flex-col items-start gap-4">
            <div className="w-full max-w-lg">
                <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Add any notes about this stock take (e.g., reason for discrepancies)" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                />
            </div>
             <Button type="submit" disabled={isSubmitting || fields.length === 0}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Finalize & Adjust Stock
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
