
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
import { Textarea } from "./ui/textarea";

const supplierFormSchema = z.object({
  name: z.string().min(3, "Supplier name is required."),
  contactPerson: z.string().min(3, "Contact person is required."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number is required."),
  address: z.string().min(10, "Address is required."),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

interface SupplierFormProps {
    supplier?: Supplier;
}

export function SupplierForm({ supplier }: SupplierFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const defaultValues: Partial<SupplierFormValues> = {
    name: supplier?.name || "",
    contactPerson: supplier?.contactPerson || "",
    email: supplier?.email || "",
    phone: supplier?.phone || "",
    address: supplier?.address || "",
  };

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues,
    mode: "onChange",
  });

  function onSubmit(data: SupplierFormValues) {
    console.log(data);
    toast({
      title: supplier ? "Supplier Updated" : "Supplier Created",
      description: `The supplier "${data.name}" has been saved.`,
    });
    router.push('/suppliers');
  }

  const pageTitle = supplier ? 'Edit Supplier' : 'Create Supplier';
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
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full">Cancel</Button>
                <Button type="submit" className="w-full">Save Supplier</Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Supplier Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="name"
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
                    name="contactPerson"
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
                    name="phone"
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
                <div className="md:col-span-2">
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Enter the full address of the supplier"
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
