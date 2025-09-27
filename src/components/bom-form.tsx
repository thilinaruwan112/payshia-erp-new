
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
import { Loader2, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation } from "./location-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { fetcher } from "@/lib/api";
import { format } from "date-fns";
import { Combobox } from "./ui/combobox";

interface ProductWithApiResponse {
    product: Product;
    variants: { variant: ProductVariant }[];
}

const recipeItemSchema = z.object({
  recipe_product: z.string().min(1, "Ingredient is required."),
  quantity: z.coerce.number().min(0.001, "Quantity must be greater than 0."),
  unit: z.string().min(1, "Unit is required."),
});

const bomFormSchema = z.object({
  productId: z.string().min(1, "Finished good is required."),
  recipeType: z.enum(["A La Carte", "Item Recipe"]),
  items: z.array(recipeItemSchema).min(1, "At least one ingredient is required."),
  notes: z.string().optional(),
});

type BomFormValues = z.infer<typeof bomFormSchema>;

export function BomForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
  const { company_id } = useLocation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const form = useForm<BomFormValues>({
    resolver: zodResolver(bomFormSchema),
    defaultValues: {
      recipeType: "Item Recipe",
      items: [{ recipe_product: "", quantity: 1, unit: "Nos" }],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    async function fetchData() {
        if (!company_id) return;
        try {
            const [productsResponse, recipesResponse] = await Promise.all([
                fetcher(`https://server-erp.payshia.com/products/get/filter/recipe-type?recipe_type=item_recipe&company_id=${company_id}`),
                fetcher('https://server-erp.payshia.com/product-recipes'),
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

  const allSkus = React.useMemo(() => {
    return products.flatMap(p => 
        (p.variants || []).map(v => ({
            label: `${p.product.name} (${v.variant.sku})`,
            value: v.variant.id,
            productId: p.product.id,
            name: p.product.name.toLowerCase()
        }))
    );
  }, [products]);

  const finishedGoodId = form.watch("productId");
  // The user prompt indicates `quantity` might be on the main form, but it's not in the schema.
  // Assuming they mean the quantity of ingredients to calculate. Let's assume a production of 1 for now.
  const quantityProduced = 1;

  useEffect(() => {
    const recipe = recipes.find(r => r.finished_good_id === finishedGoodId) || null;
    setSelectedRecipe(recipe);
  }, [finishedGoodId, recipes]);

  const finishedGoodsOptions = React.useMemo(() => {
    return products
      .flatMap(p => (p.variants || []).map(v => ({
        label: `${p.product.name} (${v.variant.sku})`,
        value: v.variant.id,
      })));
  }, [products]);
  
  const requiredIngredients = React.useMemo(() => {
      if (!selectedRecipe) return [];
      return selectedRecipe.items.map(item => {
          const ingredientProduct = products.flatMap(p => p.variants.map(v => ({...v, productName: p.product.name}))).find(v => v.variant.id === item.ingredient_id);
          return {
              name: ingredientProduct?.productName || 'Unknown Ingredient',
              sku: ingredientProduct?.variant.sku || 'N/A',
              requiredQty: item.quantity * (quantityProduced || 1),
              unit: item.unit,
          }
      });
  }, [selectedRecipe, quantityProduced, products]);

  async function onSubmit(data: BomFormValues) {
    setIsLoading(true);

    const finishedGoodVariantId = data.productId;
    const finishedGoodProduct = allSkus.find(sku => sku.value === finishedGoodVariantId);

    if (!finishedGoodProduct || !company_id) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find finished good product details.' });
        setIsLoading(false);
        return;
    }

    try {
        for (const item of data.items) {
            const payload = {
                company_id: company_id,
                main_product: parseInt(finishedGoodProduct.productId, 10),
                product_variant_id: parseInt(finishedGoodVariantId, 10),
                recipe_product: item.recipe_product,
                qty: item.quantity,
                recipe_type: data.recipeType === 'A La Carte' ? 'ala cart' : 'item_recipe',
                created_by: "admin",
                created_at: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            };

            const response = await fetcher('https://server-erp.payshia.com/product-recipes', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'An error occurred while saving the recipe.');
            }
        }
        
        toast({
          title: "Bill of Materials Saved!",
          description: "The recipe has been successfully created.",
        });
        
        router.push('/production/bom');
        router.refresh();

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({ variant: 'destructive', title: 'Submission Failed', description: errorMessage });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-nowrap">
              Create Bill of Materials
            </h1>
            <p className="text-muted-foreground">
              Define the recipe or components for a finished product.
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
              Save BOM
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recipe Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Finished Good</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a finished product" />
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
              name="recipeType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Recipe Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex items-center space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Item Recipe" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Item Recipe
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="A La Carte" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          A La Carte
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Ingredients / Raw Materials</CardTitle>
                <CardDescription>Add all the components required to make this item.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">Ingredient Name</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {fields.map((field, index) => (
                           <TableRow key={field.id}>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.recipe_product`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="Enter raw material name or ID" {...field} />
                                                </FormControl>
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
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                 <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.unit`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Unit" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Nos">Nos (Numbers)</SelectItem>
                                                        <SelectItem value="KG">KG (Kilogram)</SelectItem>
                                                        <SelectItem value="Gram">Gram</SelectItem>
                                                        <SelectItem value="Litre">Litre</SelectItem>
                                                        <SelectItem value="ml">ml (Millilitre)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </TableCell>
                           </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ recipe_product: '', quantity: 1, unit: 'Nos' })} className="mt-4">
                    Add Ingredient
                </Button>
            </CardContent>
        </Card>
      </form>
    </Form>
  );
}
