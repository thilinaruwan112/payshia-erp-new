
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
import type { Account } from "@/lib/types";
import { Textarea } from "./ui/textarea";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Combobox } from "./ui/combobox";

const expenseFormSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  payee: z.string().min(2, "Payee is required."),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero."),
  expenseAccountId: z.string().min(1, "Expense category is required."),
  paymentAccountId: z.string().min(1, "Payment account is required."),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
    expenseAccounts: Account[];
    paymentAccounts: Account[];
    payees: string[];
}

export function ExpenseForm({ expenseAccounts, paymentAccounts, payees }: ExpenseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const defaultValues: Partial<ExpenseFormValues> = {
    date: new Date(),
    payee: "",
    amount: 0,
    notes: "",
  };

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues,
    mode: "onChange",
  });

  function onSubmit(data: ExpenseFormValues) {
    console.log(data);
    toast({
      title: "Expense Recorded",
      description: `The expense for ${data.payee} has been saved.`,
    });
    router.push('/accounting/expenses');
  }

  const payeeOptions = payees.map(payee => ({ value: payee, label: payee }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">Record Expense</h1>
                 <p className="text-muted-foreground">Add a new business expense to your books.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full">Cancel</Button>
                <Button type="submit" className="w-full">Save Expense</Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Expense Details</CardTitle>
                <CardDescription>Enter the details of the expense. This will create the necessary accounting entries automatically.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Date of Expense</FormLabel>
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
                    name="payee"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Payee</FormLabel>
                            <Combobox
                                options={payeeOptions}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select or create a payee..."
                                notFoundText="No payee found. You can create a new one."
                            />
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
                    name="expenseAccountId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Expense Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {expenseAccounts.map(acc => (
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
