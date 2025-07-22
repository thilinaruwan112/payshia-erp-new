
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Product, User, Order } from "@/lib/types";
import { CalendarIcon, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";
import React from "react";

const invoiceFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required."),
  orderId: z.string().optional(),
  invoiceDate: z.date({ required_error: "Invoice date is required." }),
  dueDate: z.date({ required_error: "Due date is required." }),
  status: z.enum(["Draft", "Sent", "Paid"]),
  items: z.array(
    z.object({
      sku: z.string().min(1, "Product is required."),
      quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
      unitPrice: z.coerce.number().min(0, "Unit price must be positive."),
      discount: z.coerce.number().min(0, "Discount must be positive.").optional(),
    })
  ).min(1, "At least one item is required."),
  discount: z.coerce.number().min(0).optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface WholesaleInvoiceFormProps {
    products: Product[];
    customers: User[];
    orders: Order[];
}

export function WholesaleInvoiceForm({ products, customers, orders }: WholesaleInvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const allSkus = products.flatMap(p => p.variants.map(v => ({
      label: `${p.name} (${v.sku})`,
      value: v.sku,
      price: p.wholesalePrice || p.price,
  })));
  
  const defaultValues: Partial<InvoiceFormValues> = {
    invoiceDate: new Date(),
    dueDate: addDays(new Date(), 30),
    status: 'Draft',
    items: [
        { sku: '', quantity: 1, unitPrice: 0, discount: 0 },
    ],
    discount: 0,
  };

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const watchedItems = form.watch("items");
  const customerId = form.watch("customerId");
  const billDiscount = form.watch("discount") || 0;

  const availableOrders = React.useMemo(() => {
    if (!customerId) return [];
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return [];
    return orders.filter(o => o.customerName === customer.name && o.status !== 'Cancelled');
  }, [customerId, customers, orders]);
  
  const handleOrderChange = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        const newItems = order.items.map(item => {
            const product = products.find(p => p.variants.some(v => v.sku === item.sku));
            return {
                sku: item.sku,
                quantity: item.quantity,
                unitPrice: product?.wholesalePrice || product?.price || 0,
                discount: 0,
            }
        });
        form.setValue('orderId', order.id);
        replace(newItems);
    }
  }

  const subtotal = watchedItems.reduce((total, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return total + (quantity * unitPrice);
  }, 0);

  const itemDiscounts = watchedItems.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const discount = Number(item.discount) || 0;
      return total + (quantity * discount);
  }, 0)

  const tax = (subtotal - itemDiscounts) * 0.08; // 8% tax
  const total = subtotal - itemDiscounts - billDiscount + tax;

  function onSubmit(data: InvoiceFormValues) {
    console.log(data);
    toast({
      title: "Wholesale Invoice Created",
      description: `The invoice has been saved.`,
    });
    router.push('/sales/wholesale-invoices');
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">New Wholesale Invoice</h1>
                 <p className="text-muted-foreground">Create a new wholesale invoice for a customer.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full">Cancel</Button>
                <Button type="submit" className="w-full">Save Invoice</Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="customerId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Customer</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a customer" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {customers.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormItem>
                        <FormLabel>From Order (Optional)</FormLabel>
                        <Select onValueChange={handleOrderChange} disabled={!customerId}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an order to populate" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {availableOrders.map(o => (
                                    <SelectItem key={o.id} value={o.id}>{o.id} - ${o.total.toFixed(2)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormItem>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Invoice Settings</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="invoiceDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Invoice Date</FormLabel>
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
                    <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Due Date</FormLabel>
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
                     <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="Sent">Sent</SelectItem>
                                    <SelectItem value="Paid">Paid</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
        </div>


        <Card>
            <CardHeader>
                <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30%]">Product</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {fields.map((field, index) => {
                            const selectedSku = allSkus.find(s => s.value === watchedItems[index]?.sku);
                            const unitPrice = watchedItems[index]?.unitPrice || 0;
                            const quantity = watchedItems[index]?.quantity || 0;
                            const discount = watchedItems[index]?.discount || 0;
                            const total = (unitPrice - discount) * quantity;

                            return (
                                <TableRow key={field.id}>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.sku`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Select
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            const selected = allSkus.find(s => s.value === value);
                                                            form.setValue(`items.${index}.unitPrice`, selected?.price || 0);
                                                        }}
                                                        defaultValue={field.value}
                                                    >
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
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.unitPrice`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="number" {...field} startIcon="$" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.discount`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="number" {...field} startIcon="$" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right font-mono">${total.toFixed(2)}</TableCell>
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
                <Button type="button" variant="outline" size="sm" onClick={() => append({ sku: '', quantity: 1, unitPrice: 0, discount: 0 })} className="mt-4">
                    Add another item
                </Button>
            </CardContent>
            <CardFooter className="flex justify-end">
                <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-mono">${subtotal.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-destructive">
                        <span>Item Discounts</span>
                        <span className="font-mono">-${itemDiscounts.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-destructive">
                        <span className="flex-1 mr-4">Bill Discount</span>
                         <FormField
                            control={form.control}
                            name={`discount`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input type="number" {...field} startIcon="$" className="h-8 max-w-[120px]" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className="flex justify-between">
                        <span>Tax (8%)</span>
                        <span className="font-mono">${tax.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total</span>
                        <span className="font-mono">${total.toFixed(2)}</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
