
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
import type { Brand } from "@/lib/types";
import { useState } from "react";
import { Textarea } from "./ui/textarea";
import { Loader2 } from "lucide-react";

const brandFormSchema = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters."),
  description: z.string().optional(),
});

type BrandFormValues = z.infer<typeof brandFormSchema>;

interface BrandFormProps {
  brand?: Brand;
}

export function BrandForm({ brand }: BrandFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const defaultValues: Partial<BrandFormValues> = {
    name: brand?.name || "",
    description: brand?.description || "",
  };

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues,
    mode: "onChange",
  });

  async function onSubmit(data: BrandFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch('https://server-erp.payshia.com/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
      }

      toast({
        title: brand ? "Brand Updated" : "Brand Created",
        description: `The brand "${data.name}" has been saved.`,
      });
      router.push('/products/brands');
      router.refresh();
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
       toast({
        variant: "destructive",
        title: "Failed to save brand",
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  }

  const pageTitle = brand ? `Edit Brand: ${brand.name}` : 'Create Brand';
  const pageDescription = brand
    ? 'Update the brand details.'
    : 'Add a new brand to your system.';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-nowrap">
              {pageTitle}
            </h1>
            <p className="text-muted-foreground">{pageDescription}</p>
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
              Save Brand
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Brand Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Nike" {...field} />
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
                    <Textarea placeholder="A short description for the brand." {...field} />
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
