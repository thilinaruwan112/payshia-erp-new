
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
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Account } from "@/lib/types";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useCurrency } from "./currency-provider";
import { Combobox } from "./ui/combobox";
import { useLocation } from "./location-provider";
import { fetcher } from "@/lib/api";
import React from "react";

const journalLineSchema = z.object({
    accountId: z.string().min(1, "Account is required."),
    debit: z.coerce.number().min(0, "Must be positive").optional(),
    credit: z.coerce.number().min(0, "Must be positive").optional(),
  })
  .refine(
    (data) => (data.debit || 0) > 0 || (data.credit || 0) > 0,
    {
      message: "Enter a debit or a credit",
      path: ["debit"], // Point error to one field for simplicity
    }
  )
 .refine(
    (data) => !(data.debit && data.debit > 0 && data.credit && data.credit > 0),
    {
      message: "Can't be both debit and credit",
      path: ["credit"],
    }
  );


const journalEntryFormSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  narration: z.string().min(3, "Narration is required."),
  lines: z.array(journalLineSchema).min(2, "At least two lines are required."),
})
.refine(data => {
    const totalDebit = data.lines.reduce((acc, line) => acc + (line.debit || 0), 0);
    const totalCredit = data.lines.reduce((acc, line) => acc + (line.credit || 0), 0);
    return Math.abs(totalDebit - totalCredit) < 0.001; // Use a small tolerance for floating point comparison
}, {
    message: "Total debits must equal total credits.",
    path: ["lines"],
})
.refine(data => {
    const totalDebit = data.lines.reduce((acc, line) => acc + (line.debit || 0), 0);
    return totalDebit > 0;
}, {
    message: "Total debits cannot be zero.",
    path: ["lines"],
});


type JournalEntryFormValues = z.infer<typeof journalEntryFormSchema>;

interface JournalEntryFormProps {
    accounts: Account[];
}

export function JournalEntryForm({ accounts }: JournalEntryFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  const { company_id, currentLocation } = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);
  
  const defaultValues: Partial<JournalEntryFormValues> = {
    date: new Date(),
    narration: "",
    lines: [
        { accountId: '', debit: 0, credit: 0 },
        { accountId: '', debit: 0, credit: 0 },
    ],
  };

  const form = useForm<JournalEntryFormValues>({
    resolver: zodResolver(journalEntryFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  async function onSubmit(data: JournalEntryFormValues) {
    if (!company_id || !currentLocation) {
      toast({ variant: 'destructive', title: 'Error', description: 'Company and Location must be set.' });
      return;
    }
    setIsLoading(true);

    const debits = data.lines.filter(line => (line.debit || 0) > 0);
    const credits = data.lines.filter(line => (line.credit || 0) > 0);

    // This logic assumes a simple case where one side has one entry and the other has one or more.
    // A more complex transaction splitter would be needed for many-to-many debits/credits.
    // For now, we pair the single entry with each of the multiple entries.

    const transactions = [];

    if (debits.length === 1 && credits.length >= 1) {
        for (const creditLine of credits) {
            transactions.push({
                debit_account_id: parseInt(debits[0].accountId),
                credit_account_id: parseInt(creditLine.accountId),
                amount: creditLine.credit,
            });
        }
    } else if (credits.length === 1 && debits.length >= 1) {
        for (const debitLine of debits) {
            transactions.push({
                debit_account_id: parseInt(debitLine.accountId),
                credit_account_id: parseInt(credits[0].accountId),
                amount: debitLine.debit,
            });
        }
    } else {
         toast({ variant: 'destructive', title: 'Unsupported Entry', description: 'The system currently supports simple journal entries (one debit to many credits, or many debits to one credit).' });
         setIsLoading(false);
         return;
    }

    try {
      for (const transaction of transactions) {
        const payload = {
          ...transaction,
          transaction_date: format(data.date, 'yyyy-MM-dd'),
          description: data.narration,
          ref_key: `JE-${Date.now()}`,
          location_id: parseInt(currentLocation.location_id),
          company_id: company_id,
          created_by: 1, // Placeholder for user ID
          timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          is_active: 1,
        };

        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/finance-transactions`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to post transaction for debit ${transaction.debit_account_id}.`);
        }
      }

      toast({
        title: "Journal Entry Created",
        description: `The journal entry has been successfully saved.`,
      });
      router.push('/accounting/journal-entries');
      router.refresh();

    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
       toast({
        variant: "destructive",
        title: "Failed to create journal entry",
        description: errorMessage,
      });
    } finally {
       setIsLoading(false);
    }
  }
  
  const { lines } = form.watch();
  const totalDebit = lines.reduce((acc, line) => acc + (Number(line.debit) || 0), 0);
  const totalCredit = lines.reduce((acc, line) => acc + (Number(line.credit) || 0), 0);

  const accountOptions = accounts.map(acc => ({ value: acc.account_id, label: `${acc.account_id} - ${acc.account_name}`}));


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">New Journal Entry</h1>
                 <p className="text-muted-foreground">Manually record a financial transaction.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full" disabled={isLoading}>Cancel</Button>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Entry
                </Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Entry Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] pl-3 text-left font-normal",
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
                    name="narration"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Narration / Description</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., To record monthly office rent" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Accounts</CardTitle>
                <CardDescription>Add the accounts and amounts for this entry. Total debits must equal total credits.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50%]">Account</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {fields.map((field, index) => (
                           <TableRow key={field.id}>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`lines.${index}.accountId`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <Combobox
                                                    options={accountOptions}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Select an account..."
                                                    notFoundText="No account found."
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`lines.${index}.debit`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input type="number" placeholder="0.00" {...field} className="text-right" startIcon={currencySymbol} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                     <FormField
                                        control={form.control}
                                        name={`lines.${index}.credit`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input type="number" placeholder="0.00" {...field} className="text-right" startIcon={currencySymbol} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    {fields.length > 2 && (
                                        <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    )}
                                </TableCell>
                           </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell>
                                <Button type="button" variant="outline" size="sm" onClick={() => append({ accountId: '', debit: 0, credit: 0 })}>Add Row</Button>
                            </TableCell>
                            <TableCell className={cn("text-right font-bold", totalDebit !== totalCredit && "text-destructive")}>{currencySymbol}{totalDebit.toFixed(2)}</TableCell>
                            <TableCell className={cn("text-right font-bold", totalDebit !== totalCredit && "text-destructive")}>{currencySymbol}{totalCredit.toFixed(2)}</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
                {form.formState.errors.lines && (
                     <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.lines.message}</p>
                )}
            </CardContent>
        </Card>
      </form>
    </Form>
  );
}
