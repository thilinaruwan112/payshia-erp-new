

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
  CardFooter
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
import type { Account, PurchaseOrder, Supplier, GoodsReceivedNote } from "@/lib/types";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { useCurrency } from "./currency-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Checkbox } from "./ui/checkbox";

const paymentFormSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  supplierId: z.string().min(1, "Supplier is required."),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero."),
  paymentAccountId: z.string().min(1, "Payment account is required."),
  notes: z.string().optional(),
  grnIds: z.array(z.string()).min(1, "Please select at least one GRN to pay."),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
    suppliers: Supplier[];
    paymentAccounts: Account[];
}

interface DueGrn extends GoodsReceivedNote {
    dueAmount: number;
}

export function PaymentForm({ suppliers, paymentAccounts }: PaymentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  const [dueGrns, setDueGrns] = useState<DueGrn[]>([]);
  const [isFetchingGrns, setIsFetchingGrns] = useState(false);
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
        date: new Date(),
        supplierId: '',
        amount: 0,
        notes: '',
        grnIds: [],
    },
    mode: "onChange",
  });
  
  const supplierId = form.watch("supplierId");
  const selectedGrnIds = form.watch("grnIds");

  useEffect(() => {
    async function fetchDueGrns(id: string) {
        setIsFetchingGrns(true);
        form.setValue('grnIds', []);
        form.setValue('amount', 0);
        try {
            // In a real app, this endpoint would return only GRNs with a balance due
            const response = await fetch(`https://server-erp.payshia.com/grn`);
            if (!response.ok) throw new Error('Failed to fetch GRNs');
            const allGrns: GoodsReceivedNote[] = await response.json();
            const supplierGrns = allGrns
                .filter(grn => grn.supplier_id === id)
                .map(grn => ({ ...grn, dueAmount: parseFloat(grn.grand_total) })); // Mock due amount
            setDueGrns(supplierGrns);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch due GRNs for supplier.' });
        } finally {
            setIsFetchingGrns(false);
        }
    }
    if (supplierId) {
        fetchDueGrns(supplierId);
    } else {
        setDueGrns([]);
    }
  }, [supplierId, toast, form]);


  useEffect(() => {
    const total = selectedGrnIds.reduce((sum, grnId) => {
        const grn = dueGrns.find(g => g.id === grnId);
        return sum + (grn?.dueAmount || 0);
    }, 0);
    form.setValue('amount', total);
  }, [selectedGrnIds, dueGrns, form]);


  function onSubmit(data: PaymentFormValues) {
    console.log(data);
    toast({
      title: "Payment Recorded",
      description: `The payment has been saved.`,
    });
    router.push('/suppliers/payments');
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">Record Payment</h1>
                 <p className="text-muted-foreground">Record a payment made to a supplier against received goods.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full">Cancel</Button>
                <Button type="submit" className="w-full">Save Payment</Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Select Supplier</CardTitle>
            </CardHeader>
            <CardContent>
                <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                        <FormItem className="max-w-md">
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a supplier to see due GRNs" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {suppliers.map(sup => (
                                        <SelectItem key={sup.supplier_id} value={sup.supplier_id}>{sup.supplier_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>

        {supplierId && (
            <Card>
                <CardHeader>
                    <CardTitle>Select GRNs to Pay</CardTitle>
                    <CardDescription>Check the box next to each GRN you wish to pay for. The total amount will be calculated automatically.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isFetchingGrns ? (
                        <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></div>
                    ) : dueGrns.length > 0 ? (
                        <FormField
                            control={form.control}
                            name="grnIds"
                            render={() => (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]"></TableHead>
                                            <TableHead>GRN Number</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Total Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dueGrns.map(grn => (
                                            <FormField
                                                key={grn.id}
                                                control={form.control}
                                                name="grnIds"
                                                render={({ field }) => (
                                                    <TableRow>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={field.value?.includes(grn.id)}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                    ? field.onChange([...field.value, grn.id])
                                                                    : field.onChange(
                                                                        field.value?.filter(
                                                                        (value) => value !== grn.id
                                                                        )
                                                                    )
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium">{grn.grn_number}</TableCell>
                                                        <TableCell>{format(new Date(grn.created_at), 'dd MMM, yyyy')}</TableCell>
                                                        <TableCell className="text-right font-mono">{currencySymbol}{grn.dueAmount.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                )}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-48 text-muted-foreground">No outstanding GRNs found for this supplier.</div>
                    )}
                </CardContent>
            </Card>
        )}
        
        <Card>
            <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>Enter the final details of the payment.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground" )}
                                >
                                {field.value ? ( format(field.value, "PPP") ) : ( <span>Pick a date</span> )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                        </Popover>
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
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Total Amount</FormLabel>
                        <FormControl>
                            <Input readOnly type="number" placeholder="0.00" {...field} startIcon={currencySymbol} />
                        </FormControl>
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
