
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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useLocation } from "./location-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { PayhereSetting } from "@/app/(main)/settings/payhere/page";

const payhereFormSchema = z.object({
  locationId: z.string().min(1, "Please select a location."),
  keyName: z.string().min(1, "Key name is required."),
  value: z.string().min(1, "A value is required for the key."),
});

type PayhereFormValues = z.infer<typeof payhereFormSchema>;

interface PayhereFormDialogProps {
    children: React.ReactNode;
    setting?: PayhereSetting;
    onSave: () => void;
}

export function PayhereFormDialog({ children, setting, onSave }: PayhereFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { availableLocations } = useLocation();
  const [showSecret, setShowSecret] = useState(false);
  
  const form = useForm<PayhereFormValues>({
    resolver: zodResolver(payhereFormSchema),
    defaultValues: {
        locationId: setting?.locationId || "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (setting) {
        form.reset({
            locationId: setting.locationId,
            keyName: '',
            value: '',
        });
    } else {
        form.reset({
            locationId: "",
            keyName: '',
            value: '',
        });
    }
  }, [setting, form, isOpen]);

  const selectedKeyName = form.watch('keyName');
  const isSecret = selectedKeyName?.toLowerCase().includes('secret');

  function onSubmit(data: PayhereFormValues) {
    setIsLoading(true);
    // In a real app, you would save these credentials to your backend.
    console.log("Saving PayHere credentials for location:", data.locationId, { [data.keyName]: data.value });
    
    // Simulate API call
    setTimeout(() => {
        toast({
            title: setting ? "Settings Updated" : "Settings Saved",
            description: "Your PayHere credentials have been saved successfully for the selected location.",
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
                <DialogTitle>{setting ? 'Edit PayHere Settings' : 'Add PayHere Settings'}</DialogTitle>
                 <DialogDescription>
                    Enter your PayHere Merchant ID and Secret for a specific location.
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
                          name="keyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Key Name</FormLabel>
                               <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a key" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Merchant ID">Merchant ID</SelectItem>
                                  <SelectItem value="Merchant Secret">Merchant Secret</SelectItem>
                                </SelectContent>
                              </Select>
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
                                <div className="relative">
                                    <FormControl>
                                        <Input 
                                            placeholder="Enter the ID or Secret" 
                                            {...field} 
                                            type={isSecret && !showSecret ? 'password' : 'text'}
                                        />
                                    </FormControl>
                                    {isSecret && (
                                         <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                                            onClick={() => setShowSecret(!showSecret)}
                                        >
                                            {showSecret ? <EyeOff /> : <Eye />}
                                        </Button>
                                    )}
                                </div>
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
