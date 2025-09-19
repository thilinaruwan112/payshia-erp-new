
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
import { Loader2, UploadCloud, X } from "lucide-react";
import React, { useState } from "react";
import { Switch } from "./ui/switch";
import { useLocation } from "./location-provider";
import Image from "next/image";
import { fetcher } from "@/lib/api";


const locationFormSchema = z.object({
  location_name: z.string().min(3, "Location name is required."),
  location_type: z.string().min(1, "Location type is required."),
  address_line1: z.string().min(3, "Address is required."),
  address_line2: z.string().optional(),
  city: z.string().min(2, "City is required."),
  phone_1: z.string().min(10, "A valid phone number is required."),
  phone_2: z.string().optional(),
  pos_status: z.boolean().default(false),
  logo: z.any().optional(),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

interface LocationFormProps {
    location?: Location;
}

export function LocationForm({ location }: LocationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { company_id } = useLocation();
  const [imagePreview, setImagePreview] = React.useState<string | null>(
    location?.logo_path ? `${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${location.logo_path}` : null
  );
  
  const defaultValues: Partial<LocationFormValues> = {
    location_name: location?.location_name || "",
    location_type: location?.location_type || "Retail",
    address_line1: location?.address_line1 || "",
    address_line2: location?.address_line2 || "",
    city: location?.city || "",
    phone_1: location?.phone_1 || "",
    phone_2: location?.phone_2 || "",
    pos_status: location?.pos_status === "1",
  };

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues,
    mode: "onChange",
  });
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('logo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    form.setValue('logo', null);
    setImagePreview(null);
  };


  async function onSubmit(data: LocationFormValues) {
    if (!company_id) {
        toast({ variant: 'destructive', title: 'Error', description: 'No company selected.' });
        return;
    }
    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('location_name', data.location_name);
    formData.append('location_type', data.location_type);
    formData.append('address_line1', data.address_line1);
    formData.append('address_line2', data.address_line2 || '');
    formData.append('city', data.city);
    formData.append('phone_1', data.phone_1);
    formData.append('phone_2', data.phone_2 || '');
    formData.append('pos_status', data.pos_status ? '1' : '0');
    formData.append('company_id', String(company_id));
    formData.append('is_active', '1');
    formData.append('created_by', 'admin');
    formData.append('pos_token', '101'); // Added default pos_token
    
    if (data.logo instanceof File) {
        formData.append('logo_path', data.logo);
    }
    
    const url = location ? `https://server-erp.payshia.com/locations/${location.location_id}` : 'https://server-erp.payshia.com/locations';
    let method = location ? 'PUT' : 'POST';

    // FormData with PUT doesn't work as expected in some backends, so spoofing is often used.
    // If the backend truly supports PUT with FormData, the below is fine.
    // If not, we use POST and add a _method field.
    if (location && data.logo instanceof File) {
      method = 'POST';
      formData.append('_method', 'PUT');
    }
    
    try {
      const response = await fetcher(url, {
        method: method,
        body: formData,
        headers: new Headers(), // Reset headers so fetch can set multipart/form-data
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
      }

      toast({
        title: location ? "Location Updated" : "Location Created",
        description: `The location "${data.location_name}" has been saved.`,
      });
      router.push('/locations');
      router.refresh();
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
       toast({
        variant: "destructive",
        title: "Failed to save location",
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  }

  const pageTitle = location ? `Edit Location: ${location.location_name}` : 'Create Location';
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
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full" disabled={isLoading}>Cancel</Button>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {location ? 'Save Changes' : 'Save Location'}
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Location Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="location_name"
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
                        name="location_type"
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
                                    <SelectItem value="Retail">Retail Store</SelectItem>
                                    <SelectItem value="Warehouse">Warehouse</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="md:col-span-2">
                        <FormField
                            control={form.control}
                            name="address_line1"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Address Line 1</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. 123 Main St" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <FormField
                            control={form.control}
                            name="address_line2"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Address Line 2 (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Apt #4B" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Colombo" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone_1"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Primary Phone</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. 0112345678" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone_2"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Secondary Phone (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. 0771234567" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="pos_status"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                    POS Active
                                </FormLabel>
                                <CardDescription>
                                    Enable or disable the Point of Sale terminal for this location.
                                </CardDescription>
                            </div>
                            <FormControl>
                                <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
          </div>
          <div>
            <Card>
                <CardHeader>
                  <CardTitle>Location Logo</CardTitle>
                  <CardDescription>
                    Upload a logo for this location.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4">
                  {imagePreview ? (
                    <div className="relative">
                       <Image
                        src={imagePreview}
                        alt="Logo preview"
                        width={200}
                        height={200}
                        className="rounded-lg object-cover aspect-square"
                      />
                       <Button 
                          type="button"
                          variant="destructive" 
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={removeImage}
                      >
                          <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                     <label htmlFor="logo-upload" className="w-full border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-sm text-muted-foreground">
                            Click to upload logo
                        </p>
                    </label>
                  )}
                  <Input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
