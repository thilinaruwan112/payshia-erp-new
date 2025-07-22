
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
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React from "react";

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
    invoices: Invoice[];
}

export function ReceiptForm({ customers, invoices }: ReceiptFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
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
  
  const availableInvoices = React.useMemo(() => {
    if (!customerId) return [];
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return [];
    return invoices.filter(inv => inv.customerName === customer.name && inv.status !== 'Paid');
  }, [customerId, customers, invoices]);

  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
        form.setValue("amount", invoice.total);
    }
  }

  function onSubmit(data: ReceiptFormValues) {
    console.log(data);
    toast({
      title: "Receipt Created",
      description: `The payment receipt has been saved.`,
    });
    router.push('/sales/receipts');
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
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full">Cancel</Button>
                <Button type="submit" className="w-full">Save Receipt</Button>
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
                                defaultValue={field.value}
                                disabled={!customerId}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an invoice" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {availableInvoices.map(inv => (
                                        <SelectItem key={inv.id} value={inv.id}>{inv.id} - ${inv.total.toFixed(2)}</SelectItem>
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
