
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
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocation } from "@/components/location-provider";
import { fetcher } from "@/lib/api";
import { format } from "date-fns";

const accountFormSchema = z.object({
  account_name: z.string().min(3, "Account name is required."),
  account_type: z.enum(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

export function AccountForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { company_id } = useLocation();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      account_name: "",
      account_type: "Expense",
    },
    mode: "onChange",
  });

  async function onSubmit(data: AccountFormValues) {
    if (!company_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Company not found. Please select a company.",
      });
      return;
    }
    setIsLoading(true);
    
    const loggedInUserId = localStorage.getItem('userId') || '1';

    const payload = {
      ...data,
      company_id: company_id,
      created_by: parseInt(loggedInUserId, 10),
      updated_by: parseInt(loggedInUserId, 10),
      created_at: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      updated_at: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      is_active: 1
    };

    try {
      const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/finance-accounts`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create account.');
      }

      toast({
        title: "Account Created",
        description: `The account "${data.account_name}" has been added to your Chart of Accounts.`,
      });
      router.push('/accounting/chart-of-accounts');
      router.refresh();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        variant: "destructive",
        title: "Failed to create account",
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
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">Create New Account</h1>
                 <p className="text-muted-foreground">Add a new account to your Chart of Accounts.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full" disabled={isLoading}>Cancel</Button>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Account
                </Button>
            </div>
        </div>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Enter the name and type for the new account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="account_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Office Supplies" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="account_type"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select an account type" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="Asset">Asset</SelectItem>
                        <SelectItem value="Liability">Liability</SelectItem>
                        <SelectItem value="Equity">Equity</SelectItem>
                        <SelectItem value="Revenue">Revenue</SelectItem>
                        <SelectItem value="Expense">Expense</SelectItem>
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
