
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { AnalyticsSetting } from "@/app/(main)/settings/analytics/page";

const analyticsFormSchema = z.object({
  locationId: z.string().min(1, "Please select a location."),
  facebookPixelId: z.string().optional(),
  googleAnalyticsId: z.string().optional(),
});

type AnalyticsFormValues = z.infer<typeof analyticsFormSchema>;

interface AnalyticsFormDialogProps {
    children: React.ReactNode;
    setting?: AnalyticsSetting;
    onSave: () => void;
}

export function AnalyticsFormDialog({ children, setting, onSave }: AnalyticsFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { availableLocations } = useLocation();
  
  const form = useForm<AnalyticsFormValues>({
    resolver: zodResolver(analyticsFormSchema),
    defaultValues: {
        locationId: setting?.locationId || "",
        facebookPixelId: setting?.facebookPixelId || "",
        googleAnalyticsId: setting?.googleAnalyticsId || "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (setting) {
        form.reset({
            locationId: setting.locationId,
            facebookPixelId: setting.facebookPixelId,
            googleAnalyticsId: setting.googleAnalyticsId,
        });
    } else {
        form.reset({
            locationId: "",
            facebookPixelId: "",
            googleAnalyticsId: "",
        });
    }
  }, [setting, form]);

  function onSubmit(data: AnalyticsFormValues) {
    setIsLoading(true);
    // In a real app, you would save these credentials to your backend.
    console.log("Saving Analytics credentials for location:", data.locationId, data);
    
    // Simulate API call
    setTimeout(() => {
        toast({
            title: setting ? "Settings Updated" : "Settings Saved",
            description: "Your analytics IDs have been saved successfully for the selected location.",
        });
        setIsLoading(false);
        setIsOpen(false);
        onSave(); // Callback to refresh the list
    }, 1000);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{setting ? 'Edit Analytics Settings' : 'Add Analytics Settings'}</DialogTitle>
                 <DialogDescription>
                    Enter the tracking IDs from your marketing platforms for a specific location.
                </DialogDescription>
            </DialogHeader>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                                <Input placeholder="Enter your Facebook Pixel ID" {...field} />
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
                                <Input placeholder="Enter your Measurement ID (e.g., G-XXXXXXXXXX)" {...field} />
                            </FormControl>
                            <FormDescription>
                                Your "G-" Measurement ID from Google Analytics.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Settings
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
