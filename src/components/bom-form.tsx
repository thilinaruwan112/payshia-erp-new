
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
import type { Product, ProductVariant } from "@/lib/types";
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

const recipeItemSchema = z.object({
  recipe_product: z.string().min(1, "Ingredient is required."),
  quantity: z.coerce.number().min(0.001, "Quantity must be greater than 0."),
  unit: z.string().min(1, "Unit is required."),
});

const bomFormSchema = z.object({
  productId: z.string().min(1, "Finished good is required."),
  items: z.array(recipeItemSchema).min(1, "At least one ingredient is required."),
  notes: z.string().optional(),
});

type BomFormValues = z.infer<typeof bomFormSchema>;

export function BomForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
  const { company_id } = useLocation();
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [selectedRecipeItems, setSelectedRecipeItems] = useState<RecipeItem[]>([]);
  const [ingredients, setIngredients] = useState<ProductWithApiResponse[]>([]);

  const form = useForm<BomFormValues>({
    resolver: zodResolver(bomFormSchema),
    defaultValues: {
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
        setIsLoading(true);
        try {
            const [productsResponse, recipesResponse] = await Promise.all([
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${company_id}`),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-recipes`),
            ]);

            if (!productsResponse.ok) throw new Error("Failed to fetch products");
            const productsData = await productsResponse.json();
            const allProducts = productsData.products || [];
            
            // Separate finished goods and ingredients
            setProducts(allProducts.filter((p: ProductWithApiResponse) => p.product.item_type !== 'raw'));
            setIngredients(allProducts.filter((p: ProductWithApiResponse) => ['raw', 'both'].includes(p.product.item_type || '')));


            if(!recipesResponse.ok) throw new Error("Failed to fetch recipes");
            const recipesData = await recipesResponse.json();
            setRecipes(Array.isArray(recipesData.data) ? recipesData.data : []);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch required data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [company_id, toast]);

 const allSkus = React.useMemo(() => {
    if (!ingredients) return [];
    return ingredients.flatMap(p => 
        (p.variants || []).map(v => {
            if (!v.variant) return null; // Guard clause
            return {
                label: `${p.product.name} (${v.variant.sku})`,
                value: v.variant.id,
                stock_unit: p.product.stock_unit || 'Nos'
            }
        }).filter(Boolean)
    );
  }, [ingredients]);


  const finishedGoodId = form.watch("productId");
  const quantityProduced = 1;

  useEffect(() => {
    const items = recipes.filter(r => r.product_variant_id === finishedGoodId) || [];
    setSelectedRecipeItems(items);
  }, [finishedGoodId, recipes]);

  const finishedGoodsOptions = React.useMemo(() => {
    return products
      .flatMap(p => 
          (p.variants || []).map(v => ({ product: p.product, variant: v.variant }))
      )
      .filter((pv): pv is { product: Product, variant: { id: string, sku: string } } => !!pv.variant?.id && !!pv.variant.sku)
      .map(pv => ({
          label: `${pv.product.name} (${pv.variant.sku})`,
          value: pv.variant.id,
      }));
  }, [products]);
  
  const requiredIngredients = React.useMemo(() => {
      if (selectedRecipeItems.length === 0) return [];
      
      const allIngredientsInfo = ingredients.flatMap(p => 
        (p.variants || []).map(v => {
          if (!v.variant) return null;
          return {
            id: v.variant.id,
            name: p.product.name,
            sku: v.variant.sku,
            unit: p.product.stock_unit || 'Nos'
          }
        }).filter(Boolean)
      );

      return selectedRecipeItems.map(item => {
          const ingredientInfo = allIngredientsInfo.find(ing => ing && ing.id === item.recipe_product);
          return {
              name: ingredientInfo?.name || `Product ID: ${item.recipe_product}`,
              sku: ingredientInfo?.sku || 'N/A',
              requiredQty: parseFloat(item.qty) * (quantityProduced || 1),
              unit: ingredientInfo?.unit || 'Nos',
          }
      });
  }, [selectedRecipeItems, quantityProduced, ingredients]);

  async function onSubmit(data: BomFormValues) {
    setIsLoading(true);

    const finishedGoodVariantId = data.productId;
    const finishedGoodProductInfo = products.flatMap(p => (p.variants || []).map(v => ({...v.variant, productId: p.product.id}))).find(v => v.id === finishedGoodVariantId);


    if (!finishedGoodProductInfo || !company_id) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find finished good product details.' });
        setIsLoading(false);
        return;
    }

    try {
        for (const item of data.items) {
            const payload = {
                company_id: company_id,
                main_product: parseInt(finishedGoodProductInfo.productId, 10),
                product_variant_id: parseInt(finishedGoodVariantId, 10),
                recipe_product: item.recipe_product,
                qty: item.quantity,
                recipe_type: 'item_recipe',
                created_by: "admin",
                created_at: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            };

            const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-recipes`, {
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
                                                    <Combobox
                                                        options={allSkus}
                                                        value={field.value}
                                                        onChange={(value) => {
                                                            field.onChange(value);
                                                            const selectedSku = allSkus.find(s => s.value === value);
                                                            form.setValue(`items.${index}.unit`, selectedSku?.stock_unit || 'Nos');
                                                        }}
                                                        placeholder="Select an ingredient..."
                                                        notFoundText="No ingredient found."
                                                    />
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
                                                <FormControl>
                                                    <Input {...field} readOnly disabled className="bg-muted" />
                                                </FormControl>
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
