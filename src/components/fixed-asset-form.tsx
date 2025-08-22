
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
import type { FixedAsset } from "@/lib/types";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Combobox } from "./ui/combobox";
import { useCurrency } from "./currency-provider";

const fixedAssetFormSchema = z.object({
  name: z.string().min(3, "Asset name is required."),
  assetType: z.string().min(1, "Asset type is required."),
  purchaseDate: z.date({ required_error: "A date is required." }),
  purchaseCost: z.coerce.number().min(0.01, "Cost must be greater than zero."),
  status: z.enum(["In Use", "Under Maintenance", "Disposed"]),
  depreciationMethod: z.enum(["Straight-Line", "Double Declining Balance"]),
});

type FixedAssetFormValues = z.infer<typeof fixedAssetFormSchema>;

interface FixedAssetFormProps {
    asset?: FixedAsset;
}

const mockAssetTypes = [
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Furniture', label: 'Furniture' },
    { value: 'Vehicles', label: 'Vehicles' },
    { value: 'Machinery', label: 'Machinery' },
    { value: 'Buildings', label: 'Buildings' },
];

export function FixedAssetForm({ asset }: FixedAssetFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  
  const defaultValues: Partial<FixedAssetFormValues> = {
    name: asset?.name || "",
    assetType: asset?.assetType || "",
    purchaseDate: asset ? new Date(asset.purchaseDate) : new Date(),
    purchaseCost: asset?.purchaseCost || 0,
    status: asset?.status || "In Use",
    depreciationMethod: asset?.depreciationMethod || "Straight-Line",
  };

  const form = useForm<FixedAssetFormValues>({
    resolver: zodResolver(fixedAssetFormSchema),
    defaultValues,
    mode: "onChange",
  });

  function onSubmit(data: FixedAssetFormValues) {
    console.log(data);
    toast({
      title: asset ? "Asset Updated" : "Asset Created",
      description: `The asset "${data.name}" has been saved.`,
    });
    router.push('/accounting/fixed-assets');
  }

  const assetTypeOptions = mockAssetTypes;
  const pageTitle = asset ? 'Edit Asset' : 'Create Asset';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">{pageTitle}</h1>
                 <p className="text-muted-foreground">Add a new fixed asset to your register.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full">Cancel</Button>
                <Button type="submit" className="w-full">Save Asset</Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Asset Details</CardTitle>
                <CardDescription>Enter the details of the asset.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Asset Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. MacBook Pro 16" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="assetType"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Asset Type</FormLabel>
                            <Combobox
                                options={assetTypeOptions}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select or create a type..."
                                notFoundText="No type found. You can create a new one."
                            />
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
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="purchaseCost"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Purchase Cost</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="0.00" {...field} startIcon={currencySymbol} />
                        </FormControl>
                         <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select asset status" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="In Use">In Use</SelectItem>
                                    <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                                    <SelectItem value="Disposed">Disposed</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="depreciationMethod"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Depreciation Method</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a method" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Straight-Line">Straight-Line</SelectItem>
                                    <SelectItem value="Double Declining Balance">Double Declining Balance</SelectItem>
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
