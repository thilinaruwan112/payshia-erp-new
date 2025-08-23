
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
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import { Loader2 } from "lucide-react";
import React from "react";
import { Textarea } from "./ui/textarea";
import { useLocation } from "./location-provider";

const customerFormSchema = z.object({
  customer_first_name: z.string().min(2, "First name is required."),
  customer_last_name: z.string().min(2, "Last name is required."),
  phone_number: z.string().min(10, "A valid phone number is required."),
  email_address: z.string().email("Invalid email address.").optional().or(z.literal('')),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  opening_balance: z.coerce.number().optional(),
  credit_limit: z.coerce.number().optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  customer?: User;
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const { company_id, currentLocation } = useLocation();

  const defaultValues: Partial<CustomerFormValues> = {
    customer_first_name: customer?.customer_first_name || "",
    customer_last_name: customer?.customer_last_name || "",
    phone_number: customer?.phone || "",
    email_address: customer?.email_address || "",
    address_line1: customer?.address_line1 || "",
    city: customer?.city_id || "",
    opening_balance: 0,
    credit_limit: 0,
  };

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
    mode: "onChange",
  });

  async function onSubmit(data: CustomerFormValues) {
     if (!company_id || !currentLocation) {
      toast({ variant: 'destructive', title: 'Error', description: 'Company or location not selected.' });
      return;
    }
    setIsLoading(true);
    const url = customer ? `https://server-erp.payshia.com/customers/${customer.customer_id}` : 'https://server-erp.payshia.com/customers';
    const method = customer ? 'PUT' : 'POST';

     const payload = {
      ...data,
      is_active: 1,
      created_by: 'admin',
      company_id: company_id,
      location_id: parseInt(currentLocation.location_id),
      city_id: 3, // Assuming a default city for now
      credit_days: 30, // Assuming default
      region_id: 5,
      route_id: 2,
      area_id: 8,
    };

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Something went wrong');
        }
        toast({
            title: customer ? "Customer Updated" : "Customer Created",
            description: `The customer "${data.customer_first_name}" has been saved.`,
        });
        router.push('/crm/customers');
        router.refresh();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: "destructive",
            title: "Failed to save customer",
            description: errorMessage,
        });
    } finally {
        setIsLoading(false);
    }
  }

  const pageTitle = customer ? `Edit Customer: ${customer.customer_first_name}` : 'Create Customer';
  const pageDescription = customer
    ? 'Update the details for this customer.'
    : 'Add a new customer to your system.';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-nowrap">
              {pageTitle}
            </h1>
            <p className="text-muted-foreground">{pageDescription}</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
              className="w-full"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Customer
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>
              Enter the contact and financial details for the customer.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="customer_first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customer_last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 0771234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g. john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="md:col-span-2">
                <FormField
                    control={form.control}
                    name="address_line1"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Address (Optional)</FormLabel>
                        <FormControl>
                            <Textarea placeholder="123 Main St, Anytown" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             </div>
            <FormField
                control={form.control}
                name="opening_balance"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Opening Balance</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="credit_limit"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Credit Limit</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
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
