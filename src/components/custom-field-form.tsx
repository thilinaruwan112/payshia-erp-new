
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
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { useLocation } from "./location-provider";

const customFieldFormSchema = z.object({
  field_name: z.string().min(2, "Field name is required."),
  description: z.string().optional(),
});

type CustomFieldFormValues = z.infer<typeof customFieldFormSchema>;

export function CustomFieldForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { company_id } = useLocation();

  const form = useForm<CustomFieldFormValues>({
    resolver: zodResolver(customFieldFormSchema),
    defaultValues: {
        field_name: '',
        description: '',
    },
    mode: "onChange",
  });

  async function onSubmit(data: CustomFieldFormValues) {
    if (!company_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'No company selected.' });
      return;
    }
    setIsLoading(true);
    const url = 'https://server-erp.payshia.com/custom-fields';
    const method = 'POST';

    const payload = { ...data, company_id: company_id, created_by: 'admin', updated_by: 'admin' };

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
      }

      toast({
        title: "Custom Field Created",
        description: `The field "${data.field_name}" has been saved.`,
      });
      router.push('/products/custom-fields');
      router.refresh();
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
       toast({
        variant: "destructive",
        title: "Failed to save custom field",
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-nowrap">
              Create Custom Field
            </h1>
            <p className="text-muted-foreground">Add a new custom data field.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
              className="w-full"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Field
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Field Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="field_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Material Type" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                      <Textarea placeholder="A short description for the field" {...field} />
                  </FormControl>
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
