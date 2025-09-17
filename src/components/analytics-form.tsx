

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
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useLocation } from "./location-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { KeySetting } from "@/lib/types";
import { fetcher } from "@/lib/api";

const analyticsFormSchema = z.object({
  location_id: z.string().min(1, "Please select a location."),
  key: z.string().min(1, "Key name is required."),
  value: z.string().min(1, "A value is required for the key."),
});

type AnalyticsFormValues = z.infer<typeof analyticsFormSchema>;

interface AnalyticsFormDialogProps {
    children: React.ReactNode;
    setting?: KeySetting;
    onSave: () => void;
}

export function AnalyticsFormDialog({ children, setting, onSave }: AnalyticsFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { availableLocations, company_id } = useLocation();
  
  const form = useForm<AnalyticsFormValues>({
    resolver: zodResolver(analyticsFormSchema),
    defaultValues: {
        location_id: setting?.location_id || "",
        key: '',
        value: '',
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (setting) {
        form.reset({
            location_id: setting.location_id,
            key: setting.key,
            value: setting.value,
        });
    } else {
        form.reset({
            location_id: "",
            key: '',
            value: '',
        });
    }
  }, [setting, form, isOpen]);

  async function onSubmit(data: AnalyticsFormValues) {
    if (!company_id) {
        toast({ variant: 'destructive', title: 'Company not found' });
        return;
    }
    setIsLoading(true);

    const payload = {
        ...data,
        company_id,
        location_id: parseInt(data.location_id),
        created_by: 'admin_user',
        updated_by: 'admin_user',
    };
    
    try {
        const response = await fetcher('https://server-erp.payshia.com/key-settings', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save settings.');
        }

        toast({
            title: "Settings Saved",
            description: "Your analytics IDs have been saved successfully.",
        });
        setIsOpen(false);
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
                <DialogTitle>{setting ? 'Edit Analytics Settings' : 'Add Analytics Settings'}</DialogTitle>
                 <DialogDescription>
                    Enter the tracking IDs from your marketing platforms for a specific location.
                </DialogDescription>
            </DialogHeader>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                     <FormField
                        control={form.control}
                        name="location_id"
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
                          name="key"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Key Name</FormLabel>
                                <FormControl>
                                <Input placeholder="e.g. Facebook Pixel ID" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name="value"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Value</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter the tracking ID or value" {...field} />
                              </FormControl>
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
