
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Plan } from "@/lib/types";
import { Textarea } from "./ui/textarea";
import { Trash2 } from "lucide-react";

const planFormSchema = z.object({
  name: z.string().min(3, "Plan name must be at least 3 characters."),
  description: z.string().min(10, "Description is required."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  ctaLabel: z.string().min(3, "CTA label is required."),
  limits: z.object({
      orders: z.coerce.number().min(0, "Must be a positive number."),
      products: z.coerce.number().min(0, "Must be a positive number."),
      locations: z.coerce.number().min(0, "Must be a positive number."),
  }),
  features: z.array(z.object({ value: z.string().min(3, "Feature cannot be empty.") })),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

interface PlanFormProps {
    plan?: Plan;
}

export function PlanForm({ plan }: PlanFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const defaultValues: Partial<PlanFormValues> = {
    name: plan?.name || "",
    description: plan?.description || "",
    price: plan?.price,
    ctaLabel: plan?.ctaLabel || "",
    limits: {
        orders: plan?.limits.orders === Infinity ? -1 : plan?.limits.orders || 0,
        products: plan?.limits.products === Infinity ? -1 : plan?.limits.products || 0,
        locations: plan?.limits.locations === Infinity ? -1 : plan?.limits.locations || 0,
    },
    // Filter out generated features from the form display
    features: plan?.features.filter(f => !f.toLowerCase().includes(' up to ') && !f.toLowerCase().includes(' location')).map(f => ({ value: f })) || [{ value: "" }],
  };

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "features",
  });

  function onSubmit(data: PlanFormValues) {
    // A real implementation would save this to a database
    console.log(data);
    toast({
      title: plan ? "Plan Updated" : "Plan Created",
      description: `The plan "${data.name}" has been saved.`,
    });
    router.push('/billing/plans');
  }

  const pageTitle = plan ? 'Edit Plan' : 'Create Plan';
  const pageDescription = plan ? 'Update the details of this subscription plan.' : 'Add a new subscription plan.';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">{pageTitle}</h1>
                 <p className="text-muted-foreground">{pageDescription}</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full">Cancel</Button>
                <Button type="submit" className="w-full">Save Plan</Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Plan Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Plan Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Pro Plan" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Price (/month)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g. 79" {...field} startIcon="$" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="A short description of the plan." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="ctaLabel"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>CTA Button Label</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Upgrade to Pro" {...field} />
                                    </FormControl>
                                    <FormDescription>The text on the call-to-action button.</FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Plan Limits</CardTitle>
                        <CardDescription>Set the numeric limits for this plan. Use -1 for unlimited.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <FormField
                            control={form.control}
                            name="limits.products"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product Limit</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g. 500" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="limits.locations"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location Limit</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g. 2" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="limits.orders"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Order Limit (/mo)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g. 1000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </div>


            <Card>
                <CardHeader>
                    <CardTitle>Additional Features</CardTitle>
                    <CardDescription>List any other marketing points or features for this plan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                            <FormField
                                control={form.control}
                                name={`features.${index}.value`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                    <FormControl>
                                        <Input placeholder="e.g. Priority Support" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {fields.length > 1 && (
                                <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ value: "" })}
                        className="mt-2"
                    >
                        Add Feature
                    </Button>
                </CardContent>
            </Card>
        </div>
      </form>
    </Form>
  );
}
