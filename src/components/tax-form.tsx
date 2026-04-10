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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useLocation } from "./location-provider";
import { fetcher } from "@/lib/api";
import { Switch } from "./ui/switch";
import { format } from "date-fns";
import type { Tax } from "@/lib/types";

const taxFormSchema = z.object({
  tax_code: z.string().min(2, "Tax code is required."),
  tax_name: z.string().min(3, "Tax name is required."),
  rate: z.coerce.number().min(0, "Rate must be a positive number."),
  sort_order: z.coerce.number().min(0, "Sort order must be a positive number.").optional(),
  is_active: z.boolean().default(true),
});

type TaxFormValues = z.infer<typeof taxFormSchema>;

interface TaxFormDialogProps {
    children: React.ReactNode;
    tax?: Tax;
    onSave: () => void;
}

export function TaxFormDialog({ children, tax, onSave }: TaxFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { company_id, currentLocation } = useLocation();

  const form = useForm<TaxFormValues>({
    resolver: zodResolver(taxFormSchema),
    defaultValues: {
      tax_code: tax?.tax_code || '',
      tax_name: tax?.tax_name || '',
      rate: tax?.rate || 0,
      is_active: tax ? tax.is_active === 1 : true,
      sort_order: tax?.sort_order || 1,
    },
    mode: "onChange",
  });
  
  useEffect(() => {
    if (isOpen) {
      form.reset({
        tax_code: tax?.tax_code || '',
        tax_name: tax?.tax_name || '',
        rate: tax?.rate || 0,
        is_active: tax ? tax.is_active === 1 : true,
        sort_order: tax?.sort_order || 1,
      });
    }
  }, [isOpen, tax, form]);

  async function onSubmit(data: TaxFormValues) {
    if (!company_id || !currentLocation) {
        toast({ variant: 'destructive', title: 'Error', description: 'No company or location selected.' });
        return;
    }
    setIsLoading(true);

    const url = tax
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/taxes/${tax.id}`
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/taxes`;
    const method = tax ? 'PUT' : 'POST';
    
    const payload = {
        ...data,
        company_id: company_id,
        location_id: parseInt(currentLocation.location_id, 10),
        is_active: data.is_active ? 1 : 0,
        apply_on: "all", // Hardcoded based on sample
        sort_order: data.sort_order || 1,
        created_by: localStorage.getItem('userName') || 'admin',
        updated_by: localStorage.getItem('userName') || 'admin',
    };
    
    try {
        const response = await fetcher(url, {
            method: method,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save tax.');
        }

        toast({
            title: tax ? "Tax Updated" : "Tax Created",
            description: `The tax "${data.tax_name}" has been saved successfully.`,
        });
        setIsOpen(false);
        form.reset();
        onSave();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage,
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{tax ? 'Edit Tax' : 'Add New Tax'}</DialogTitle>
                 <DialogDescription>
                    {tax ? 'Update the details for this tax rate.' : 'Configure a new tax rate for your system.'}
                </DialogDescription>
            </DialogHeader>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                     <FormField
                        control={form.control}
                        name="tax_name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tax Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Value Added Tax (15%)" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-3 gap-4">
                         <FormField
                            control={form.control}
                            name="tax_code"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Tax Code</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. VAT_15" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="rate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Rate (%)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g. 15" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="sort_order"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Sort Order</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g. 1" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <FormLabel>Active</FormLabel>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {tax ? 'Save Changes' : 'Save Tax'}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}