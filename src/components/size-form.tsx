
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
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Size } from "@/lib/types";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const sizeFormSchema = z.object({
  value: z.string().min(1, "Size value is required."),
});

type SizeFormValues = z.infer<typeof sizeFormSchema>;

interface SizeFormProps {
  size?: Size;
}

export function SizeForm({ size }: SizeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const defaultValues: Partial<SizeFormValues> = {
    value: size?.value || "",
  };

  const form = useForm<SizeFormValues>({
    resolver: zodResolver(sizeFormSchema),
    defaultValues,
    mode: "onChange",
  });

  async function onSubmit(data: SizeFormValues) {
    setIsLoading(true);
    const url = size ? `https://server-erp.payshia.com/sizes/${size.id}` : 'https://server-erp.payshia.com/sizes';
    const method = size ? 'PUT' : 'POST';
    try {
      const response = await fetch(url, {
        method: method,
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
        title: size ? "Size Updated" : "Size Created",
        description: `The size "${data.value}" has been saved.`,
      });
      router.push('/products/sizes');
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        variant: "destructive",
        title: "Failed to save size",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const pageTitle = size ? `Edit Size: ${size.value}` : 'Create Size';
  const pageDescription = size
    ? 'Update the size details.'
    : 'Add a new size to your system.';

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
              {size ? "Save Changes" : "Save Size"}
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Size Information</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size Value</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. S, M, L, 32, 10.5" {...field} />
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
