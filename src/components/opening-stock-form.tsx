
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Product, ProductVariant } from "@/lib/types";
import { Loader2, Trash2, CalendarIcon } from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "./location-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "./ui/table";
import { fetcher } from "@/lib/api";
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { Combobox } from "./ui/combobox";

interface ProductWithApiResponse {
  product: Product;
  variants: { variant: ProductVariant }[];
}

const openingStockItemSchema = z.object({
  productVariantId: z.string().min(1, "Item is required."),
  quantity: z.coerce.number().min(0, "Quantity must be a positive number.").default(0),
  batchNumber: z.string().optional(),
  expiryDate: z.date().optional(),
  cost_value: z.coerce.number().optional(),
});

const openingStockFormSchema = z.object({
  items: z.array(openingStockItemSchema).min(1, { message: "Please add at least one item." }),
});

type OpeningStockFormValues = z.infer<typeof openingStockFormSchema>;

export function OpeningStockForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
  const { company_id, currentLocation } = useLocation();

  const form = useForm<OpeningStockFormValues>({
    resolver: zodResolver(openingStockFormSchema),
    defaultValues: {
      items: [{ productVariantId: "", quantity: 0, batchNumber: "" }],
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

  const allSkus = useMemo(() => {
    return products.flatMap(p =>
      (p.variants || []).map(v => ({
        label: `${p.product.name} (${v.variant.sku})`,
        value: v.variant.id,
        productId: p.product.id,
        costPrice: v.variant.cost_price ? parseFloat(String(v.variant.cost_price)) : 0,
      }))
    );
  }, [products]);

  async function onSubmit(data: OpeningStockFormValues) {
    if (!currentLocation || !company_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'No location or company selected.' });
      return;
    }
    setIsSubmitting(true);
    const itemsWithStock = data.items.filter(item => item.quantity > 0);

    if (itemsWithStock.length === 0) {
      toast({ variant: 'destructive', title: 'No stock entered', description: 'Please enter a quantity for at least one item.' });
      setIsSubmitting(false);
      return;
    }

    const payload = {
      company_id: company_id,
      location_id: parseInt(currentLocation.location_id, 10),
      created_by: "admin",
      current_time: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      items: itemsWithStock.map(item => {
        const skuDetails = allSkus.find(s => s.value === item.productVariantId);
        return {
            product_id: parseInt(skuDetails!.productId, 10),
            product_variant_id: parseInt(item.productVariantId, 10),
            cost_value: item.cost_value || 0,
            quantity: item.quantity,
            patch_code: item.batchNumber || `OPEN-${skuDetails?.label.split('(')[1].replace(')','')}`,
            expire_date: item.expiryDate ? format(item.expiryDate, 'yyyy-MM-dd') : undefined,
        }
      }),
    };

    try {
      const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/opening-stock`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save opening stock.');
      }

      toast({
        title: "Opening Stock Saved",
        description: "The initial stock levels have been successfully recorded.",
      });
      router.push('/inventory/dashboard');
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
        <Card>
          <CardHeader>
            <CardTitle>Enter Opening Stock</CardTitle>
            <CardDescription>
              Input the initial stock for your products at the current location: <strong>{currentLocation?.location_name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Batch No.</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.productVariantId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Combobox
                                    options={allSkus}
                                    value={field.value}
                                    onChange={(value) => {
                                        field.onChange(value);
                                        const selectedSku = allSkus.find(s => s.value === value);
                                        form.setValue(`items.${index}.cost_value`, selectedSku?.costPrice || 0);
                                        form.setValue(`items.${index}.batchNumber`, `OPEN-${selectedSku?.label.split('(')[1].replace(')','')}`);
                                    }}
                                    placeholder="Select a product..."
                                    notFoundText="No product found."
                                    disabled={isLoading}
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
                                            <Input type="number" {...field} className="w-24" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </TableCell>
                        <TableCell>
                            <FormField
                                control={form.control}
                                name={`items.${index}.batchNumber`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </TableCell>
                        <TableCell>
                            <FormField
                                control={form.control}
                                name={`items.${index}.expiryDate`}
                                render={({ field }) => (
                                    <FormItem>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" className={cn("w-[180px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                                        </Popover>
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
            </div>
             <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ productVariantId: "", quantity: 0, batchNumber: "" })}
                className="mt-4"
                >
                Add Item
            </Button>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Opening Stock
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
