
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
import type { Product, ProductVariant } from "@/lib/types";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation } from "./location-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "./ui/table";
import { Textarea } from "./ui/textarea";
import { fetcher } from "@/lib/api";
import { Combobox } from "./ui/combobox";
import { cn } from "@/lib/utils";

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
});

const productionRunFormSchema = z.object({
  finishedGoodId: z.string().min(1, "Finished good is required."),
  plannedQuantity: z.coerce.number().min(1, "Planned quantity must be at least 1."),
  actualYield: z.coerce.number().min(0, "Actual yield cannot be negative."),
  notes: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1, "At least one ingredient is required."),
});

type ProductionRunFormValues = z.infer<typeof productionRunFormSchema>;

export function ProductionRunForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
  const { company_id, currentLocation } = useLocation();

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
        if (!finishedGoodId || !company_id) {
            replace([]);
            return;
        }

        const selectedProductInfo = products.flatMap(p => p.variants.map(v => ({...v.variant, productId: p.product.id}))).find(v => v.id === finishedGoodId);
        
        if (!selectedProductInfo) return;

        try {
            const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-recipes/get/filter?company_id=${company_id}&main_product=${selectedProductInfo.productId}&product_variant_id=${finishedGoodId}`);
            if (!response.ok) throw new Error('Failed to fetch recipe.');
            const data = await response.json();
            const recipeItems: RecipeItem[] = data.data || [];

            const allIngredientsInfo = products.flatMap(p => 
                (p.variants || []).map(v => ({
                    id: v.variant.id,
                    productId: p.product.id,
                    name: `${p.product.name} (${v.variant.sku})`,
                    unit: p.product.stock_unit || 'Nos',
                    costPrice: v.variant.cost_price ? parseFloat(String(v.variant.cost_price)) : 0,
                }))
            );
            
            const newIngredients = recipeItems.map(item => {
                const ingredientInfo = allIngredientsInfo.find(ing => ing.id === item.recipe_product);
                const plannedQty = parseFloat(item.qty) * (plannedQuantity || 1);
                return {
                    ingredientId: item.recipe_product,
                    productId: ingredientInfo?.productId || '0', // Need product ID for payload
                    ingredientName: ingredientInfo?.name || `ID: ${item.recipe_product}`,
                    plannedQty: plannedQty,
                    actualQty: plannedQty,
                    unit: ingredientInfo?.unit || 'Nos',
                    costPrice: ingredientInfo?.costPrice || 0,
                };
            });
            replace(newIngredients);
            form.setValue('actualYield', plannedQuantity);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch recipe ingredients.' });
            replace([]);
        }
    }
    fetchAndSetRecipe();
  }, [finishedGoodId, plannedQuantity, company_id, products, toast, replace, form]);

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
        items: data.ingredients.map(ing => {
            const ingredientProductInfo = products.flatMap(p => p.variants.map(v => ({...v.variant, productId: p.product.id}))).find(v => v.id === ing.ingredientId);
            return {
                product_id: parseInt(ingredientProductInfo?.productId || '0'),
                product_variant_id: parseInt(ing.ingredientId),
                target_qty: ing.plannedQty,
                actual_qty: ing.actualQty,
                variance: ing.plannedQty - ing.actualQty,
                cost_value: (ing.costPrice || 0) * ing.actualQty,
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
        router.push('/production/production-note');
        router.refresh();

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({ variant: 'destructive', title: 'Submission Failed', description: errorMessage });
    } finally {
        setIsSubmitting(false);
    }
  }

  const watchedIngredients = form.watch('ingredients');
  const grandTotalCost = React.useMemo(() => {
    return watchedIngredients.reduce((acc, item) => {
        const actualQty = item?.actualQty || 0;
        const costPrice = item?.costPrice || 0;
        return acc + (actualQty * costPrice);
    }, 0);
  }, [watchedIngredients]);

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
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="finishedGoodId"
              render={({ field }) => (
                <FormItem>
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
                  <TableHead className="text-right">Planned Qty</TableHead>
                  <TableHead className="w-48 text-right">Actual Qty</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">Cost Price</TableHead>
                  <TableHead className="text-right">Line Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.length > 0 ? fields.map((field, index) => {
                  const planned = form.watch(`ingredients.${index}.plannedQty`);
                  const actual = form.watch(`ingredients.${index}.actualQty`);
                  const variance = planned - actual;
                  const costPrice = form.watch(`ingredients.${index}.costPrice`) || 0;
                  const lineValue = actual * costPrice;
                  return (
                    <TableRow key={field.id}>
                      <TableCell>{form.getValues(`ingredients.${index}.ingredientName`)}</TableCell>
                      <TableCell className="text-right">{planned.toFixed(2)} {form.getValues(`ingredients.${index}.unit`)}</TableCell>
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
                        {variance.toFixed(2)} {form.getValues(`ingredients.${index}.unit`)}
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
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Select a finished good with a recipe to see ingredients.</TableCell>
                    </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5} className="text-right font-bold">Total Cost</TableCell>
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
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="actualYield"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Actual Yield (Finished Goods Quantity)</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
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
            </CardContent>
        </Card>
      </form>
    </Form>
  );
}
