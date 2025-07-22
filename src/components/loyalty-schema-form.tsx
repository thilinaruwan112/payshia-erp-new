
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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const loyaltySchemaFormSchema = z.object({
  silver: z.coerce.number().min(0, "Points must be a positive number."),
  gold: z.coerce.number().min(0, "Points must be a positive number."),
  platinum: z.coerce.number().min(0, "Points must be a positive number."),
}).refine(data => data.gold > data.silver, {
    message: "Gold tier must have more points than Silver.",
    path: ["gold"],
}).refine(data => data.platinum > data.gold, {
    message: "Platinum tier must have more points than Gold.",
    path: ["platinum"],
});

type LoyaltySchemaFormValues = z.infer<typeof loyaltySchemaFormSchema>;

const defaultValues: Partial<LoyaltySchemaFormValues> = {
    silver: 100,
    gold: 250,
    platinum: 500,
};

export function LoyaltySchemaForm() {
  const { toast } = useToast();
  const form = useForm<LoyaltySchemaFormValues>({
    resolver: zodResolver(loyaltySchemaFormSchema),
    defaultValues,
    mode: "onChange",
  });

  function onSubmit(data: LoyaltySchemaFormValues) {
    console.log(data);
    toast({
      title: "Loyalty Schema Updated",
      description: "The point thresholds for loyalty tiers have been saved.",
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Tier Point Thresholds</CardTitle>
            <CardDescription>
              Set the minimum number of points a customer needs to reach each loyalty tier.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="silver"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Silver Tier</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    The minimum points required to achieve Silver status.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="gold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gold Tier</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    The minimum points required to achieve Gold status.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="platinum"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platinum Tier</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                   <FormDescription>
                    The minimum points required to achieve Platinum status.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit">Save Schema</Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
