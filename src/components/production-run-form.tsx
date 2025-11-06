
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
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Product, ProductVariant, StockInfo } from "@/lib/types";
import { Loader2, CalendarIcon } from "lucide-react";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation } from "./location-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "./ui/table";
import { Textarea } from "./ui/textarea";
import { fetcher } from "@/lib/api";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { Combobox } from "./ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useCurrency } from "./currency-provider";


interface ProductWithApiResponse {
    product: Product;
    variants: { variant: ProductVariant }[];
}

interface RecipeItem {
    id: string;
    product_variant_id: string;
    recipe_product: string;
    qty: string;
}

const ingredientSchema = z.object({
  ingredientId: z.string(),
  ingredientName: z.string(),
  plannedQty: z.number(),
  actualQty: z.coerce.number().min(0, "Actual quantity cannot be negative."),
  unit: z.string(),
  costPrice: z.number().optional(),
  selectedBatch: z.string().min(1, "A batch must be selected."),
});

const productionRunFormSchema = z.object({
  finishedGoodId: z.string().min(1, "Finished good is required."),
  plannedQuantity: z.coerce.number().min(1, "Planned quantity must be at least 1."),
  actualYield: z.coerce.number().min(0, "Actual yield cannot be negative."),
  batchCode: z.string().min(1, "Batch code for the finished good is required."),
  expiryDate: z.date().optional(),
  notes: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1, "At least one ingredient is required."),
});

type ProductionRunFormValues = z.infer<typeof productionRunFormSchema>;

export function ProductionRunForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
  const { company_id, currentLocation } = useLocation();
  const [finishedGoodCost, setFinishedGoodCost] = useState(0);
  const [finishedGoodStock, setFinishedGoodStock] = useState<number | null>(null);
  const [availableBatches, setAvailableBatches] = useState<Record<number, StockInfo[]>>({});

  const form = useForm<ProductionRunFormValues>({
    resolver: zodResolver(productionRunFormSchema),
    defaultValues: {
      plannedQuantity: 1,
      ingredients: [],
    },
    mode: "onChange",
  });
  
  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const finishedGoodId = form.watch("finishedGoodId");
  const plannedQuantity = form.watch("plannedQuantity");
  const watchedIngredients = form.watch('ingredients');
  const actualYield = form.watch('actualYield');
  
  const allIngredientsOptions = React.useMemo(() => {
      return products
        .filter(p => ['raw', 'both'].includes(p.product.item_type || ''))
        .flatMap(p => 
            (p.variants || []).map(v => ({
                id: v.variant.id,
                productId: p.product.id,
                name: `${p.product.name} (${v.variant.sku})`,
                unit: p.product.stock_unit || 'Nos',
                costPrice: v.variant.cost_price ? parseFloat(String(v.variant.cost_price)) : 0,
            }))
        );
  }, [products]);

  const handleProductSelect = useCallback(async (variantId: string, index: number, locationForStock: string) => {
    if (!locationForStock) {
        toast({ variant: 'destructive', title: 'Location not set', description: 'Please select a location first.' });
        return;
    }
    const skuDetails = allIngredientsOptions.find(s => s.id === variantId);
    if (!skuDetails || !company_id) return;

    try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stock-entries/summary?company_id=${company_id}&product_id=${skuDetails.productId}&product_variant_id=${variantId}&location_id=${locationForStock}`);
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
        
        if (batches.length > 0) {
            const firstBatch = batches[0];
            form.setValue(`ingredients.${index}.selectedBatch`, JSON.stringify(firstBatch));
        } else {
             form.setValue(`ingredients.${index}.selectedBatch`, '');
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({ variant: 'destructive', title: 'Error fetching stock', description: errorMessage });
    }
  }, [company_id, allIngredientsOptions, form, toast]);

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
  

  const finishedGoodsOptions = React.useMemo(() => {
    return products
        .filter(p => p.product.item_type !== 'raw')
        .flatMap(p => 
            (p.variants || []).map(v => ({ product: p.product, variant: v.variant }))
        )
        .filter((pv): pv is { product: Product, variant: ProductVariant } => !!pv.variant?.id && !!pv.variant.sku)
        .map(pv => ({
            label: `${pv.product.name} (${pv.variant.sku})`,
            value: pv.variant.id,
        }));
  }, [products]);


  useEffect(() => {
    async function fetchAndSetRecipe() {
        if (!finishedGoodId || !company_id || allIngredientsOptions.length === 0 || !currentLocation) {
            replace([]);
            return;
        }

        const selectedProductInfo = products.flatMap(p => p.variants.map(v => ({...v.variant, productId: p.product.id, costPrice: v.variant.cost_price }))).find(v => v.id === finishedGoodId);
        
        if (!selectedProductInfo) return;

        setFinishedGoodCost(selectedProductInfo.costPrice ? parseFloat(String(selectedProductInfo.costPrice)) : 0);

        // Fetch stock for finished good
        setIsLoading(true);
        setFinishedGoodStock(null);
        try {
            const stockResponse = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stock-entries/summary?company_id=${company_id}&product_id=${selectedProductInfo.productId}&product_variant_id=${finishedGoodId}&location_id=${currentLocation.location_id}`);
            if (stockResponse.ok) {
                const stockData = await stockResponse.json();
                const totalStock = stockData.total_stock[0]?.stock_balance ? parseFloat(stockData.total_stock[0].stock_balance) : 0;
                setFinishedGoodStock(totalStock);
            } else {
                setFinishedGoodStock(0);
            }
        } catch (error) {
             console.error("Failed to fetch finished good stock:", error);
             setFinishedGoodStock(0);
        }

        try {
            const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-recipes/get/filter?company_id=${company_id}&main_product=${selectedProductInfo.productId}&product_variant_id=${finishedGoodId}`);
            if (!response.ok) throw new Error('Failed to fetch recipe for the selected product.');
            const data = await response.json();
            const recipeItems: RecipeItem[] = data.data || [];
            
            const newIngredients = recipeItems.map(item => {
                const ingredientInfo = allIngredientsOptions.find(ing => ing.id === item.recipe_product);
                const plannedQty = parseFloat(item.qty) * (plannedQuantity || 1);
                return {
                    ingredientId: item.recipe_product,
                    productId: ingredientInfo?.productId || '0',
                    ingredientName: ingredientInfo?.name || `ID: ${item.recipe_product}`,
                    plannedQty: plannedQty,
                    actualQty: plannedQty,
                    unit: ingredientInfo?.unit || 'Nos',
                    costPrice: ingredientInfo?.costPrice || 0,
                    selectedBatch: '',
                };
            });
            replace(newIngredients);
            form.setValue('actualYield', plannedQuantity);

            // Fetch stock for all new ingredients
            newIngredients.forEach((ing, index) => {
                if (currentLocation) {
                    handleProductSelect(ing.ingredientId, index, currentLocation.location_id);
                }
            });

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch recipe ingredients.' });
            replace([]);
        } finally {
            setIsLoading(false);
        }
    }
    fetchAndSetRecipe();
  }, [finishedGoodId, plannedQuantity, company_id, products, toast, replace, form, allIngredientsOptions, currentLocation, handleProductSelect]);
  
  const grandTotalCost = watchedIngredients.reduce((acc, item) => {
    const actualQty = item?.actualQty || 0;
    const costPrice = item?.costPrice || 0;
    return acc + (actualQty * costPrice);
  }, 0);
  
  const currentStock = finishedGoodStock || 0;
  const currentCost = finishedGoodCost || 0;
  const newStock = actualYield || 0;
  const totalCurrentValue = currentStock * currentCost;
  const totalNewValue = grandTotalCost;
  const afterCost = (currentStock + newStock > 0) ? (totalCurrentValue + totalNewValue) / (currentStock + newStock) : 0;

  async function onSubmit(data: ProductionRunFormValues) {
    if (!company_id || !currentLocation) {
        toast({ variant: 'destructive', title: 'Error', description: 'No company or location selected.' });
        return;
    }
    setIsSubmitting(true);
    
    const finishedGoodProductInfo = products.flatMap(p => p.variants.map(v => ({...v.variant, productId: p.product.id}))).find(v => v.id === data.finishedGoodId);

    if (!finishedGoodProductInfo) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find finished good product details.' });
        setIsSubmitting(false);
        return;
    }

    const payload = {
        location_id: parseInt(currentLocation.location_id, 10),
        company_id: company_id,
        cost_value: grandTotalCost,
        plan_qty: data.plannedQuantity,
        yield_qty: data.actualYield,
        product_id: parseInt(finishedGoodProductInfo.productId),
        product_variant_id: parseInt(data.finishedGoodId),
        created_by: 'yomal',
        expire_date: data.expiryDate ? format(data.expiryDate, 'yyyy-MM-dd') : undefined,
        patch_code: data.batchCode,
        items: data.ingredients.map(ing => {
            const ingredientProductInfo = allIngredientsOptions.find(opt => opt.id === ing.ingredientId);
            const batchInfo: StockInfo = JSON.parse(ing.selectedBatch);
            return {
                product_id: parseInt(ingredientProductInfo?.productId || '0'),
                product_variant_id: parseInt(ing.ingredientId),
                target_qty: ing.plannedQty,
                actual_qty: ing.actualQty,
                variance: ing.plannedQty - ing.actualQty,
                cost_value: (ing.costPrice || 0) * ing.actualQty,
                expire_date: batchInfo.expire_date,
                patch_code: batchInfo.patch_code,
            }
        })
    };

    try {
        const response = await fetcher('https://qa-server-erp.payshia.com/mission-plus', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to complete production run.');
        }

        const result = await response.json();

        toast({
            title: "Production Run Recorded",
            description: result.message || "Yield, consumption, and wastage have been recorded.",
        });
        router.push('/production/run');
        router.refresh();

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({ variant: 'destructive', title: 'Submission Failed', description: errorMessage });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-nowrap">
              New Production Run
            </h1>
            <p className="text-muted-foreground">
              Record a production run with actual consumption and yield.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
              className="w-full"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Run
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Production Plan</CardTitle>
            <CardDescription>Select the product and the quantity you plan to produce.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <FormField
              control={form.control}
              name="finishedGoodId"
              render={({ field }) => (
                <FormItem className="lg:col-span-2">
                  <FormLabel>Finished Good</FormLabel>
                   <Combobox
                        options={finishedGoodsOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select an item with a recipe"
                        notFoundText="No item found."
                    />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="plannedQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Planned Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
                <FormLabel>Current Cost Price</FormLabel>
                <Input value={finishedGoodCost.toFixed(2)} readOnly disabled startIcon={currencySymbol} />
            </div>
             <div className="space-y-2">
                <FormLabel>Current Stock</FormLabel>
                <Input value={finishedGoodStock !== null ? finishedGoodStock.toFixed(2) : '...'} readOnly disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingredient Consumption</CardTitle>
            <CardDescription>
              Enter the actual quantity of raw materials used for this production run.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead className="w-[20%]">Batch</TableHead>
                  <TableHead className="text-right">Planned Qty</TableHead>
                  <TableHead className="w-48 text-right">Actual Qty</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">Cost Price</TableHead>
                  <TableHead className="text-right">Line Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.length > 0 ? fields.map((field, index) => {
                  const planned = watchedIngredients[index]?.plannedQty || 0;
                  const actual = watchedIngredients[index]?.actualQty || 0;
                  const variance = planned - actual;
                  const costPrice = watchedIngredients[index]?.costPrice || 0;
                  const lineValue = actual * costPrice;
                  return (
                    <TableRow key={field.id}>
                      <TableCell>{watchedIngredients[index]?.ingredientName}</TableCell>
                      <TableCell>
                          <FormField
                              control={form.control}
                              name={`ingredients.${index}.selectedBatch`}
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
                      <TableCell className="text-right">{planned.toFixed(2)} {watchedIngredients[index]?.unit}</TableCell>
                      <TableCell>
                        <FormField
                            control={form.control}
                            name={`ingredients.${index}.actualQty`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input type="number" {...field} className="text-right" />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                      </TableCell>
                       <TableCell className={cn("text-right font-medium", variance > 0 ? 'text-green-600' : variance < 0 ? 'text-destructive' : '')}>
                        {variance.toFixed(2)} {watchedIngredients[index]?.unit}
                       </TableCell>
                       <TableCell className="text-right font-mono">
                           {costPrice.toFixed(2)}
                       </TableCell>
                       <TableCell className="text-right font-mono">
                           {lineValue.toFixed(2)}
                       </TableCell>
                    </TableRow>
                  );
                }) : (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Select a finished good with a recipe to see ingredients.</TableCell>
                    </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} className="text-right font-bold">Total Cost</TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {grandTotalCost.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Production Yield</CardTitle>
                 <CardDescription>Record the final output of the production run.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="actualYield"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Actual Yield (Finished Goods Qty)</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="batchCode"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>New Batch Code</FormLabel>
                        <FormControl><Input placeholder="e.g. BATCH-001" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col justify-end">
                    <FormLabel>Expiry Date</FormLabel>
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
                                <span>Pick an expiry date</span>
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
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <div className="space-y-2">
                    <FormLabel>After Cost</FormLabel>
                    <Input value={afterCost.toFixed(2)} readOnly disabled startIcon={currencySymbol} />
                </div>
                 <div className="md:col-span-2 lg:col-span-3">
                     <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Add any notes about this production run..." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>
            </CardContent>
        </Card>
      </form>
    </Form>
  );
}

    