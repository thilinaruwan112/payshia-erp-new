
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

const sizeFormSchema = z.object({
  name: z.string().min(1, "Size name is required."),
  abbreviation: z.string().min(1, "Abbreviation is required."),
});

type SizeFormValues = z.infer<typeof sizeFormSchema>;

interface SizeFormProps {
  size?: Size;
}

export function SizeForm({ size }: SizeFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const defaultValues: Partial<SizeFormValues> = {
    name: size?.name || "",
    abbreviation: size?.abbreviation || "",
  };

  const form = useForm<SizeFormValues>({
    resolver: zodResolver(sizeFormSchema),
    defaultValues,
    mode: "onChange",
  });

  function onSubmit(data: SizeFormValues) {
    console.log(data);
    toast({
      title: size ? "Size Updated" : "Size Created",
      description: `The size "${data.name}" has been saved.`,
    });
    router.push('/products/sizes');
  }

  const pageTitle = size ? `Edit Size: ${size.name}` : 'Create Size';
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
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full">
              Save Size
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Size Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Small" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="abbreviation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Abbreviation</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. S" {...field} />
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
