
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
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocation } from "./location-provider";
import { fetcher } from "@/lib/api";
import { Switch } from "./ui/switch";
import { format } from "date-fns";

const taxFormSchema = z.object({
  tax_code: z.string().min(2, "Tax code is required."),
  tax_name: z.string().min(3, "Tax name is required."),
  rate: z.coerce.number().min(0, "Rate must be a positive number."),
  is_active: z.boolean().default(true),
});

type TaxFormValues = z.infer<typeof taxFormSchema>;

interface TaxFormDialogProps {
    children: React.ReactNode;
    onSave: () => void;
}

export function TaxFormDialog({ children, onSave }: TaxFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { company_id, currentLocation } = useLocation();

  const form = useForm<TaxFormValues>({
    resolver: zodResolver(taxFormSchema),
    defaultValues: {
      is_active: true,
    },
    mode: "onChange",
  });

  async function onSubmit(data: TaxFormValues) {
    if (!company_id || !currentLocation) {
        toast({ variant: 'destructive', title: 'Error', description: 'No company or location selected.' });
        return;
    }
    setIsLoading(true);

    const payload = {
        ...data,
        company_id: company_id,
        location_id: parseInt(currentLocation.location_id, 10),
        is_active: data.is_active ? 1 : 0,
        apply_on: "all", // Hardcoded based on sample
        sort_order: 1, // Hardcoded based on sample
        created_by: localStorage.getItem('userName') || 'admin',
        created_at: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    };
    
    try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/taxes`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save tax.');
        }

        toast({
            title: "Tax Created",
            description: `The tax "${data.tax_name}" has been saved successfully.`,
        });
        setIsOpen(false);
        form.reset({ is_active: true, tax_code: '', tax_name: '', rate: 0 });
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
                <DialogTitle>Add New Tax</DialogTitle>
                 <DialogDescription>
                    Configure a new tax rate for your system.
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
                    <div className="grid grid-cols-2 gap-4">
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
                            Save Tax
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
