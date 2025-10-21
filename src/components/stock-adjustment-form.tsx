
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Product, ProductVariant } from "@/lib/types";
import { Loader2, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation } from "./location-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { fetcher } from "@/lib/api";
import { format } from "date-fns";
import { Textarea } from "./ui/textarea";

interface ProductWithApiResponse {
    product: Product;
    variants: { variant: ProductVariant }[];
}

const adjustmentItemSchema = z.object({
  productVariantId: z.string().min(1, "Product is required."),
  type: z.enum(["IN", "OUT"]),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  reason: z.string().min(3, "Reason is required."),
});

const stockAdjustmentFormSchema = z.object({
  items: z.array(adjustmentItemSchema).min(1, "At least one adjustment item is required."),
});

type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentFormSchema>;

export function StockAdjustmentForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
  const { company_id, currentLocation } = useLocation();

  const form = useForm<StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentFormSchema),
    defaultValues: {
      items: [{ productVariantId: "", type: "OUT", quantity: 1, reason: "" }],
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

  const allSkus = React.useMemo(() => {
    return products.flatMap(p =>
      (p.variants || []).map(v => ({
        label: `${p.product.name} (${v.variant.sku})`,
        value: v.variant.id,
        productId: p.product.id,
      }))
    );
  }, [products]);

  async function onSubmit(data: StockAdjustmentFormValues) {
    if (!currentLocation || !company_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'No location or company selected.' });
      return;
    }
    setIsSubmitting(true);
    
    const stockEntries = data.items.map(item => {
        const skuDetails = allSkus.find(s => s.value === item.productVariantId);
        return {
            type: item.type,
            quantity: item.quantity,
            patch_code: "ADJUSTMENT",
            manufacture_date: format(new Date(), 'yyyy-MM-dd'),
            expire_date: '0000-00-00',
            product_id: parseInt(skuDetails!.productId),
            product_variant_id: parseInt(item.productVariantId),
            reference: item.reason,
            location_id: parseInt(currentLocation.location_id, 10),
            created_by: "admin",
            is_active: "1",
            ref_id: `ADJ-${Date.now()}`,
            company_id: company_id,
            transaction_type: "stock_adjustment",
        }
    });

    try {
      const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stock-entries/bulk`, {
        method: 'POST',
        body: JSON.stringify({ entries: stockEntries }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save stock adjustments.');
      }
      toast({
        title: "Stock Adjustments Saved",
        description: "The stock levels have been successfully updated.",
      });
      router.refresh();
      form.reset();
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
            <CardTitle>Adjustment Details</CardTitle>
            <CardDescription>Add items and specify the adjustment type and quantity.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reason</TableHead>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select an item" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {allSkus.map(item => (
                                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
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
                        name={`items.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="IN">IN (Add Stock)</SelectItem>
                                <SelectItem value="OUT">OUT (Remove Stock)</SelectItem>
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
                            <FormControl><Input type="number" placeholder="1" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                     <TableCell>
                       <FormField
                        control={form.control}
                        name={`items.${index}.reason`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl><Input placeholder="e.g. Damaged Goods" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      {fields.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ productVariantId: "", type: "OUT", quantity: 1, reason: "" })}
                className="mt-4"
                >
                Add another item
            </Button>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Adjustments
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
