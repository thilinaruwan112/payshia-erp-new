
'use client';

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
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "@/components/location-provider";
import type { Brand, User, Model } from "@/lib/types";

// Mock data, this would come from an API
const customers = [
    { value: 'cus-123', label: 'John Doe' },
    { value: 'cus-456', label: 'Jane Smith' },
];

const jobSheetFormSchema = z.object({
    customerId: z.string().min(1, "Customer is required."),
    brandId: z.string().min(1, "Item make/brand is required."),
    modelId: z.string().min(1, "Item model is required."),
    itemSerialNo: z.string().min(3, "Serial/Registration number is required."),
    reportedIssues: z.string().min(10, "Please describe the issue(s)."),
});

type JobSheetFormValues = z.infer<typeof jobSheetFormSchema>;

export default function NewJobSheetPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const { company_id } = useLocation();

  useEffect(() => {
    async function fetchBrands() {
        if (!company_id) return;
        try {
            const response = await fetch(`https://server-erp.payshia.com/brands/company?company_id=${company_id}`);
            if (!response.ok) throw new Error("Failed to fetch brands");
            setBrands(await response.json() || []);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not fetch brands data.'
            })
        }
    }
     async function fetchModels() {
        if (!company_id) return;
        try {
            const response = await fetch(`https://server-erp.payshia.com/master-models/company?company_id=${company_id}`);
            if (!response.ok) throw new Error("Failed to fetch models");
            setModels(await response.json() || []);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not fetch models data.'
            })
        }
    }
    fetchBrands();
    fetchModels();
  }, [company_id, toast]);

  const form = useForm<JobSheetFormValues>({
    resolver: zodResolver(jobSheetFormSchema),
    mode: "onChange",
  });

  async function onSubmit(data: JobSheetFormValues) {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(data);
    toast({
      title: "Job Sheet Created",
      description: "A new job has been successfully opened.",
    });
    setIsLoading(false);
    router.push('/service-center');
  }

  const brandOptions = brands.map(brand => ({ value: brand.id, label: brand.name }));
  const modelOptions = models.map(model => ({ value: model.id, label: model.name }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Job Sheet</h1>
            <p className="text-muted-foreground">Open a new service job for a customer.</p>
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
              Save Job
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Item &amp; Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="customerId"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                <FormLabel>Customer</FormLabel>
                                <Combobox
                                    options={customers}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select a customer..."
                                    notFoundText="No customer found. You can add one from the CRM."
                                />
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="brandId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Item Make / Brand</FormLabel>
                                <Combobox
                                    options={brandOptions}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select a brand..."
                                    notFoundText="No brand found."
                                />
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="modelId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Item Model</FormLabel>
                                <Combobox
                                    options={modelOptions}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select a model..."
                                    notFoundText="No model found."
                                />
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="itemSerialNo"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                <FormLabel>Serial / Registration No.</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. ABC-1234, SN:12345XYZ" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </div>
             <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Reported Issues</CardTitle>
                        <CardDescription>Describe the problems reported by the customer.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="reportedIssues"
                            render={({ field }) => (
                                <FormItem>
                                <FormControl>
                                    <Textarea
                                        placeholder="e.g. Customer states there is a loud grinding noise from the front-right wheel when braking. Also requests an oil change."
                                        className="resize-y min-h-[150px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
             </div>
        </div>
      </form>
    </Form>
  );
}
