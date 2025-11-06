
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface ProductWithApiResponse {
    product: Product;
    variants: ProductVariant[];
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
            const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/get/goods/filter/item-type?item_type=menu,both&company_id=${company_id}`);
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
        .flatMap(p => 
            (p.variants || []).map(v => ({ product: p.product, variant: v }))
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

        const selectedProductInfo = products.flatMap(p => p.variants.map(v => ({...v, productId: p.product.id}))).find(v => v.id === finishedGoodId);
        
        if (!selectedProductInfo) return;

        try {
            const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-recipes/get/filter?company_id=${company_id}&main_product=${selectedProductInfo.productId}&product_variant_id=${finishedGoodId}`);
            if (!response.ok) throw new Error('Failed to fetch recipe.');
            const data = await response.json();
            const recipeItems: RecipeItem[] = data.data || [];

            const allIngredientsInfo = products.flatMap(p => 
                (p.variants || []).map(v => ({
                    id: v.id,
                    name: `${p.product.name} (${v.sku})`,
                    unit: p.product.stock_unit || 'Nos',
                    costPrice: v.cost_price ? parseFloat(String(v.cost_price)) : 0,
                }))
            );
            
            const newIngredients = recipeItems.map(item => {
                const ingredientInfo = allIngredientsInfo.find(ing => ing.id === item.recipe_product);
                const plannedQty = parseFloat(item.qty) * (plannedQuantity || 1);
                return {
                    ingredientId: item.recipe_product,
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
    setIsSubmitting(true);
    console.log("Submitting production run data:", data);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({
      title: "Production Run Recorded (Simulated)",
      description: "Yield, consumption, and wastage have been recorded.",
    });
    setIsSubmitting(false);
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
                  <TableHead className="text-right">Wastage</TableHead>
                  <TableHead className="text-right">Cost Price</TableHead>
                  <TableHead className="text-right">Line Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.length > 0 ? fields.map((field, index) => {
                  const planned = form.watch(`ingredients.${index}.plannedQty`);
                  const actual = form.watch(`ingredients.${index}.actualQty`);
                  const wastage = planned - actual;
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
                       <TableCell className={`text-right font-medium ${wastage > 0 ? 'text-destructive' : 'text-green-600'}`}>{wastage.toFixed(2)} {form.getValues(`ingredients.${index}.unit`)}</TableCell>
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
