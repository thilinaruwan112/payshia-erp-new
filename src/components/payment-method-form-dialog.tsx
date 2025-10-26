
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
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { fetcher } from "@/lib/api";
import { useLocation } from "./location-provider";

const formSchema = z.object({
  method: z.string().min(2, "Method name must be at least 2 characters."),
});

type FormValues = z.infer<typeof formSchema>;

interface PaymentMethodFormDialogProps {
    children: React.ReactNode;
    onSave: () => void;
}

export function PaymentMethodFormDialog({ children, onSave }: PaymentMethodFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { company_id } = useLocation();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        method: '',
    },
    mode: "onChange",
  });

  async function onSubmit(data: FormValues) {
    if (!company_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'No company selected.' });
      return;
    }
    setIsLoading(true);
    const username = localStorage.getItem('userName') || 'admin';
    const payload = {
        method: data.method,
        created_by: username,
        company_id: company_id
    };
    
    try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/payment-method`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save payment method.');
        }

        toast({
            title: "Payment Method Saved",
            description: `The method "${data.method}" has been saved successfully.`,
        });
        setIsOpen(false);
        form.reset();
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
                <DialogTitle>Add New Payment Method</DialogTitle>
                 <DialogDescription>
                    Enter the name of the new payment method (e.g., Cash, Card, Bank Transfer).
                </DialogDescription>
            </DialogHeader>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                     <FormField
                        control={form.control}
                        name="method"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Method Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Cash" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Method
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
