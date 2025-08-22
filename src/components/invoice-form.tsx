
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
import type { Product, User, Order, ProductVariant } from "@/lib/types";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";
import React from "react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useLocation } from "./location-provider";

type StockInfo = {
    product_id: string;
    expire_date: string;
    total_in: string;
    total_out: string;
    stock_balance: string;
}

const invoiceItemSchema = z.object({
      sku: z.string().min(1, "Product is required."),
      productId: z.string().min(1),
      productVariantId: z.string().min(1),
      quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
      unitPrice: z.coerce.number().min(0, "Unit price must be positive."),
      costPrice: z.coerce.number().min(0),
      discount: z.coerce.number().min(0, "Discount must be positive.").optional(),
      batchId: z.string().min(1, "Batch is required."),
    });

const invoiceFormSchema = z.object({
  invoiceType: z.enum(["Retail", "Wholesale"]),
  customerId: z.string().min(1, "Customer is required."),
  orderId: z.string().optional(),
  invoiceDate: z.date({ required_error: "Invoice date is required." }),
  dueDate: z.date({ required_error: "Due date is required." }),
  status: z.enum(["Draft", "Sent", "Paid"]),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required."),
  discount: z.coerce.number().min(0).optional(),
  serviceCharge: z.coerce.number().min(0).optional(),
  remark: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface ProductWithVariants {
    product: Product;
    variants: ProductVariant[];
}

interface InvoiceFormProps {
    productsWithVariants: ProductWithVariants[];
    customers: User[];
    orders: Order[];
}

export function InvoiceForm({ productsWithVariants, customers, orders }: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { currentLocation } = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);
  const [stockInfo, setStockInfo] = React.useState<Record<number, StockInfo[]>>({});

  const allSkus = productsWithVariants.flatMap(p => (p.variants || []).map(v => ({
      label: `${p.product.name} (${v.sku})`,
      value: v.id, // Use variant ID as value
      productId: p.product.id,
      sellingPrice: parseFloat(String(p.product.price)),
      wholesalePrice: p.product.wholesale_price ? parseFloat(String(p.product.wholesale_price)) : parseFloat(String(p.product.price)),
      costPrice: p.product.cost_price ? parseFloat(String(p.product.cost_price)) : 0,
      skuString: v.sku,
  })));
  
  const defaultValues: Partial<InvoiceFormValues> = {
    invoiceType: "Retail",
    invoiceDate: new Date(),
    dueDate: addDays(new Date(), 30),
    status: 'Draft',
    items: [],
    discount: 0,
    serviceCharge: 0,
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
  const serviceCharge = form.watch("serviceCharge") || 0;
  const invoiceType = form.watch("invoiceType");

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
            const product = allSkus.find(s => s.skuString === item.sku);
            const price = invoiceType === 'Wholesale' ? product?.wholesalePrice : product?.sellingPrice;
            return {
                sku: product?.skuString || '',
                productId: product?.productId || '',
                productVariantId: product?.value || '',
                quantity: item.quantity,
                unitPrice: Number(price) || 0,
                costPrice: Number(product?.costPrice) || 0,
                discount: 0,
                batchId: '',
            }
        });
        form.setValue('orderId', order.id);
        replace(newItems);
    }
  }

  const handleProductSelect = async (productId: string, variantId: string, index: number) => {
    if (!productId || !variantId) return;
    try {
        const response = await fetch(`https://server-erp.payshia.com/stock-entries/summary?company_id=101&product_id=${productId}&product_variant_id=${variantId}`);
        if (!response.ok) {
            throw new Error("Failed to fetch stock");
        }
        const data = await response.json();
        const validBatches = data.grouped_by_expire_date.filter((batch: StockInfo) => parseFloat(batch.stock_balance) > 0);
        setStockInfo(prev => ({ ...prev, [index]: validBatches }));
    } catch (error) {
        console.error(error);
        setStockInfo(prev => ({...prev, [index]: []}));
        toast({variant: 'destructive', title: 'Error', description: 'Could not fetch stock for this product.'});
    }
  }

  const subtotal = watchedItems.reduce((total, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return total + (quantity * unitPrice);
  }, 0);

  const itemDiscounts = watchedItems.reduce((total, item) => {
      const discount = Number(item.discount) || 0;
      return total + discount; 
  }, 0)

  const totalDiscountAmount = (Number(itemDiscounts) || 0) + (Number(billDiscount) || 0);
  const grandTotal = (Number(subtotal) || 0) - (Number(totalDiscountAmount) || 0) + (Number(serviceCharge) || 0);


  async function onSubmit(data: InvoiceFormValues) {
    setIsLoading(true);
    
    if (!currentLocation) {
        toast({ variant: 'destructive', title: 'Error', description: 'No location selected.' });
        setIsLoading(false);
        return;
    }

    const payload = {
        invoice_date: format(data.invoiceDate, 'yyyy-MM-dd'),
        inv_amount: subtotal,
        grand_total: grandTotal,
        discount_amount: totalDiscountAmount,
        discount_percentage: subtotal > 0 ? (totalDiscountAmount / subtotal) * 100 : 0,
        customer_code: data.customerId,
        service_charge: data.serviceCharge || 0,
        tendered_amount: data.status === 'Paid' ? grandTotal : 0,
        close_type: "Cash",
        invoice_status: data.status,
        payment_status: "Pending",
        current_time: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        location_id: parseInt(currentLocation.location_id, 10),
        table_id: 0,
        order_ready_status: 1,
        created_by: "Admin User",
        is_active: 1,
        steward_id: "STW-001",
        cost_value: data.items.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0),
        remark: data.remark || "",
        ref_hold: null,
        company_id: "1",
        items: data.items.map(item => ({
            user_id: 1,
            product_id: parseInt(item.productId),
            item_price: item.unitPrice,
            item_discount: item.discount || 0,
            quantity: item.quantity,
            customer_id: parseInt(data.customerId),
            table_id: 0,
            cost_price: item.costPrice,
            is_active: 1,
            hold_status: 0,
            printed_status: 1,
            company_id: "1",
        }))
    };

    try {
        const response = await fetch('https://server-erp.payshia.com/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create invoice.');
        }

        const result = await response.json();
        toast({
            title: "Invoice Created Successfully!",
            description: `Invoice #${result.invoice_number} has been created.`,
        });
        
        window.open(`/sales/invoices/${result.invoice_number}/print`, '_blank');
        
        router.push('/sales/invoices');
        router.refresh();

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: "destructive",
            title: "Failed to create invoice",
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
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">New Invoice</h1>
                 <p className="text-muted-foreground">Create a new retail or wholesale invoice for a customer.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full" disabled={isLoading}>Cancel</Button>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Invoice
                </Button>
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
                        name="invoiceType"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Invoice Type</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex items-center space-x-4"
                              >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="Retail" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Retail
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="Wholesale" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Wholesale
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    <div></div>
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
                                            <SelectItem key={c.customer_id} value={c.customer_id}>{c.customer_first_name} {c.customer_last_name}</SelectItem>
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
                    <div className="md:col-span-2">
                        <FormField
                            control={form.control}
                            name="remark"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Remarks (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Special delivery instructions" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
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
                            <TableHead className="w-[20%]">Batch</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {fields.map((field, index) => {
                            const unitPrice = watchedItems[index]?.unitPrice || 0;
                            const quantity = watchedItems[index]?.quantity || 0;
                            const discount = watchedItems[index]?.discount || 0;
                            const total = (unitPrice * quantity) - discount;

                            return (
                                <TableRow key={field.id}>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.productVariantId`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Select
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            const selected = allSkus.find(s => s.value === value);
                                                            form.setValue(`items.${index}.sku`, selected?.skuString || '');
                                                            form.setValue(`items.${index}.productId`, selected?.productId || '');
                                                            handleProductSelect(selected?.productId || '', selected?.value || '', index);
                                                            const price = invoiceType === 'Wholesale' ? selected?.wholesalePrice : selected?.sellingPrice;
                                                            form.setValue(`items.${index}.unitPrice`, Number(price) || 0);
                                                            form.setValue(`items.${index}.costPrice`, Number(selected?.costPrice) || 0);
                                                            form.setValue(`items.${index}.batchId`, ''); // Reset batch on product change
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
                                            name={`items.${index}.batchId`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Select onValueChange={field.onChange} value={field.value} disabled={!stockInfo[index]}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select batch" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {stockInfo[index]?.map(stock => (
                                                                <SelectItem key={stock.expire_date} value={stock.expire_date}>
                                                                    EXP: {stock.expire_date === '0000-00-00' ? 'N/A' : format(new Date(stock.expire_date), 'dd/MM/yy')} 
                                                                    (Qty: {parseFloat(stock.stock_balance).toFixed(2)})
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
                <Button type="button" variant="outline" size="sm" onClick={() => append({ sku: '', productId: '', productVariantId: '', quantity: 1, unitPrice: 0, costPrice: 0, discount: 0, batchId: '' })} className="mt-4">
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
                        <span>Item-wise Discount</span>
                        <span className="font-mono">-${itemDiscounts.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-destructive">
                        <span className="flex-1 mr-4">Overall Discount</span>
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
                        <span className="flex-1 mr-4">Service Charge</span>
                         <FormField
                            control={form.control}
                            name={`serviceCharge`}
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
                     <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Grand Total</span>
                        <span className="font-mono">${grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
