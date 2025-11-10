
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
import type { GoodsReceivedNote, Supplier } from "@/lib/types";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { useCurrency } from "./currency-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Checkbox } from "./ui/checkbox";
import { fetcher } from "@/lib/api";
import { useLocation } from "./location-provider";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";

const paymentFormSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  supplierId: z.string().min(1, "Supplier is required."),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero."),
  notes: z.string().optional(),
  grnIds: z.array(z.string()).min(1, "Please select at least one GRN to pay."),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
    suppliers: Supplier[];
}

interface DueGrn extends GoodsReceivedNote {
    dueAmount: number;
}

export function PaymentForm({ suppliers }: PaymentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  const [dueGrns, setDueGrns] = useState<DueGrn[]>([]);
  const [isFetchingGrns, setIsFetchingGrns] = useState(false);
  const { company_id } = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
            if (!company_id) throw new Error("Company ID not found.");
            
            const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/grn/supplier/${id}`);
            if (!response.ok) throw new Error('Failed to fetch GRNs for this supplier.');
            
            const grnData = await response.json();
            const supplierGrns: GoodsReceivedNote[] = grnData.data || [];

            const grnsWithDueAmount = await Promise.all(
                supplierGrns.map(async (grn) => {
                    const paymentSumUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliar_payment/sum?company_id=${company_id}&grn_number=${grn.grn_number}&suppliar_id=${id}`;
                    const paymentResponse = await fetcher(paymentSumUrl);
                    let paidAmount = 0;
                    if (paymentResponse.ok) {
                        const paymentData = await paymentResponse.json();
                        paidAmount = paymentData.total_amount_sum || 0;
                    }
                    const dueAmount = parseFloat(grn.grand_total) - paidAmount;
                    return { ...grn, dueAmount: dueAmount > 0 ? dueAmount : 0 };
                })
            );

            setDueGrns(grnsWithDueAmount.filter(grn => grn.dueAmount > 0));

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
  }, [supplierId, toast, form, company_id]);


  useEffect(() => {
    const total = selectedGrnIds.reduce((sum, grnId) => {
        const grn = dueGrns.find(g => g.id === grnId);
        return sum + (grn?.dueAmount || 0);
    }, 0);
    form.setValue('amount', total);
  }, [selectedGrnIds, dueGrns, form]);


  async function onSubmit(data: PaymentFormValues) {
    if (!company_id) {
        toast({ variant: 'destructive', title: 'Error', description: 'No company selected.' });
        return;
    }
    setIsSubmitting(true);
    
    // Distribute the total amount paid across the selected GRNs
    let remainingAmountToDistribute = data.amount;
    const paymentPromises = data.grnIds.map(grnId => {
        const grn = dueGrns.find(g => g.id === grnId);
        if (!grn) return Promise.reject(new Error(`Could not find details for GRN ID ${grnId}`));
        
        const amountToPayForThisGrn = Math.min(grn.dueAmount, remainingAmountToDistribute);
        remainingAmountToDistribute -= amountToPayForThisGrn;
        
        if (amountToPayForThisGrn <= 0) return Promise.resolve(null); // Don't create a payment if amount is 0

        const payload = {
            company_id: company_id,
            grn_number: grn.grn_number,
            suppliar_id: parseInt(data.supplierId, 10),
            date_of_payment: format(data.date, "yyyy-MM-dd"),
            total_amount: amountToPayForThisGrn,
            is_active: 1,
        };
        
        return fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliar_payment`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }).filter(p => p !== null);

    try {
        const responses = await Promise.all(paymentPromises);
        let allOk = true;
        for (const response of responses) {
            if (!response.ok) {
                allOk = false;
                const errorData = await response.json();
                toast({
                    variant: "destructive",
                    title: "A Payment Failed",
                    description: errorData.message || `An error occurred for one of the payments.`,
                });
            }
        }

        if (allOk) {
            toast({
                title: "Payments Recorded Successfully",
                description: `A total of ${currencySymbol}${data.amount.toFixed(2)} has been recorded.`,
            });
            router.push('/suppliers/payments');
            router.refresh();
        } else {
            throw new Error("One or more payments failed to process. Please check the list and try again.");
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: "destructive",
            title: "Failed to Process Payments",
            description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
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
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full" disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Payment
                </Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Step 1: Select Supplier</CardTitle>
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
                    <CardTitle>Step 2: Select GRNs to Pay</CardTitle>
                    <CardDescription>Check the box next to each GRN you wish to pay for. The total amount will be calculated automatically but you can edit it.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isFetchingGrns ? (
                        <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></div>
                    ) : dueGrns.length > 0 ? (
                        <FormField
                            control={form.control}
                            name="grnIds"
                            render={() => (
                                <ScrollArea className="h-72 border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]"></TableHead>
                                            <TableHead>GRN Number</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Payment Status</TableHead>
                                            <TableHead className="text-right">Total Amount</TableHead>
                                            <TableHead className="text-right">Balance Due</TableHead>
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
                                                                    ? field.onChange([...(field.value || []), grn.id])
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
                                                        <TableCell>
                                                            <Badge variant={grn.payment_status === 'Unpaid' ? 'destructive' : 'secondary'}>
                                                                {grn.payment_status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(grn.grand_total).toFixed(2)}</TableCell>
                                                        <TableCell className="text-right font-mono">{currencySymbol}{grn.dueAmount.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                )}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                                </ScrollArea>
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
                <CardTitle>Step 3: Payment Details</CardTitle>
                <CardDescription>Enter the final details of the payment.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col justify-end">
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
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Total Amount</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="0.00" {...field} startIcon={currencySymbol} />
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
