
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
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
import type { Account } from "@/lib/types";
import { Textarea } from "./ui/textarea";
import { CalendarIcon, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const journalEntryFormSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  narration: z.string().min(3, "Narration is required."),
  lines: z.array(
    z.object({
      accountId: z.string().min(1, "Account is required."),
      debit: z.coerce.number().min(0).optional(),
      credit: z.coerce.number().min(0).optional(),
    })
  ).min(2, "At least two lines are required."),
}).refine(data => {
    const totalDebit = data.lines.reduce((acc, line) => acc + (line.debit || 0), 0);
    const totalCredit = data.lines.reduce((acc, line) => acc + (line.credit || 0), 0);
    return totalDebit === totalCredit;
}, {
    message: "Total debits must equal total credits.",
    path: ["lines"],
});

type JournalEntryFormValues = z.infer<typeof journalEntryFormSchema>;

interface JournalEntryFormProps {
    accounts: Account[];
}

export function JournalEntryForm({ accounts }: JournalEntryFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
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

  function onSubmit(data: JournalEntryFormValues) {
    console.log(data);
    toast({
      title: "Journal Entry Created",
      description: `The journal entry has been saved.`,
    });
    router.push('/accounting/journal-entries');
  }
  
  const { lines } = form.watch();
  const totalDebit = lines.reduce((acc, line) => acc + (Number(line.debit) || 0), 0);
  const totalCredit = lines.reduce((acc, line) => acc + (Number(line.credit) || 0), 0);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">New Journal Entry</h1>
                 <p className="text-muted-foreground">Manually record a financial transaction.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full">Cancel</Button>
                <Button type="submit" className="w-full">Save Entry</Button>
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
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select an account" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {accounts.map(acc => (
                                                            <SelectItem key={acc.code} value={String(acc.code)}>{acc.code} - {acc.name}</SelectItem>
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
                                        name={`lines.${index}.debit`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input type="number" placeholder="0.00" {...field} className="text-right" startIcon="$" />
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
                                                    <Input type="number" placeholder="0.00" {...field} className="text-right" startIcon="$" />
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
                            <TableCell className="text-right font-bold">${totalDebit.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-bold">${totalCredit.toFixed(2)}</TableCell>
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
