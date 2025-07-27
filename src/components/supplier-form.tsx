
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
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Supplier } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const supplierFormSchema = z.object({
  supplier_name: z.string().min(3, "Supplier name is required."),
  contact_person: z.string().min(3, "Contact person is required."),
  email: z.string().email("Invalid email address."),
  telephone: z.string().min(10, "Phone number is required."),
  street_name: z.string().optional(),
  city: z.string().optional(),
  zip_code: z.string().optional(),
  fax: z.string().optional(),
  opening_balance: z.coerce.number().optional(),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

interface SupplierFormProps {
    supplier?: Supplier;
}

export function SupplierForm({ supplier }: SupplierFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  
  const defaultValues: Partial<SupplierFormValues> = {
    supplier_name: supplier?.supplier_name || "",
    contact_person: supplier?.contact_person || "",
    email: supplier?.email || "",
    telephone: supplier?.telephone || "",
    street_name: supplier?.street_name || "",
    city: supplier?.city || "",
    zip_code: supplier?.zip_code || "",
    fax: supplier?.fax || "",
    opening_balance: supplier?.opening_balance ? parseFloat(supplier.opening_balance) : 0,
  };

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues,
    mode: "onChange",
  });

  async function onSubmit(data: SupplierFormValues) {
    setIsLoading(true);

    const url = supplier ? `https://server-erp.payshia.com/suppliers/${supplier.supplier_id}` : 'https://server-erp.payshia.com/suppliers';
    const method = supplier ? 'PUT' : 'POST';
    
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({...data, is_active: 1, created_by: 'admin' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
      }

      toast({
        title: supplier ? "Supplier Updated" : "Supplier Created",
        description: `The supplier "${data.supplier_name}" has been saved.`,
      });
      router.push('/suppliers');
      router.refresh(); // Refresh the page to show the new data
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
       toast({
        variant: "destructive",
        title: "Failed to save supplier",
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  }

  const pageTitle = supplier ? `Edit Supplier: ${supplier.supplier_name}` : 'Create Supplier';
  const pageDescription = supplier ? 'Update the details of this supplier.' : 'Add a new supplier to your system.';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">{pageTitle}</h1>
                 <p className="text-muted-foreground">{pageDescription}</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full" disabled={isLoading}>Cancel</Button>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {supplier ? 'Save Changes' : 'Save Supplier'}
                </Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Supplier Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="supplier_name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Supplier Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Global Textiles Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="contact_person"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Sarah Chen" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="e.g. sarah.chen@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="telephone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. 123-456-7890" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="fax"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Fax</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. 123-456-7891" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="opening_balance"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Opening Balance</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                     <FormField
                        control={form.control}
                        name="street_name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Street</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. 123 Textile Ave" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Industry City" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="zip_code"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Zip Code</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. 10001" {...field} />
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
