
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
import type { Color } from "@/lib/types";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocation } from "./location-provider";

const colorFormSchema = z.object({
  name: z.string().min(2, "Color name must be at least 2 characters."),
});

type ColorFormValues = z.infer<typeof colorFormSchema>;

interface ColorFormProps {
  color?: Color;
}

export function ColorForm({ color }: ColorFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { company_id } = useLocation();

  const defaultValues: Partial<ColorFormValues> = {
    name: color?.name || "",
  };

  const form = useForm<ColorFormValues>({
    resolver: zodResolver(colorFormSchema),
    defaultValues,
    mode: "onChange",
  });

  async function onSubmit(data: ColorFormValues) {
    if (!company_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'No company selected.' });
      return;
    }
    setIsLoading(true);
    const url = color ? `https://server-erp.payshia.com/colors/${color.id}` : 'https://server-erp.payshia.com/colors';
    const method = color ? 'PUT' : 'POST';

    const payload = { ...data, company_id: company_id };

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
        title: color ? "Color Updated" : "Color Created",
        description: `The color "${data.name}" has been saved.`,
      });
      router.push('/products/colors');
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        variant: "destructive",
        title: "Failed to save color",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const pageTitle = color ? `Edit Color: ${color.name}` : 'Create Color';
  const pageDescription = color
    ? 'Update the color details.'
    : 'Add a new color to your system.';

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
              {color ? "Save Changes" : "Save Color"}
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Color Information</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Midnight Black" {...field} />
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
