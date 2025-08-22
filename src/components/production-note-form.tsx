
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

interface ProductWithVariants {
    product: Product;
    variants: ProductVariant[];
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
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const { company_id } = useLocation();

  const form = useForm<ProductionNoteFormValues>({
    resolver: zodResolver(productionNoteFormSchema),
    defaultValues: {
      quantity: 1,
    },
    mode: "onChange",
  });

  const finishedGoodId = form.watch("finishedGoodId");
  const quantityProduced = form.watch("quantity");

  useEffect(() => {
    async function fetchData() {
        if (!company_id) return;
        try {
            // In a real app, you'd fetch recipes and filter by company
            const [productsResponse, recipesResponse] = await Promise.all([
                fetch(`https://server-erp.payshia.com/products/with-variants?company_id=${company_id}`),
                Promise.resolve({ ok: true, json: () => Promise.resolve([]) }) // Mocking recipe fetch
            ]);

            if (!productsResponse.ok) throw new Error("Failed to fetch products");
            const productsData = await productsResponse.json();
            setProducts(productsData.products || []);

            if(!recipesResponse.ok) throw new Error("Failed to fetch recipes");
            const recipesData = await recipesResponse.json();
            setRecipes(recipesData);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch required data.' });
        }
    }
    fetchData();
  }, [company_id, toast]);
  
  useEffect(() => {
    const recipe = recipes.find(r => r.finished_good_id === finishedGoodId) || null;
    setSelectedRecipe(recipe);
  }, [finishedGoodId, recipes]);

  const finishedGoodsOptions = React.useMemo(() => {
    const goodsWithItemRecipe = recipes.filter(r => r.recipe_type === "Item Recipe").map(r => r.finished_good_id);
    return products
        .flatMap(p => p.variants.map(v => ({ product: p.product, variant: v })))
        .filter(pv => goodsWithItemRecipe.includes(pv.variant.id))
        .map(pv => ({
            label: `${pv.product.name} (${pv.variant.sku})`,
            value: pv.variant.id,
        }));
  }, [products, recipes]);
  
  const requiredIngredients = React.useMemo(() => {
      if (!selectedRecipe) return [];
      return selectedRecipe.items.map(item => {
          const ingredientProduct = products.flatMap(p => p.variants.map(v => ({...v, productName: p.product.name}))).find(v => v.id === item.ingredient_id);
          return {
              name: ingredientProduct?.productName || 'Unknown Ingredient',
              sku: ingredientProduct?.sku || 'N/A',
              requiredQty: item.quantity * quantityProduced,
              unit: item.unit,
          }
      });
  }, [selectedRecipe, quantityProduced, products]);

  async function onSubmit(data: ProductionNoteFormValues) {
    setIsLoading(true);
    console.log(data);
    toast({
      title: "Work in Progress",
      description: "Saving Production Notes is not yet implemented.",
    });
    // In a real app, this would deduct raw materials and add finished goods to inventory
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
