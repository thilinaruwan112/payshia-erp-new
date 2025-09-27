
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import type { Product, ProductVariant, Recipe } from "@/lib/types";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation } from "./location-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Textarea } from "./ui/textarea";
import { fetcher } from "@/lib/api";

interface ProductWithApiResponse {
    product: Product;
    variants: ProductVariant[];
}

interface RecipeItem {
    id: string;
    company_id: string;
    product_variant_id: string;
    main_product: string;
    recipe_product: string;
    qty: string;
    recipe_type: string;
    created_by: string;
    created_at: string;
}

const productionNoteFormSchema = z.object({
  finishedGoodId: z.string().min(1, "Finished good is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  notes: z.string().optional(),
});

type ProductionNoteFormValues = z.infer<typeof productionNoteFormSchema>;

export function ProductionNoteForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
  const [selectedRecipeItems, setSelectedRecipeItems] = useState<RecipeItem[]>([]);
  const { company_id } = useLocation();

  const form = useForm<ProductionNoteFormValues>({
    resolver: zodResolver(productionNoteFormSchema),
    defaultValues: {
      quantity: 1,
    },
    mode: "onChange",
  });

  const finishedGoodId = form.watch("finishedGoodId"); // This is the variant ID
  const quantityProduced = form.watch("quantity");

  useEffect(() => {
    async function fetchProducts() {
        if (!company_id) return;
        setIsLoading(true);
        try {
            const response = await fetcher(`https://server-erp.payshia.com/products/get/filter/recipe-type?recipe_type=item_recipe&company_id=${company_id}`);
            if (!response.ok) throw new Error("Failed to fetch products");
            const data = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch required product data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchProducts();
  }, [company_id, toast]);
  
  useEffect(() => {
    async function fetchRecipe() {
        if (!finishedGoodId || !company_id) {
            setSelectedRecipeItems([]);
            return;
        }

        const selectedProductInfo = products.flatMap(p => p.variants.map(v => ({...v, productId: p.product.id}))).find(v => v.id === finishedGoodId);
        
        if (!selectedProductInfo) return;

        try {
            const response = await fetcher(`https://server-erp.payshia.com/product-recipes/get/filter?company_id=${company_id}&main_product=${selectedProductInfo.productId}&product_variant_id=${finishedGoodId}`);
            if (!response.ok) throw new Error('Failed to fetch recipe for the selected product.');
            const data = await response.json();
            setSelectedRecipeItems(data.data || []);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch recipe ingredients.' });
            setSelectedRecipeItems([]);
        }
    }
    fetchRecipe();
  }, [finishedGoodId, company_id, products, toast]);

  const finishedGoodsOptions = React.useMemo(() => {
    if (!products) return [];
    return products
      .flatMap(p => 
          (p.variants || []).map(v => ({ product: p.product, variant: v }))
      )
      .filter((pv): pv is { product: Product, variant: ProductVariant } => !!pv.variant)
      .map(pv => ({
          label: `${pv.product.name} (${pv.variant.sku})`,
          value: pv.variant.id,
      }));
  }, [products]);
  
  const requiredIngredients = React.useMemo(() => {
      if (selectedRecipeItems.length === 0) return [];
      
      const allIngredients = products.flatMap(p => 
        (p.variants || []).map(v => ({
            id: v.id,
            name: p.product.name,
            sku: v.sku,
            unit: p.product.stock_unit || 'Nos'
        }))
      );
      
      return selectedRecipeItems.map(item => {
          const ingredientInfo = allIngredients.find(ing => ing.id === item.recipe_product);
          return {
              name: ingredientInfo?.name || `Product ID: ${item.recipe_product}`,
              sku: ingredientInfo?.sku || 'N/A',
              requiredQty: parseFloat(item.qty) * quantityProduced,
              unit: ingredientInfo?.unit || 'Nos',
          }
      });
  }, [selectedRecipeItems, quantityProduced, products]);

  async function onSubmit(data: ProductionNoteFormValues) {
    setIsLoading(true);
    console.log(data);
    toast({
      title: "Work in Progress",
      description: "Saving Production Notes is not yet implemented.",
    });
    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-nowrap">
              Create Production Note
            </h1>
            <p className="text-muted-foreground">
              Record the production of a finished good from its raw materials.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
              className="w-full"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Note
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Production Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="finishedGoodId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Finished Good</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select an item with a recipe" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {finishedGoodsOptions.map(item => (
                                                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Quantity to Produce</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <div className="md:col-span-2">
                             <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="e.g. Production for special order #123" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Required Ingredients</CardTitle>
                        <CardDescription>
                            This list is automatically calculated based on the quantity.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {requiredIngredients.length > 0 ? (
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ingredient</TableHead>
                                        <TableHead className="text-right">Required</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requiredIngredients.map(ing => (
                                        <TableRow key={ing.sku}>
                                            <TableCell>
                                                <p className="font-medium">{ing.name}</p>
                                                <p className="text-xs text-muted-foreground">{ing.sku}</p>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {ing.requiredQty} {ing.unit}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center text-muted-foreground p-8">
                                <p>Select a product to see its required ingredients.</p>
                            </div>
                        )}
                    </CardContent>
                 </Card>
            </div>
        </div>
      </form>
    </Form>
  );
}
