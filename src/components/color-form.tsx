
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
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

const colorFormSchema = z.object({
  name: z.string().min(2, "Color name must be at least 2 characters."),
  hexCode: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex code (e.g. #RRGGBB)."),
});

type ColorFormValues = z.infer<typeof colorFormSchema>;

interface ColorFormProps {
  color?: Color;
}

export function ColorForm({ color }: ColorFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const defaultValues: Partial<ColorFormValues> = {
    name: color?.name || "",
    hexCode: color?.hexCode || "#000000",
  };

  const form = useForm<ColorFormValues>({
    resolver: zodResolver(colorFormSchema),
    defaultValues,
    mode: "onChange",
  });
  
  const watchedHexCode = form.watch("hexCode");

  function onSubmit(data: ColorFormValues) {
    console.log(data);
    toast({
      title: color ? "Color Updated" : "Color Created",
      description: `The color "${data.name}" has been saved.`,
    });
    router.push('/products/colors');
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
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full">
              Save Color
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Color Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
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
            <FormField
              control={form.control}
              name="hexCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hex Code</FormLabel>
                  <div className="flex items-center gap-2">
                    <Input placeholder="#000000" {...field} />
                    <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: watchedHexCode }} />
                  </div>
                  <FormDescription>Include the leading # symbol.</FormDescription>
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
