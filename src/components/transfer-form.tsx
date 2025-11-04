
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import type { Location, Product, ProductVariant, RequisitionNote } from "@/lib/types";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { addDays, format, parse } from "date-fns";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCurrency } from "./currency-provider";
import { useLocation } from "./location-provider";
import { fetcher } from "@/lib/api";

interface StockInfo {
    product_id: string;
    product_variant_id: string;
    patch_code: string;
    expire_date: string;
    total_in: string;
    total_out: string;
    stock_balance: string;
    manufacture_date?: string; // Adding this for payload consistency
}

interface ProductWithApiResponse {
  product: Product;
  variants: { variant: ProductVariant }[];
}

const transferItemSchema = z.object({
  sku: z.string().min(1, "Product is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  // This will store the JSON string of the selected batch
  selectedBatch: z.string().min(1, "A batch must be selected."),
});

const transferFormSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  fromLocationId: z.string().min(1, "Source location is required."),
  toLocationId: z.string().min(1, "Destination location is required."),
  items: z.array(transferItemSchema).min(1, "At least one item is required."),
}).refine(data => data.fromLocationId !== data.toLocationId, {
    message: "Source and destination locations cannot be the same.",
    path: ["toLocationId"],
});


type TransferFormValues = z.infer<typeof transferFormSchema>;


interface TransferFormProps {
    locations: Location[];
}

export function TransferForm({ locations }: TransferFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { company_id } = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const { currencySymbol } = useCurrency();
  const [productsWithVariants, setProductsWithVariants] = React.useState<ProductWithApiResponse[]>([]);
  const [availableBatches, setAvailableBatches] = React.useState<Record<number, StockInfo[]>>({});

  React.useEffect(() => {
    async function fetchProducts() {
        try {
            if (!company_id) return;
            const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${company_id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            const data = await response.json();
            setProductsWithVariants(data.products || []);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch product data.' });
        }
    }
    fetchProducts();
  }, [company_id, toast]);

  const allSkus = React.useMemo(() => {
    return productsWithVariants.flatMap(p => 
        (p.variants || []).map(v => ({
            label: `${p.product.name} (${v.variant.sku})`,
            value: v.variant.sku,
            productId: p.product.id,
            variantId: v.variant.id,
            costPrice: p.product.cost_price,
            sellingPrice: p.product.price,
        }))
    );
  }, [productsWithVariants]);
  
  const defaultValues: Partial<TransferFormValues> = {
    date: new Date(),
    fromLocationId: "",
    toLocationId: "",
    items: [
        { sku: '', quantity: 1, selectedBatch: '' },
    ],
  };

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues,
    mode: "onChange",
  });
  
  const { reset } = form;

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const fromLocationId = form.watch("fromLocationId");
  const watchedItems = form.watch("items");
  const noteId = searchParams.get('noteId');

  const handleProductSelect = useCallback(async (sku: string, index: number, locationForStock: string) => {
    if (!locationForStock) {
        toast({
            variant: 'destructive',
            title: 'No Source Location',
            description: 'Please select a source location first.'
        });
        return;
    }
    const skuDetails = allSkus.find(s => s.value === sku);
    if (!skuDetails || !company_id) return;

    try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stock-entries/summary?company_id=${company_id}&product_id=${skuDetails.productId}&product_variant_id=${skuDetails.variantId}&location_id=${locationForStock}`);
        if (!response.ok) {
            throw new Error('Failed to fetch stock for this product.');
        }
        const data = await response.json();
        const batches = data.grouped_by_expire_date.filter((b: StockInfo) => parseFloat(b.stock_balance) > 0);
        setAvailableBatches(prev => ({ ...prev, [index]: batches }));
        form.setValue(`items.${index}.selectedBatch`, '');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({ variant: 'destructive', title: 'Error fetching stock', description: errorMessage });
    }
  }, [company_id, allSkus, form, toast]);

  useEffect(() => {
    async function loadRequisitionData() {
        if (!noteId || !company_id || allSkus.length === 0 || locations.length === 0) return;
        
        toast({ title: 'Loading requisition data...', description: `Fetching details for Note ID ${noteId}`});

        try {
            const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/transaction-notes/${noteId}`);
            if (!response.ok) throw new Error('Could not find the requisition note.');
            
            const requisitionData: RequisitionNote = await response.json();
            
            const fromLocationId = requisitionData.from_location;
            const toLocationId = requisitionData.to_location;

            // Trim whitespace and convert to lowercase for comparison
            const findLocationIdByName = (name: string) => {
                const found = locations.find(loc => loc.location_name.trim().toLowerCase() === name.trim().toLowerCase());
                return found ? found.location_id : null;
            }

            const sourceId = findLocationIdByName(fromLocationId);
            const destId = findLocationIdByName(toLocationId);

            if (!sourceId || !destId) {
                throw new Error("Could not match locations from the requisition note.");
            }

            const newItems = requisitionData.items.map(item => {
                const skuDetails = allSkus.find(s => s.variantId === item.product_variant_id);
                return {
                    sku: skuDetails?.value || '',
                    quantity: parseFloat(item.quantity),
                    selectedBatch: '',
                };
            });
            
            reset({
              date: new Date(requisitionData.note_date),
              fromLocationId: sourceId,
              toLocationId: destId,
              items: newItems,
            });

            // Trigger batch fetching for all loaded items
            newItems.forEach((item, index) => {
                if (item.sku) handleProductSelect(item.sku, index, sourceId);
            });
            
            router.replace('/transfers/new', undefined);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            toast({ title: "Error loading requisition", description: errorMessage, variant: "destructive" });
        }
    }
    loadRequisitionData();
  }, [noteId, company_id, allSkus, locations, reset, toast, router, handleProductSelect]);


  const transferTotalValue = watchedItems.reduce((total, item) => {
    const skuDetails = allSkus.find(s => s.value === item.sku);
    const costPrice = skuDetails?.costPrice;
    const quantity = Number(item.quantity) || 0;
    return total + (parseFloat(String(costPrice)) * quantity);
  }, 0);

  async function onSubmit(data: TransferFormValues) {
    if (!company_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'No company selected.' });
      return;
    }
    setIsLoading(true);

    const payload = {
      from_location: data.fromLocationId,
      to_location: data.toLocationId,
      transfer_date: format(data.date, 'yyyy-MM-dd'),
      status: 'pending',
      company_id: company_id,
      created_by: "admin", 
      transfer_note_id: noteId || null,
      items: data.items.map(item => {
        const batchInfo: StockInfo = JSON.parse(item.selectedBatch);
        const skuDetails = allSkus.find(s => s.value === item.sku);
        return {
            product_id: parseInt(batchInfo.product_id),
            product_variant_id: parseInt(skuDetails!.variantId),
            quantity: item.quantity,
            patch_code: batchInfo.patch_code,
            expire_date: batchInfo.expire_date
        }
      })
    };

    try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stock-transfers`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create stock transfer.');
        }

        toast({
            title: "Stock Transfer Created",
            description: `The transfer has been initiated successfully.`,
        });
        router.push('/transfers');
        router.refresh();

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: "destructive",
            title: "Failed to create transfer",
            description: errorMessage,
        });
    } finally {
        setIsLoading(false);
        setIsConfirmOpen(false);
    }
  }

  const handleCreateTransferClick = () => {
     form.handleSubmit(() => setIsConfirmOpen(true))();
  };
  
  const fromLocation = locations.find(l => l.location_id === form.getValues().fromLocationId);
  const toLocation = locations.find(l => l.location_id === form.getValues().toLocationId);

  return (
    <>
      <Form {...form}>
        <form onSubmit={(e) => { e.preventDefault(); handleCreateTransferClick(); }} className="space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                   <h1 className="text-3xl font-bold tracking-tight text-nowrap">New Stock Transfer</h1>
                   <p className="text-muted-foreground">Move stock between your locations.</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button variant="outline" type="button" onClick={() => router.back()} className="w-full">Cancel</Button>
                  <Button type="submit" className="w-full">Create Transfer</Button>
              </div>
          </div>

          <Card>
              <CardHeader>
                  <CardTitle>Transfer Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Date</FormLabel>
                          <Popover>
                              <PopoverTrigger asChild>
                              <FormControl>
                                  <Button
                                  variant={"outline"}
                                  className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                  )}
                                  >
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                              </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                              />
                              </PopoverContent>
                          </Popover>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                   <FormField
                      control={form.control}
                      name="fromLocationId"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>From (Source)</FormLabel>
                              <Select onValueChange={(value) => {
                                  field.onChange(value);
                                  reset({ ...form.getValues(), items: [] });
                                  append({ sku: '', quantity: 1, selectedBatch: '' });
                                  setAvailableBatches({});
                              }} value={field.value}>
                                  <FormControl>
                                      <SelectTrigger>
                                          <SelectValue placeholder="Select source location" />
                                      </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                      {locations.map(loc => (
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
                      name="toLocationId"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>To (Destination)</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                      <SelectTrigger>
                                          <SelectValue placeholder="Select destination location" />
                                      </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                      {locations.map(loc => (
                                          <SelectItem key={loc.location_id} value={loc.location_id}>{loc.location_name}</SelectItem>
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
                  <CardTitle>Items to Transfer</CardTitle>
                  <CardDescription>Add the products and quantities you want to move.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead className="w-[30%]">Product</TableHead>
                              <TableHead className="w-[25%]">Batch / Expiry</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead className="text-right">Total Value</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                           {fields.map((field, index) => {
                              const selectedSku = watchedItems[index]?.sku;
                              const skuDetails = allSkus.find(s => s.value === selectedSku);
                              const costPrice = skuDetails?.costPrice;
                              const quantity = watchedItems[index]?.quantity || 0;
                              const totalValue = parseFloat(String(costPrice)) * quantity;

                              return (
                                 <TableRow key={field.id}>
                                      <TableCell>
                                          <FormField
                                              control={form.control}
                                              name={`items.${index}.sku`}
                                              render={({ field }) => (
                                                  <FormItem>
                                                      <Select onValueChange={(value) => {
                                                          field.onChange(value);
                                                          handleProductSelect(value, index, fromLocationId);
                                                      }} defaultValue={field.value}>
                                                          <FormControl>
                                                              <SelectTrigger>
                                                                  <SelectValue placeholder="Select a product" />
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
                                            name={`items.${index}.selectedBatch`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Select onValueChange={field.onChange} value={field.value} disabled={!availableBatches[index]}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select batch" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {(availableBatches[index] || []).map(batch => (
                                                                <SelectItem key={`${batch.patch_code}-${batch.expire_date}`} value={JSON.stringify(batch)}>
                                                                    {batch.patch_code} (Qty: {batch.stock_balance})
                                                                </SelectItem>
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
                                                          <Input type="number" placeholder="1" {...field} />
                                                      </FormControl>
                                                      <FormMessage />
                                                  </FormItem>
                                              )}
                                          />
                                      </TableCell>
                                      <TableCell className="text-right font-mono">{currencySymbol}{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                      <TableCell>
                                          {fields.length > 1 && (
                                              <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                              </Button>
                                          )}
                                      </TableCell>
                                 </TableRow>
                              )
                           })}
                      </TableBody>
                       <TableFooter>
                          <TableRow>
                              <TableCell colSpan={3} className="text-right font-bold">Total Transfer Value</TableCell>
                              <TableCell className="text-right font-bold font-mono">{currencySymbol}{transferTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                              <TableCell></TableCell>
                          </TableRow>
                      </TableFooter>
                  </Table>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ sku: '', quantity: 1, selectedBatch: '' })} className="mt-4">
                      Add another item
                  </Button>
              </CardContent>
          </Card>
        </form>
      </Form>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Stock Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              Please review the details below before creating the transfer. This action cannot be undone.
              <div className="mt-4 space-y-2 text-sm text-muted-foreground bg-muted p-3 rounded-md border">
                <div><strong>From:</strong> {fromLocation?.location_name}</div>
                <div><strong>To:</strong> {toLocation?.location_name}</div>
                <div><strong>Items:</strong> {watchedItems.length}</div>
                <div><strong>Total Value:</strong> <span className="font-mono">{currencySymbol}{transferTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
