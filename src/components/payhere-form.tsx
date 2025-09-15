
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useLocation } from "./location-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const payhereFormSchema = z.object({
  locationId: z.string().min(1, "Please select a location."),
  merchantId: z.string().min(1, "Merchant ID is required."),
  merchantSecret: z.string().min(1, "Merchant Secret is required."),
});

type PayhereFormValues = z.infer<typeof payhereFormSchema>;

export function PayhereForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const { availableLocations } = useLocation();
  
  const form = useForm<PayhereFormValues>({
    resolver: zodResolver(payhereFormSchema),
    defaultValues: {
        locationId: "",
        merchantId: "",
        merchantSecret: "",
    },
    mode: "onChange",
  });

  const selectedLocationId = form.watch("locationId");

  useEffect(() => {
    // In a real app, you would fetch the credentials for the selectedLocationId here
    // and populate the form with form.reset(). For now, we just clear it.
    form.setValue('merchantId', '');
    form.setValue('merchantSecret', '');
  }, [selectedLocationId, form]);


  function onSubmit(data: PayhereFormValues) {
    setIsLoading(true);
    // In a real app, you would save these credentials to your backend against the location ID.
    console.log("Saving PayHere credentials for location:", data.locationId, data);
    
    // Simulate API call
    setTimeout(() => {
        toast({
            title: "Settings Saved",
            description: "Your PayHere credentials have been saved successfully for the selected location.",
        });
        setIsLoading(false);
    }, 1000);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>PayHere Credentials</CardTitle>
            <CardDescription>
              Configure PayHere credentials for a specific location.
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
              name="merchantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchant ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your Merchant ID" {...field} disabled={!selectedLocationId} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="merchantSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchant Secret</FormLabel>
                  <div className="relative">
                    <FormControl>
                        <Input 
                            type={showSecret ? "text" : "password"} 
                            placeholder="Enter your Merchant Secret" 
                            {...field} 
                            disabled={!selectedLocationId}
                        />
                    </FormControl>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                        onClick={() => setShowSecret(!showSecret)}
                        disabled={!selectedLocationId}
                    >
                        {showSecret ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || !selectedLocationId}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Credentials
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
