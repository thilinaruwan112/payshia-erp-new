
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Product, ProductVariant, StockInfo } from "@/lib/types";
import { Loader2, Trash2, CalendarIcon } from "lucide-react";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation } from "./location-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "./ui/table";
import { fetcher } from "@/lib/api";
import { format } from "date-fns";
import { Combobox } from "./ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "./ui/scroll-area";


interface ProductWithApiResponse {
    product: Product & { brand_name?: string };
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
  locationId: z.string().min(1, "Location is required."),
  date: z.date(),
  items: z.array(openingStockItemSchema).min(1, { message: "Please add at least one item." }),
});

type OpeningStockFormValues = z.infer<typeof openingStockFormSchema>;

interface OpeningStockFormProps {
    children: React.ReactNode;
    onStockAdded: () => void;
}

export function OpeningStockForm({ children, onStockAdded }: OpeningStockFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
  const { company_id, availableLocations } = useLocation();

  const form = useForm<OpeningStockFormValues>({
    resolver: zodResolver(openingStockFormSchema),
    defaultValues: {
      items: [{ productVariantId: "", quantity: 0, batchNumber: "" }],
      date: new Date(),
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
    if (isOpen) {
        fetchProducts();
    }
  }, [isOpen, company_id, toast]);

  const allSkus = useMemo(() => {
    return products.flatMap(p =>
      (p.variants || []).map(v => ({
        label: `${p.product.name} (${v.variant.sku})`,
        value: v.variant.id,
        productId: p.product.id,
        brandName: p.product.brand_name || 'N/A',
        costPrice: v.variant.cost_price ? parseFloat(String(v.variant.cost_price)) : 0,
      }))
    );
  }, [products]);

  async function onSubmit(data: OpeningStockFormValues) {
    if (!company_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'No company selected.' });
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
      location_id: parseInt(data.locationId, 10),
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
            expire_date: item.expiryDate ? format(item.expiryDate, 'yyyy-MM-dd') : '0000-00-00',
            transaction_type: 'OPENING_STOCK',
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
        if (response.status === 409) {
          toast({
            variant: "destructive",
            title: errorData.error,
            description: errorData.message,
          });
        } else {
            throw new Error(errorData.message || 'Failed to save opening stock.');
        }
      } else {
         toast({
            title: "Opening Stock Saved",
            description: "The initial stock levels have been successfully recorded.",
        });
        setIsOpen(false);
        form.reset();
        onStockAdded();
      }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({ variant: 'destructive', title: 'Submission Failed', description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
            <DialogTitle>New Opening Stock</DialogTitle>
             <DialogDescription>
                Set the initial inventory levels for your products at a specific location.
            </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="locationId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a location" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {availableLocations.map(loc => (
                                <SelectItem key={loc.location_id} value={loc.location_id}>{loc.location_name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                            <Input readOnly disabled value={format(field.value, "PPP")} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <ScrollArea className="h-72 border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="w-[40%]">Product</TableHead>
                             <TableHead>Brand</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Batch No.</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {fields.map((field, index) => {
                             const selectedVariantId = form.watch(`items.${index}.productVariantId`);
                             const brandName = allSkus.find(sku => sku.value === selectedVariantId)?.brandName || '';
                            return (
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
                                    <Input value={brandName} readOnly disabled className="bg-muted border-none" />
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
                                        <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        </TableBody>
                    </Table>
                </ScrollArea>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ productVariantId: "", quantity: 0, batchNumber: "" })}
                    className="mt-4"
                    >
                    Add Item
                </Button>
                <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Opening Stock
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
