
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Location, Product, ProductVariant } from "@/lib/types";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "./location-provider";
import { Combobox } from "./ui/combobox";
import { fetcher } from "@/lib/api";

interface ProductWithApiResponse {
  product: Product;
  variants: { variant: ProductVariant }[];
}

const requisitionItemSchema = z.object({
  product_id: z.string().min(1, "Product is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  product_variant_id: z.string().min(1, "Variant is required."),
});

const requisitionFormSchema = z.object({
  from_location: z.string().min(1, "Source location is required."),
  to_location: z.string().min(1, "Destination location is required."),
  note_date: z.date({ required_error: "A date is required." }),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  is_active: z.literal(1).default(1),
  items: z.array(requisitionItemSchema).min(1, "At least one item is required."),
});

type RequisitionFormValues = z.infer<typeof requisitionFormSchema>;

interface GoodsRequisitionFormProps {
    locations: Location[];
}

export function GoodsRequisitionForm({ locations }: GoodsRequisitionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { company_id } = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<ProductWithApiResponse[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  const form = useForm<RequisitionFormValues>({
    resolver: zodResolver(requisitionFormSchema),
    defaultValues: {
      note_date: new Date(),
      status: "pending",
      items: [{ product_id: '', product_variant_id: '', quantity: 1 }],
      is_active: 1,
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const fromLocationId = form.watch("from_location");

  useEffect(() => {
    async function fetchProducts() {
      if (!company_id) return;
      setIsLoadingProducts(true);
      try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${company_id}`);
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        setAvailableProducts(data.products || []);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch products.' });
      } finally {
        setIsLoadingProducts(false);
      }
    }
    fetchProducts();
  }, [company_id, toast]);

  const productOptions = useMemo(() => {
    return availableProducts.map(p => ({ value: p.product.id, label: p.product.name }));
  }, [availableProducts]);

  async function onSubmit(data: RequisitionFormValues) {
    if (!company_id) {
        toast({
            variant: "destructive",
            title: "No Company Selected",
            description: "Please select a company before creating a requisition note.",
        });
        return;
    }
    setIsLoading(true);

    const loggedInUserId = localStorage.getItem('userId') || '1';

    const payload = {
      ...data,
      note_date: format(data.note_date, 'yyyy-MM-dd'),
      company_id: company_id,
      created_by: parseInt(loggedInUserId, 10),
      items: data.items.map(item => ({
        ...item,
        product_id: parseInt(item.product_id, 10),
        product_variant_id: parseInt(item.product_variant_id, 10),
        patch_code: 'N/A', // Placeholder, adjust if needed
        expire_date: '2099-12-31', // Placeholder
      })),
    };

    try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/transaction-notes`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || result.message || 'Failed to create requisition note.');
        }
        
        toast({
            title: "Goods Requisition Note Created",
            description: `Note #${result.note_number} has been created successfully.`,
        });
        
        router.push('/inventory/dashboard');
        router.refresh();

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: "destructive",
            title: "Failed to Create Note",
            description: errorMessage,
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">New Goods Requisition Note</h1>
                 <p className="text-muted-foreground">Request items to be transferred from another location.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full" disabled={isLoading}>Cancel</Button>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Note
                </Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Requisition Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="from_location"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>From (Source)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    name="to_location"
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
                <FormField
                    control={form.control}
                    name="note_date"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
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
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Requested Items</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30%]">Product</TableHead>
                             <TableHead className="w-[30%]">Variant</TableHead>
                            <TableHead className="w-[150px]">Quantity</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => {
                            const selectedProductId = form.watch(`items.${index}.product_id`);
                            const productData = availableProducts.find(p => p.product.id === selectedProductId);
                            const variantOptions = (productData?.variants || []).map(v => ({ value: v.variant.id, label: [v.variant.sku, v.variant.color, v.variant.size].filter(Boolean).join(' - ') }));

                            return (
                                <TableRow key={field.id}>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.product_id`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Combobox
                                                        options={productOptions}
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="Select a product..."
                                                        notFoundText="No product found."
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.product_variant_id`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Combobox
                                                        options={variantOptions}
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="Select a variant..."
                                                        notFoundText="No variant found."
                                                        disabled={!selectedProductId}
                                                    />
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
                </Table>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', product_variant_id: '', quantity: 1 })} className="mt-4">
                    Add another item
                </Button>
            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Requisition Note
                </Button>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
