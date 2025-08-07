
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
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import type { GoodsReceivedNote, Supplier, Product, ProductVariant, GrnItem } from "@/lib/types";
import { Loader2, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import React, { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import { useCurrency } from "./currency-provider";


const returnItemSchema = z.object({
  grnItemId: z.string(),
  productId: z.string(),
  productVariantId: z.string(),
  productName: z.string(),
  receivedQty: z.number(),
  unitPrice: z.number(),
  returnQty: z.coerce.number().min(0, "Return quantity cannot be negative."),
  reason: z.string().min(1, "Reason is required."),
}).refine(data => data.returnQty <= data.receivedQty, {
    message: "Return quantity cannot exceed received quantity.",
    path: ["returnQty"],
});

const returnFormSchema = z.object({
  grnId: z.string(),
  supplierId: z.string(),
  returnDate: z.date(),
  notes: z.string().optional(),
  items: z.array(returnItemSchema).min(1, "At least one item must be included in the return.").refine(items => items.some(item => item.returnQty > 0), { message: "You must return at least one item."}),
});

type ReturnFormValues = z.infer<typeof returnFormSchema>;

export function SupplierReturnForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  const grnId = searchParams.get('grnId');

  const [grn, setGrn] = useState<GoodsReceivedNote | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<ReturnFormValues>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
        items: [],
        notes: '',
        returnDate: new Date(),
    },
    mode: "onChange",
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    async function fetchGrnData() {
        if (!grnId) {
            toast({ variant: 'destructive', title: 'No GRN ID provided.' });
            setIsLoading(false);
            return;
        }

        try {
            const [grnResponse, suppliersResponse, productsResponse] = await Promise.all([
                 fetch(`https://server-erp.payshia.com/grn/${grnId}`),
                 fetch('https://server-erp.payshia.com/suppliers'),
                 fetch('https://server-erp.payshia.com/products/with-variants'),
            ]);
            
            if (!grnResponse.ok) throw new Error('Failed to fetch GRN data');
            const grnData: GoodsReceivedNote = await grnResponse.json();
            const suppliersData: Supplier[] = await suppliersResponse.json();
            const productsData: { products: { product: Product, variants: ProductVariant[] }[] } = await productsResponse.json();

            setGrn(grnData);
            setSupplier(suppliersData.find(s => s.supplier_id === grnData.supplier_id) || null);
            setProducts(productsData.products.map(p => ({...p.product, variants: p.variants})));
            
            form.setValue('grnId', grnData.id);
            form.setValue('supplierId', grnData.supplier_id);
            
            const itemsForForm = grnData.items?.map(item => {
                const product = productsData.products.find(p => p.product.id === String(item.product_id));
                const variant = product?.variants.find(v => v.id === String(item.product_variant_id));
                const productName = `${product?.product.name} ${variant?.sku ? `(${variant.sku})` : ''}`
                return {
                    grnItemId: String(item.id),
                    productId: String(item.product_id),
                    productVariantId: String(item.product_variant_id),
                    productName: productName,
                    receivedQty: parseFloat(item.received_qty),
                    unitPrice: parseFloat(String(item.order_rate)),
                    returnQty: 0,
                    reason: '',
                }
            }) || [];
            
            replace(itemsForForm);

        } catch (error) {
             toast({ variant: 'destructive', title: 'Failed to load GRN Data' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchGrnData();
  }, [grnId, toast, form, replace]);

  function onSubmit(data: ReturnFormValues) {
    console.log(data);
    toast({
        title: "Return Created (Simulated)",
        description: `Supplier return for GRN ${grn?.grn_number} has been processed.`,
    });
    router.push('/suppliers/returns');
  }

  const watchedItems = form.watch("items");
  const totalReturnValue = watchedItems.reduce((acc, item) => acc + (item.returnQty * item.unitPrice), 0);
  
  if (isLoading) {
    return <Card><CardContent><Skeleton className="h-96 w-full" /></CardContent></Card>
  }
  
  if (!grn) {
      return <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent>Could not load GRN data.</CardContent></Card>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">New Supplier Return</h1>
                <p className="text-muted-foreground">Return items from GRN #{grn.grn_number} to {supplier?.supplier_name}</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full">Cancel</Button>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Return
                </Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Items to Return</CardTitle>
                <CardDescription>Enter the quantity and reason for each item you want to return.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="w-[200px]">Reason</TableHead>
                            <TableHead className="text-right">Received</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="w-[150px] text-right">Return Qty</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell className="font-medium">{watchedItems[index].productName}</TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.reason`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="e.g. Damaged" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell className="text-right">{watchedItems[index].receivedQty}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{watchedItems[index].unitPrice.toFixed(2)}</TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.returnQty`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input type="number" {...field} className="text-right" />
                                                </FormControl>
                                                 <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                         <TableRow>
                            <TableCell colSpan={4} className="text-right font-bold">Total Return Value</TableCell>
                            <TableCell className="text-right font-bold font-mono">{currencySymbol}{totalReturnValue.toFixed(2)}</TableCell>
                         </TableRow>
                    </TableFooter>
                </Table>
            </CardContent>
        </Card>
      </form>
    </Form>
  )
}
