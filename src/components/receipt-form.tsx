
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
import { CalendarIcon, Loader2, CheckCircle, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React from "react";
import { useLocation } from "./location-provider";

type Receipt = {
    id: string;
    rec_number: string;
    type: string;
    is_active: string;
    date: string;
    amount: string;
    created_by: string;
    ref_id: string; // Invoice number
    location_id: string;
    customer_id: string;
    today_invoice: string;
    company_id: string;
    now_time: string;
};

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

interface BalanceDetails {
    grand_total: string;
    total_paid_amount: string;
    balance: number;
}

export function ReceiptForm({ customers }: ReceiptFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { currentLocation, company_id } = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetchingInvoices, setIsFetchingInvoices] = React.useState(false);
  const [isFetchingBalance, setIsFetchingBalance] = React.useState(false);
  const [customerInvoices, setCustomerInvoices] = React.useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null);
  const [balanceDetails, setBalanceDetails] = React.useState<BalanceDetails | null>(null);
  
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
        if (!selectedCustomerId || !company_id) {
            setCustomerInvoices([]);
            return;
        };
        setIsFetchingInvoices(true);
        setSelectedInvoice(null);
        setBalanceDetails(null);
        form.reset({ ...form.getValues(), invoiceId: '', amount: 0 });

        try {
            const response = await fetch(`https://server-erp.payshia.com/invoices/filter/pending?company_id=${company_id}&customer_code=${selectedCustomerId}`);
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
  }, [customerId, toast, form, company_id]);
  
  const handleInvoiceSelect = async (invoice: Invoice) => {
    if (!company_id) return;
    setSelectedInvoice(invoice);
    form.setValue('invoiceId', invoice.invoice_number);
    setIsFetchingBalance(true);
    setBalanceDetails(null);

    try {
        const [invoiceDetailsResponse, receiptsResponse] = await Promise.all([
             fetch(`https://server-erp.payshia.com/invoices/full/${invoice.invoice_number}`),
             fetch(`https://server-erp.payshia.com/receipts/invoice/${invoice.invoice_number}`),
        ]);

        if (!invoiceDetailsResponse.ok) {
            throw new Error("Failed to fetch invoice details.");
        }
        const invoiceData: Invoice = await invoiceDetailsResponse.json();
        
        let totalPaid = 0;
        if (receiptsResponse.ok) {
            const receiptsData: Receipt[] = await receiptsResponse.json();
            totalPaid = receiptsData.reduce((sum, receipt) => sum + parseFloat(receipt.amount), 0);
        }
        
        const grandTotal = parseFloat(invoiceData.grand_total);
        const balance = grandTotal - totalPaid;
        
        const balanceDetailPayload = {
            grand_total: invoiceData.grand_total,
            total_paid_amount: totalPaid.toFixed(2),
            balance,
        }
        setBalanceDetails(balanceDetailPayload);
        form.setValue("amount", balance > 0 ? balance : 0);

    } catch (error) {
         const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        toast({
            variant: 'destructive',
            title: 'Could not fetch balance',
            description: errorMessage,
        });
        setBalanceDetails(null);
    } finally {
        setIsFetchingBalance(false);
    }
  }


  async function onSubmit(data: ReceiptFormValues) {
    if (!currentLocation || !company_id) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No business location or company selected.',
        });
        return;
    }
    
    setIsLoading(true);

    const payload = {
        type: data.paymentMethod === 'Cash' ? '0' : data.paymentMethod === 'Card' ? '1' : '2',
        is_active: 1,
        date: format(data.date, "yyyy-MM-dd"),
        amount: data.amount,
        created_by: 1,
        ref_id: data.invoiceId,
        location_id: parseInt(currentLocation.location_id, 10),
        customer_id: parseInt(data.customerId, 10),
        today_invoice: data.invoiceId,
        company_id: company_id,
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

        const result = await response.json();

        toast({
          title: "Receipt Created",
          description: `The payment receipt has been saved successfully.`,
        });

        // Open print views
        window.open(`/sales/receipts/${result.id}/print`, '_blank');
        window.open(`/pos/receipt/${result.id}/print`, '_blank');

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
                <Button type="submit" className="w-full" disabled={isLoading || !selectedInvoice}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Receipt
                </Button>
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Step 1: Select Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <FormField
                            control={form.control}
                            name="customerId"
                            render={({ field }) => (
                                <FormItem>
                                    <Select 
                                        onValueChange={(value) => {
                                            field.onChange(value);
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Step 2: Select Invoice</CardTitle>
                        <CardDescription>Choose the pending invoice to apply the payment to.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!customerId ? (
                            <div className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/50 rounded-lg">
                                <Info className="h-8 w-8 mb-2" />
                                <p>Please select a customer first to see their pending invoices.</p>
                            </div>
                        ) : isFetchingInvoices ? (
                            <div className="h-48 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                        ) : customerInvoices.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {customerInvoices.map(invoice => (
                                    <Card 
                                        key={invoice.id} 
                                        className={cn(
                                            "cursor-pointer hover:border-primary transition-all relative",
                                            selectedInvoice?.id === invoice.id && "border-2 border-primary"
                                        )}
                                        onClick={() => handleInvoiceSelect(invoice)}
                                    >
                                        <CardHeader>
                                            <CardTitle className="text-base">{invoice.invoice_number}</CardTitle>
                                            <CardDescription>{format(new Date(invoice.invoice_date), "dd MMM, yyyy")}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="font-bold text-lg">${parseFloat(invoice.grand_total).toFixed(2)}</p>
                                        </CardContent>
                                        {selectedInvoice?.id === invoice.id && (
                                            <div className="absolute top-2 right-2 p-1 bg-primary text-primary-foreground rounded-full">
                                                <CheckCircle className="h-4 w-4" />
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-center text-muted-foreground">
                                <p>No pending invoices found for this customer.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="sticky top-24 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Step 3: Confirm Payment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isFetchingBalance ? (
                            <div className="p-4 bg-muted/50 rounded-md flex items-center justify-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                <span>Fetching balance...</span>
                            </div>
                        ) : balanceDetails ? (
                             <div className="space-y-2 text-base p-4 bg-muted rounded-md">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Grand Total:</span>
                                    <span className="font-mono">${parseFloat(balanceDetails.grand_total).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Paid Amount:</span>
                                    <span className="font-mono">${parseFloat(balanceDetails.total_paid_amount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                    <span>Balance Due:</span>
                                    <span className="font-mono">${balanceDetails.balance.toFixed(2)}</span>
                                </div>
                            </div>
                        ) : (
                             <div className="space-y-2 text-base p-4 bg-muted/50 rounded-md text-muted-foreground">
                                <div className="flex justify-between"><span>Grand Total:</span><span className="font-mono">$0.00</span></div>
                                <div className="flex justify-between"><span>Paid Amount:</span><span className="font-mono">$0.00</span></div>
                                <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Balance Due:</span><span className="font-mono">$0.00</span></div>
                            </div>
                        )}
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount to Pay</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0.00" {...field} className="h-12 text-xl" startIcon={<span className="text-xl">$</span>} disabled={!selectedInvoice || isFetchingBalance} />
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedInvoice || isFetchingBalance}>
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
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Date of Payment</FormLabel>
                                <FormControl>
                                    <Input readOnly value={format(field.value, "PPP")} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
      </form>
    </Form>
  );
}
