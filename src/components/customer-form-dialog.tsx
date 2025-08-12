
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/types";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { Textarea } from "./ui/textarea";

const customerFormSchema = z.object({
  customer_first_name: z.string().min(2, "First name is required."),
  customer_last_name: z.string().min(2, "Last name is required."),
  phone_number: z.string().min(10, "A valid phone number is required."),
  email_address: z.string().email("Invalid email address.").optional().or(z.literal('')),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  opening_balance: z.coerce.number().optional(),
  credit_limit: z.coerce.number().optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerFormDialogProps {
  children: React.ReactNode;
  onCustomerCreated: (customer: User) => void;
}

export function CustomerFormDialog({ children, onCustomerCreated }: CustomerFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const defaultValues: Partial<CustomerFormValues> = {
    customer_first_name: "",
    customer_last_name: "",
    phone_number: "",
    email_address: "",
    address_line1: "",
    address_line2: "",
    opening_balance: 0,
    credit_limit: 0,
  };

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
    mode: "onChange",
  });

  async function onSubmit(data: CustomerFormValues) {
    setIsLoading(true);
    const url = 'https://server-erp.payshia.com/customers';
    const method = 'POST';

    const payload = { 
        ...data,
        city_id: 3,
        created_by: "admin",
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        company_id: 3,
        location_id: 2,
        is_active: 1,
        credit_days: 30,
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
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
      }

      toast({
        title: "Customer Created",
        description: `The customer "${data.customer_first_name} ${data.customer_last_name}" has been saved.`,
      });
      onCustomerCreated(result);
      setIsOpen(false);
      form.reset();
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Customer</DialogTitle>
          <DialogDescription>
            Add a new customer profile to the system.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
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
             </div>
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
             <FormField
                control={form.control}
                name="address_line1"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                        <Textarea placeholder="123 Main St..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <div className="grid grid-cols-2 gap-4">
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
             </div>
            <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)} disabled={isLoading}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Customer
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
