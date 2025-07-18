
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
import { useRouter, useSearchParams } from "next/navigation";
import type { Account, PurchaseOrder, Supplier } from "@/lib/types";
import { Textarea } from "./ui/textarea";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React from "react";

const paymentFormSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  supplierId: z.string().min(1, "Supplier is required."),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero."),
  paymentAccountId: z.string().min(1, "Payment account is required."),
  poId: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
    suppliers: Supplier[];
    purchaseOrders: PurchaseOrder[];
    paymentAccounts: Account[];
}

export function PaymentForm({ suppliers, purchaseOrders, paymentAccounts }: PaymentFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const defaultValues: Partial<PaymentFormValues> = {
    date: new Date(),
    supplierId: searchParams.get('supplierId') || '',
    poId: searchParams.get('poId') || '',
    amount: Number(searchParams.get('amount')) || 0,
    notes: "",
  };

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues,
    mode: "onChange",
  });
  
  const supplierId = form.watch("supplierId");
  
  const filteredPOs = React.useMemo(() => {
    if (!supplierId) return [];
    return purchaseOrders.filter(po => po.supplierId === supplierId && po.status !== 'Received');
  }, [supplierId, purchaseOrders]);

  function onSubmit(data: PaymentFormValues) {
    console.log(data);
    toast({
      title: "Payment Recorded",
      description: `The payment has been saved.`,
    });
    router.push('/accounting/payments');
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">Record Payment</h1>
                 <p className="text-muted-foreground">Record a payment made to a supplier.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full">Cancel</Button>
                <Button type="submit" className="w-full">Save Payment</Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>Enter the details of the payment. This will create the necessary accounting entries automatically.</CardDescription>
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
                    name="supplierId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Supplier</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a supplier" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {suppliers.map(sup => (
                                        <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
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
                    name="paymentAccountId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Paid From</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a payment account" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {paymentAccounts.map(acc => (
                                        <SelectItem key={acc.code} value={String(acc.code)}>{acc.code} - {acc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="poId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reference PO (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!supplierId}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a PO to apply payment to" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {filteredPOs.map(po => (
                                        <SelectItem key={po.id} value={po.id}>{po.id} - ${po.total.toFixed(2)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="md:col-span-2">
                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Add any additional notes or reference numbers."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </CardContent>
        </Card>
      </form>
    </Form>
  );
}
