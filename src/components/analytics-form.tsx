
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useLocation } from "./location-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const analyticsFormSchema = z.object({
  locationId: z.string().min(1, "Please select a location."),
  facebookPixelId: z.string().optional(),
  googleAnalyticsId: z.string().optional(),
});

type AnalyticsFormValues = z.infer<typeof analyticsFormSchema>;

export function AnalyticsForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { availableLocations } = useLocation();
  
  const form = useForm<AnalyticsFormValues>({
    resolver: zodResolver(analyticsFormSchema),
    defaultValues: {
        locationId: "",
        facebookPixelId: "",
        googleAnalyticsId: "",
    },
    mode: "onChange",
  });

  const selectedLocationId = form.watch("locationId");

  useEffect(() => {
    // In a real app, you would fetch the credentials for the selectedLocationId here
    // and populate the form with form.reset(). For now, we just clear it.
    form.setValue('facebookPixelId', '');
    form.setValue('googleAnalyticsId', '');
  }, [selectedLocationId, form]);

  function onSubmit(data: AnalyticsFormValues) {
    setIsLoading(true);
    // In a real app, you would save these credentials to your backend.
    console.log("Saving Analytics credentials for location:", data.locationId, data);
    
    // Simulate API call
    setTimeout(() => {
        toast({
            title: "Settings Saved",
            description: "Your analytics IDs have been saved successfully for the selected location.",
        });
        setIsLoading(false);
    }, 1000);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Analytics IDs</CardTitle>
            <CardDescription>
              Enter the tracking IDs from your marketing platforms for a specific location.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location to configure" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableLocations.map(loc => (
                         <SelectItem key={loc.location_id} value={loc.location_id}>{loc.location_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="facebookPixelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook Pixel ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your Facebook Pixel ID" {...field} disabled={!selectedLocationId} />
                  </FormControl>
                  <FormDescription>
                    Your Pixel ID from the Facebook Events Manager.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="googleAnalyticsId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Analytics ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your Measurement ID (e.g., G-XXXXXXXXXX)" {...field} disabled={!selectedLocationId} />
                  </FormControl>
                   <FormDescription>
                    Your "G-" Measurement ID from Google Analytics.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || !selectedLocationId}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
