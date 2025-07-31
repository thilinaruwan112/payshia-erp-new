
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import type { User, Invoice } from "@/lib/types";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React from "react";
import { useLocation } from "./location-provider";

const receiptFormSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  customerId: z.string().min(1, "Customer is required."),
  invoiceId: z.string().min(1, "Invoice is required."),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero."),
  paymentMethod: z.enum(["Cash", "Card", "Bank Transfer"]),
});

type ReceiptFormValues = z.infer<typeof receiptFormSchema>;

interface ReceiptFormProps {
    customers: User[];
}

export function ReceiptForm({ customers }: ReceiptFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { currentLocation } = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetchingInvoices, setIsFetchingInvoices] = React.useState(false);
  const [customerInvoices, setCustomerInvoices] = React.useState<Invoice[]>([]);
  
  const defaultValues: Partial<ReceiptFormValues> = {
    date: new Date(),
    amount: 0,
    paymentMethod: "Card",
  };

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const customerId = form.watch("customerId");

  React.useEffect(() => {
    async function fetchCustomerInvoices(selectedCustomerId: string) {
        if (!selectedCustomerId) {
            setCustomerInvoices([]);
            return;
        };
        setIsFetchingInvoices(true);
        try {
            const response = await fetch(`https://server-erp.payshia.com/invoices/filter/pending?company_id=1&customer_code=${selectedCustomerId}`);
            if (!response.ok) {
                throw new Error("Failed to fetch pending invoices for customer.");
            }
            const data = await response.json();
            setCustomerInvoices(data || []);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            toast({
                variant: 'destructive',
                title: 'Could not fetch invoices',
                description: errorMessage,
            });
            setCustomerInvoices([]);
        } finally {
            setIsFetchingInvoices(false);
        }
    }

    fetchCustomerInvoices(customerId);
  }, [customerId, toast]);
  

  const handleInvoiceChange = (invoiceNumber: string) => {
    const invoice = customerInvoices.find(inv => inv.invoice_number === invoiceNumber);
    if (invoice) {
        form.setValue("amount", parseFloat(invoice.grand_total));
    }
  }

  async function onSubmit(data: ReceiptFormValues) {
    if (!currentLocation) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No business location selected. Please select a location from the top bar.',
        });
        return;
    }
    
    setIsLoading(true);

    const payload = {
        type: data.paymentMethod,
        is_active: 1,
        date: format(data.date, "yyyy-MM-dd"),
        amount: data.amount,
        created_by: 1, // Assuming a logged-in user ID
        ref_id: data.invoiceId,
        location_id: parseInt(currentLocation.location_id, 10),
        customer_id: parseInt(data.customerId, 10),
        today_invoice: data.invoiceId,
        company_id: 1,
    };

    try {
        const response = await fetch('https://server-erp.payshia.com/receipts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create receipt.');
        }

        toast({
          title: "Receipt Created",
          description: `The payment receipt has been saved successfully.`,
        });
        router.push('/sales/receipts');
        router.refresh();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: "destructive",
            title: "Failed to save receipt",
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
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">New Payment Receipt</h1>
                 <p className="text-muted-foreground">Record a payment received from a customer.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full" disabled={isLoading}>Cancel</Button>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Receipt
                </Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Receipt Details</CardTitle>
                <CardDescription>Enter the details of the payment received.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Date of Payment</FormLabel>
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
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
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
                    name="customerId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Customer</FormLabel>
                            <Select 
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    form.setValue('invoiceId', ''); // Reset invoice selection
                                    form.setValue('amount', 0); // Reset amount
                                }}
                                defaultValue={field.value}
                            >
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
                 <FormField
                    control={form.control}
                    name="invoiceId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reference Invoice</FormLabel>
                            <Select 
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    handleInvoiceChange(value);
                                }} 
                                value={field.value}
                                disabled={!customerId || isFetchingInvoices}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={isFetchingInvoices ? 'Loading invoices...' : 'Select an invoice'} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {customerInvoices.map(inv => (
                                        <SelectItem key={inv.id} value={inv.invoice_number}>
                                            {inv.invoice_number} - ${parseFloat(inv.grand_total).toFixed(2)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="0.00" {...field} startIcon="$" />
                        </FormControl>
                         <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a method" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Card">Card</SelectItem>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
      </form>
    </Form>
  );
}
