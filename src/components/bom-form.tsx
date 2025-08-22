
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

interface ProductWithVariants {
    product: Product;
    variants: ProductVariant[];
}

const recipeItemSchema = z.object({
  ingredientId: z.string().min(1, "Ingredient is required."),
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
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const { company_id } = useLocation();

  const form = useForm<BomFormValues>({
    resolver: zodResolver(bomFormSchema),
    defaultValues: {
      recipeType: "Item Recipe",
      items: [{ ingredientId: "", quantity: 1, unit: "Nos" }],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    async function fetchProducts() {
      if (!company_id) return;
      try {
        const response = await fetch(`https://server-erp.payshia.com/products/with-variants?company_id=${company_id}`);
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch products.' });
      }
    }
    fetchProducts();
  }, [company_id, toast]);

  const allSkus = React.useMemo(() => {
    return products.flatMap(p => 
        p.variants.map(v => ({
            label: `${p.product.name} (${v.sku})`,
            value: v.id,
        }))
    );
  }, [products]);

  async function onSubmit(data: BomFormValues) {
    setIsLoading(true);
    console.log(data);
    toast({
      title: "Work in Progress",
      description: "Saving Bill of Materials is not yet implemented.",
    });
    // In a real app, you would send this to your backend
    // For now, we just log it.
    setIsLoading(false);
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
                            {allSkus.map(sku => (
                                <SelectItem key={sku.value} value={sku.value}>{sku.label}</SelectItem>
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
                            <TableHead className="w-[40%]">Ingredient</TableHead>
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
                                        name={`items.${index}.ingredientId`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select an ingredient" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {allSkus.map(sku => (
                                                            <SelectItem key={sku.value} value={sku.value}>{sku.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
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
                <Button type="button" variant="outline" size="sm" onClick={() => append({ ingredientId: '', quantity: 1, unit: 'Nos' })} className="mt-4">
                    Add Ingredient
                </Button>
            </CardContent>
        </Card>
      </form>
    </Form>
  );
}
