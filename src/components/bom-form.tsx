
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "./ui/table";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { fetcher } from "@/lib/api";
import { format } from "date-fns";
import { Combobox } from "./ui/combobox";
import { useCurrency } from "./currency-provider";

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
    cost_price?: string;
}

const recipeItemSchema = z.object({
  recipe_product: z.string().min(1, "Ingredient is required."),
  quantity: z.coerce.number().min(0.001, "Quantity must be greater than 0."),
  unit: z.string().min(1, "Unit is required."),
  cost_price: z.coerce.number().optional(),
});

const bomFormSchema = z.object({
  productId: z.string().min(1, "Finished good is required."),
  items: z.array(recipeItemSchema).min(1, "At least one ingredient is required."),
  notes: z.string().optional(),
});

type BomFormValues = z.infer<typeof bomFormSchema>;

interface BomData {
    finishedGoodId: string;
    items: {
        recipe_product: string;
        quantity: number;
        unit: string;
        cost_price: number;
    }[];
}

interface BomFormProps {
    bomToEdit?: BomData;
}


export function BomForm({ bomToEdit }: BomFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
  const { company_id } = useLocation();
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [selectedRecipeItems, setSelectedRecipeItems] = useState<RecipeItem[]>([]);
  const [ingredients, setIngredients] = useState<ProductWithApiResponse[]>([]);

  const defaultValues = {
      productId: bomToEdit?.finishedGoodId || "",
      items: bomToEdit?.items || [{ recipe_product: "", quantity: 1, unit: "Nos", cost_price: 0 }],
      notes: ""
  }

  const form = useForm<BomFormValues>({
    resolver: zodResolver(bomFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, append, remove, replace } = useFieldArray({
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
                stock_unit: p.product.stock_unit || 'Nos',
                cost_price: v.variant.cost_price ? parseFloat(String(v.variant.cost_price)) : 0,
            }
        }).filter(Boolean) as { label: string; value: string; stock_unit: string; cost_price: number; }[]
    );
  }, [ingredients]);


  const finishedGoodId = form.watch("productId");
  const quantityProduced = 1;

  useEffect(() => {
    async function fetchRecipe() {
        if (!finishedGoodId || !company_id) {
            setSelectedRecipeItems([]);
            return;
        }

        const selectedProductInfo = products.flatMap(p => (p.variants || []).map(v => ({...v.variant, productId: p.product.id}))).find(v => v.id === finishedGoodId);
        
        if (!selectedProductInfo) return;

        try {
            const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-recipes/get/filter?company_id=${company_id}&main_product=${selectedProductInfo.productId}&product_variant_id=${finishedGoodId}`);
            if (!response.ok) throw new Error('Failed to fetch recipe for the selected product.');
            const data = await response.json();
            setSelectedRecipeItems(data.data || []);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch recipe ingredients.' });
            setSelectedRecipeItems([]);
        }
    }
    if (!bomToEdit) {
      fetchRecipe();
    }
  }, [finishedGoodId, company_id, products, toast, bomToEdit]);

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
      const itemsToDisplay = bomToEdit ? bomToEdit.items.map(i => ({...i, recipe_product: i.recipe_product, qty: String(i.quantity), cost_price: String(i.cost_price) })) : selectedRecipeItems;
      
      if (itemsToDisplay.length === 0) return [];
      
      const allAvailableProducts = [...products, ...ingredients];
      const allIngredientsInfo = allAvailableProducts.flatMap(p => 
        (p.variants || []).map(v => {
          if (!v.variant) return null;
          return {
            id: v.variant.id,
            name: p.product.name,
            sku: v.variant.sku,
            unit: p.product.stock_unit || 'Nos'
          }
        }).filter(Boolean) as { id: string; name: string; sku: string; unit: string; }[]
      );

      return itemsToDisplay.map(item => {
          const ingredientInfo = allIngredientsInfo.find(ing => ing && ing.id === item.recipe_product);
          const requiredQty = parseFloat(item.qty) * (quantityProduced || 1);
          const costPrice = parseFloat(item.cost_price || '0');
          const lineValue = requiredQty * costPrice;
          return {
              name: ingredientInfo?.name || `Product ID: ${item.recipe_product}`,
              sku: ingredientInfo?.sku || 'N/A',
              requiredQty: requiredQty,
              unit: ingredientInfo?.unit || 'Nos',
              costPrice: costPrice,
              lineValue: lineValue,
          }
      });
  }, [selectedRecipeItems, quantityProduced, ingredients, products, bomToEdit]);

  async function onSubmit(data: BomFormValues) {
    setIsSubmitting(true);

    const finishedGoodVariantId = data.productId;
    const finishedGoodProductInfo = products.flatMap(p => (p.variants || []).map(v => ({...v.variant, productId: p.product.id}))).find(v => v.id === finishedGoodVariantId);


    if (!finishedGoodProductInfo || !company_id) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find finished good product details.' });
        setIsSubmitting(false);
        return;
    }
    
     if (bomToEdit) { // This is an edit
      try {
        const recipesResponse = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-recipes/get/filter?company_id=${company_id}&product_variant_id=${finishedGoodVariantId}`);
        if(recipesResponse.ok) {
            const recipesData = await recipesResponse.json();
            const originalRecipeItems: RecipeItem[] = recipesData.data || [];
            for (const item of originalRecipeItems) {
                await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-recipes/${item.id}`, { method: 'DELETE' });
            }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({ variant: 'destructive', title: 'Update Failed', description: `Could not clear old recipe: ${errorMessage}` });
        setIsSubmitting(false);
        return;
      }
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
          title: bomToEdit ? "Bill of Materials Updated!" : "Bill of Materials Saved!",
          description: "The recipe has been successfully saved.",
        });
        
        router.push('/production/saved-bom');
        router.refresh();

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({ variant: 'destructive', title: 'Submission Failed', description: errorMessage });
    } finally {
        setIsSubmitting(false);
    }
  }

  const watchedItems = form.watch('items');
  const grandTotal = watchedItems.reduce((acc, item) => {
    const quantity = item?.quantity || 0;
    const costPrice = item?.cost_price || 0;
    return acc + (quantity * costPrice);
  }, 0);
  
  const pageTitle = bomToEdit ? 'Edit Bill of Materials' : 'Create Bill of Materials';
  const pageDescription = bomToEdit ? 'Modify the ingredients for this finished good.' : 'Define the recipe or components for a finished product.';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-nowrap">
              {pageTitle}
            </h1>
            <p className="text-muted-foreground">
              {pageDescription}
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
              Save BOM
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Finished Good</CardTitle>
                    <CardDescription>Select the item you are creating or editing a recipe for.</CardDescription>
                </CardHeader>
                <CardContent>
                    <FormField
                        control={form.control}
                        name="productId"
                        render={({ field }) => (
                            <FormItem>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!!bomToEdit}>
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
                    <CardTitle>Existing Recipe</CardTitle>
                    <CardDescription>This is the current recipe for the selected item.</CardDescription>
                </CardHeader>
                <CardContent>
                    {requiredIngredients.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ingredient</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Cost</TableHead>
                                    <TableHead className="text-right">Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requiredIngredients.map(ing => (
                                    <TableRow key={ing.sku}>
                                        <TableCell>{ing.name} <span className="text-xs text-muted-foreground">({ing.sku})</span></TableCell>
                                        <TableCell className="text-right font-mono">{ing.requiredQty.toFixed(3)} {ing.unit}</TableCell>
                                        <TableCell className="text-right font-mono">{currencySymbol}{ing.costPrice.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-mono">{currencySymbol}{ing.lineValue.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                             <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={3} className="text-right font-bold">Total Recipe Cost</TableCell>
                                    <TableCell className="text-right font-bold font-mono">
                                        {currencySymbol}
                                        {requiredIngredients.reduce((acc, item) => acc + item.lineValue, 0).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No existing recipe found. Add ingredients below.</p>
                    )}
                </CardContent>
            </Card>
        </div>


         <Card>
            <CardHeader>
                <CardTitle>Add/Update Ingredients</CardTitle>
                <CardDescription>Add all the components required to make this item. This will {bomToEdit ? 'overwrite' : 'define'} the existing recipe.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30%]">Ingredient Name</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Cost Price</TableHead>
                            <TableHead>Total Price</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {fields.map((field, index) => {
                           const quantity = watchedItems[index]?.quantity || 0;
                           const costPrice = watchedItems[index]?.cost_price || 0;
                           const totalPrice = quantity * costPrice;

                           return (
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
                                                            form.setValue(`items.${index}.cost_price`, selectedSku?.cost_price || 0);
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
                                                    <Input {...field} readOnly disabled className="bg-muted border-none" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                 <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.cost_price`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input type="number" {...field} readOnly disabled className="bg-muted border-none text-right" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                    {totalPrice.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </TableCell>
                           </TableRow>
                         )})}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={4} className="text-right font-bold">Grand Total</TableCell>
                        <TableCell className="text-right font-bold font-mono">{grandTotal.toFixed(2)}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableFooter>
                </Table>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ recipe_product: '', quantity: 1, unit: 'Nos', cost_price: 0 })} className="mt-4">
                    Add Ingredient
                </Button>
            </CardContent>
        </Card>
      </form>
    </Form>
  );
}
