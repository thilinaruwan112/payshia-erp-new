
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
import { Loader2, Trash2, CalendarIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation } from "./location-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

interface ProductWithVariants {
    product: Product;
    variants: ProductVariant[];
}

const openingStockItemSchema = z.object({
  productVariantId: z.string(),
  productName: z.string(),
  sku: z.string(),
  quantity: z.coerce.number().min(0, "Quantity must be a positive number.").default(0),
  batchNumber: z.string().optional(),
  expiryDate: z.date().optional(),
});

const openingStockFormSchema = z.object({
  productId: z.string().min(1, "Please select a product."),
  items: z.array(openingStockItemSchema),
});

type OpeningStockFormValues = z.infer<typeof openingStockFormSchema>;

export function OpeningStockForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const { company_id, currentLocation } = useLocation();

  const form = useForm<OpeningStockFormValues>({
    resolver: zodResolver(openingStockFormSchema),
    defaultValues: {
      items: [],
    },
    mode: "onChange",
  });
  
  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const productId = form.watch("productId");

  useEffect(() => {
    async function fetchProducts() {
      if (!company_id) return;
      setIsLoading(true);
      try {
        const response = await fetch(`https://server-erp.payshia.com/products/with-variants?company_id=${company_id}`);
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
  
  useEffect(() => {
      const selectedProduct = products.find(p => p.product.id === productId);
      if (selectedProduct) {
          const variants = selectedProduct.variants.map(v => ({
              productVariantId: v.id,
              productName: selectedProduct.product.name,
              sku: v.sku,
              quantity: 0,
              batchNumber: `OPEN-${v.sku}`,
              expiryDate: undefined,
          }));
          replace(variants);
      } else {
          replace([]);
      }

  }, [productId, products, replace]);


  async function onSubmit(data: OpeningStockFormValues) {
    if (!currentLocation || !company_id) {
        toast({ variant: 'destructive', title: 'Error', description: 'No location or company selected.' });
        return;
    }
    setIsSubmitting(true);
    const itemsWithStock = data.items.filter(item => item.quantity > 0);

    if (itemsWithStock.length === 0) {
        toast({ variant: 'destructive', title: 'No stock entered', description: 'Please enter a quantity for at least one variant.' });
        setIsSubmitting(false);
        return;
    }
    
    const stockEntries = itemsWithStock.map(item => ({
        type: "IN",
        quantity: item.quantity,
        patch_code: item.batchNumber || `OPEN-${item.sku}`,
        manufacture_date: format(new Date(), 'yyyy-MM-dd'),
        expire_date: item.expiryDate ? format(item.expiryDate, 'yyyy-MM-dd') : '0000-00-00',
        product_id: parseInt(data.productId, 10),
        reference: "Opening Stock",
        location_id: parseInt(currentLocation.location_id, 10),
        created_by: "admin",
        is_active: "1",
        ref_id: "N/A",
        company_id: company_id,
        transaction_type: "opening_stock",
        product_variant_id: parseInt(item.productVariantId, 10),
    }));

    try {
        const response = await fetch('https://server-erp.payshia.com/stock-entries/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries: stockEntries }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save opening stock.');
        }

        toast({
            title: "Opening Stock Saved",
            description: "The initial stock levels have been successfully recorded.",
        });
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
            <CardTitle>Select Product</CardTitle>
            <CardDescription>Choose a product to set its initial inventory levels for the current location: <strong>{currentLocation?.location_name}</strong></CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem className="max-w-md">
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.product.id} value={p.product.id}>{p.product.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        {fields.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Enter Variant Quantities</CardTitle>
                    <CardDescription>Input the opening stock for each product variant.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Variant (SKU)</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Batch No.</TableHead>
                                    <TableHead>Expiry Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.map((field, index) => (
                                    <TableRow key={field.id}>
                                        <TableCell className="font-medium">{field.productName} ({field.sku})</TableCell>
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
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Opening Stock
                    </Button>
                </CardFooter>
            </Card>
        )}

      </form>
    </Form>
  );
}
