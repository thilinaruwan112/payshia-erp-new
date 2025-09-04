
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
  CardHeader,
  CardTitle,
  CardDescription
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
import { Loader2, CalendarIcon } from "lucide-react";
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { addYears, format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

const warrantyFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required."),
  productId: z.string().min(1, "Product is required."),
  serialNumber: z.string().min(1, "Serial number is required."),
  purchaseDate: z.date({ required_error: "A date is required." }),
  warrantyPeriod: z.enum(['6m', '1y', '2y', '3y', '5y']),
  coverageDetails: z.string().optional(),
});

type WarrantyFormValues = z.infer<typeof warrantyFormSchema>;

export default function NewWarrantyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  
  const form = useForm<WarrantyFormValues>({
    resolver: zodResolver(warrantyFormSchema),
    defaultValues: {
      purchaseDate: new Date(),
      warrantyPeriod: '1y',
      coverageDetails: '',
    },
    mode: "onChange",
  });

  const purchaseDate = form.watch("purchaseDate");
  const warrantyPeriod = form.watch("warrantyPeriod");

  const expiryDate = React.useMemo(() => {
    if (!purchaseDate) return null;
    const monthsToAdd = { '6m': 6, '1y': 12, '2y': 24, '3y': 36, '5y': 60 }[warrantyPeriod];
    return addYears(new Date(purchaseDate), monthsToAdd / 12);
  }, [purchaseDate, warrantyPeriod]);

  async function onSubmit(data: WarrantyFormValues) {
    setIsLoading(true);
    console.log({ ...data, expiryDate: expiryDate ? format(expiryDate, 'yyyy-MM-dd') : null });
    toast({
      title: "Warranty Registered",
      description: "The warranty has been successfully saved.",
    });
    // In a real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    router.push('/service-center/warranty');
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Register New Warranty</h1>
            <p className="text-muted-foreground">Log a new product warranty for a customer.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Warranty
            </Button>
          </div>
        </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Warranty Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="customerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Customer</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger></FormControl>
                                    <SelectContent><SelectItem value="cus-123">John Doe</SelectItem></SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="productId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger></FormControl>
                                    <SelectContent><SelectItem value="prod-abc">Toyota Camry Engine</SelectItem></SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="serialNumber"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Serial / Registration No.</FormLabel>
                                <FormControl><Input placeholder="e.g. SN12345XYZ, ABC-1234" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="purchaseDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Purchase Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="warrantyPeriod"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Warranty Period</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a period" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="6m">6 Months</SelectItem>
                                        <SelectItem value="1y">1 Year</SelectItem>
                                        <SelectItem value="2y">2 Years</SelectItem>
                                        <SelectItem value="3y">3 Years</SelectItem>
                                        <SelectItem value="5y">5 Years</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="space-y-2">
                            <FormLabel>Expiry Date</FormLabel>
                            <Input readOnly value={expiryDate ? format(expiryDate, "PPP") : "N/A"} disabled />
                        </div>
                    </div>
                     <FormField
                        control={form.control}
                        name="coverageDetails"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Coverage Details</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="Describe what this warranty covers, e.g., 'Parts and labor for engine defects', 'Screen replacement for one year'."
                                className="resize-y min-h-[100px]"
                                {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
        </form>
      </Form>
    </div>
  );
}
