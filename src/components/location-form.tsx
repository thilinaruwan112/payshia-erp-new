
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
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
import type { Location } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";

const salesChannels = ["E-commerce", "Retail", "Wholesale", "POS"] as const;

const locationFormSchema = z.object({
  name: z.string().min(3, "Location name is required."),
  type: z.enum(["Warehouse", "Store"]),
  salesChannels: z.array(z.string()).refine(value => value.some(item => item), {
    message: "You have to select at least one sales channel.",
  }),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

interface LocationFormProps {
    location?: Location;
}

export function LocationForm({ location }: LocationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const defaultValues: Partial<LocationFormValues> = {
    name: location?.name || "",
    type: location?.type || "Store",
    salesChannels: location?.salesChannels || [],
  };

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues,
    mode: "onChange",
  });

  function onSubmit(data: LocationFormValues) {
    console.log(data);
    toast({
      title: location ? "Location Updated" : "Location Created",
      description: `The location "${data.name}" has been saved.`,
    });
    router.push('/locations');
  }

  const pageTitle = location ? 'Edit Location' : 'Create Location';
  const pageDescription = location ? 'Update the details of this location.' : 'Add a new location to your system.';

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
                <Button type="submit" className="w-full">Save Location</Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Location Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Location Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Downtown Store" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Store">Store</SelectItem>
                                    <SelectItem value="Warehouse">Warehouse</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sales Channels</CardTitle>
                    <FormDescription>Select the sales channels available at this location.</FormDescription>
                </CardHeader>
                <CardContent>
                     <FormField
                        control={form.control}
                        name="salesChannels"
                        render={() => (
                            <FormItem className="space-y-3">
                                {salesChannels.map((item) => (
                                    <FormField
                                    key={item}
                                    control={form.control}
                                    name="salesChannels"
                                    render={({ field }) => {
                                        return (
                                        <FormItem
                                            key={item}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                            <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(item)}
                                                onCheckedChange={(checked) => {
                                                return checked
                                                    ? field.onChange([...(field.value || []), item])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                        (value) => value !== item
                                                        )
                                                    )
                                                }}
                                            />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                            {item}
                                            </FormLabel>
                                        </FormItem>
                                        )
                                    }}
                                    />
                                ))}
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                </CardContent>
            </Card>
        </div>
      </form>
    </Form>
  );
}
