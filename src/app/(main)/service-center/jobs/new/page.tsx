
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
import { Loader2, Search, ShieldCheck } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "@/components/location-provider";
import type { Brand, User, Model, Warranty } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

// Mock data, this would come from an API
const customers = [
    { value: 'cus-123', label: 'John Doe' },
    { value: 'cus-456', label: 'Jane Smith' },
];

const mockWarranties: (Warranty & {productName: string})[] = [
    { id: 'WAR-001', customerId: 'cus-123', customerName: 'John Doe', productName: 'Toyota Camry Engine', productId: 'prod-abc', serialNumber: 'ABC-1234', purchaseDate: '2023-01-15', expiryDate: '2025-01-14', status: 'Active' },
    { id: 'WAR-002', customerId: 'cus-456', customerName: 'Jane Smith', productName: 'Apple iPhone 14 Pro', productId: 'prod-xyz', serialNumber: 'SN:XYZ', purchaseDate: '2022-10-25', expiryDate: '2023-10-24', status: 'Expired' },
];

const jobSheetFormSchema = z.object({
    customerId: z.string().min(1, "Customer is required."),
    itemDescription: z.string().min(3, "Item description is required."),
    itemSerialNo: z.string().min(3, "Serial/Registration number is required."),
    brandId: z.string().optional(),
    modelId: z.string().optional(),
    reportedIssues: z.string().min(10, "Please describe the issue(s)."),
    isWarrantyJob: z.boolean().default(false),
    warrantyId: z.string().optional(),
});

type JobSheetFormValues = z.infer<typeof jobSheetFormSchema>;

export default function NewJobSheetPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [serialNumber, setSerialNumber] = useState("");
  const [foundWarranty, setFoundWarranty] = useState<(Warranty & { productName: string }) | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const { company_id } = useLocation();

  const form = useForm<JobSheetFormValues>({
    resolver: zodResolver(jobSheetFormSchema),
    mode: "onChange",
  });

  useEffect(() => {
    async function fetchData(url: string, setData: Function, type: string) {
      if (!company_id) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${url}?company_id=${company_id}`);
        if (response.ok) {
          setData(await response.json());
        }
      } catch (error) {
        console.error(`Failed to fetch ${type}:`, error);
      }
    }
    fetchData('/brands/company', setBrands, 'brands');
    fetchData('/master-models/company', setModels, 'models');
  }, [company_id]);

  const handleWarrantySearch = () => {
    // Mock search
    const warranty = mockWarranties.find(w => w.serialNumber.toLowerCase() === serialNumber.toLowerCase());
    if (warranty && warranty.status === 'Active') {
        setFoundWarranty(warranty);
        form.setValue('customerId', warranty.customerId);
        form.setValue('itemDescription', warranty.productName);
        form.setValue('itemSerialNo', warranty.serialNumber);
        form.setValue('isWarrantyJob', true);
        form.setValue('warrantyId', warranty.id);
        toast({ title: 'Warranty Found!', description: `Active warranty found for ${warranty.productName}.` });
    } else if (warranty) {
        toast({ variant: 'destructive', title: 'Warranty Expired', description: `This warranty expired on ${warranty.expiryDate}.` });
    } else {
        toast({ variant: 'destructive', title: 'No Warranty Found', description: 'No active warranty found for this serial number.' });
    }
  }

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
  
  const brandOptions = brands.map(b => ({ value: b.id, label: b.name }));
  const modelOptions = models.map(m => ({ value: m.id, label: m.name }));

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
                        <CardTitle>Warranty &amp; Item Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                           <Label htmlFor="serial-search">Search by Serial / Registration No.</Label>
                           <div className="flex items-center gap-2">
                             <Input id="serial-search" placeholder="Enter serial number to find warranty" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
                             <Button type="button" onClick={handleWarrantySearch}><Search className="mr-2 h-4 w-4" />Find</Button>
                           </div>
                        </div>

                        {foundWarranty && (
                            <div className="p-4 rounded-md border bg-muted/50">
                                <h3 className="font-semibold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-green-500" /> Active Warranty Found</h3>
                                <p className="text-sm mt-2"><strong>Product:</strong> {foundWarranty.productName}</p>
                                <p className="text-sm"><strong>Customer:</strong> {foundWarranty.customerName}</p>
                                <p className="text-sm"><strong>Expires:</strong> {foundWarranty.expiryDate}</p>
                            </div>
                        )}
                        <FormField
                            control={form.control}
                            name="customerId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Customer</FormLabel>
                                <Combobox
                                    options={customers}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select a customer..."
                                    notFoundText="No customer found. You can add one from the CRM."
                                    disabled={!!foundWarranty}
                                />
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="itemDescription"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Item Description</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Toyota Camry, iPhone 15 Pro" {...field} disabled={!!foundWarranty} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="itemSerialNo"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Serial / Registration No.</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. ABC-1234, SN:12345XYZ" {...field} disabled={!!foundWarranty} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="brandId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Brand</FormLabel>
                                        <Combobox options={brandOptions} value={field.value || ""} onChange={field.onChange} placeholder="Select brand" notFoundText="No brand found." disabled={!!foundWarranty} />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="modelId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Model</FormLabel>
                                        <Combobox options={modelOptions} value={field.value || ""} onChange={field.onChange} placeholder="Select model" notFoundText="No model found." disabled={!!foundWarranty} />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
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
