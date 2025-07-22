
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Textarea } from "./ui/textarea";

const smsCampaignFormSchema = z.object({
  name: z.string().min(3, "Campaign name is required."),
  targetAudience: z.enum(["All", "Silver", "Gold", "Platinum"]),
  content: z.string().min(10, "Message content is required.").max(160, "Message must be 160 characters or less."),
});

type SmsCampaignFormValues = z.infer<typeof smsCampaignFormSchema>;

export function SmsCampaignForm() {
  const router = useRouter();
  const { toast } = useToast();
  
  const defaultValues: Partial<SmsCampaignFormValues> = {
    name: "",
    targetAudience: "All",
    content: "",
  };

  const form = useForm<SmsCampaignFormValues>({
    resolver: zodResolver(smsCampaignFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const messageContent = form.watch('content');
  const characterCount = messageContent.length;

  function onSubmit(data: SmsCampaignFormValues) {
    console.log(data);
    toast({
      title: "Campaign Sent!",
      description: `Your campaign "${data.name}" has been sent.`,
    });
    router.push('/crm/sms-campaigns');
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">New SMS Campaign</h1>
                 <p className="text-muted-foreground">Craft and send a new SMS to your customers.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full">Cancel</Button>
                <Button type="submit" className="w-full">Send Campaign</Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Campaign Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Campaign Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Summer Sale" {...field} />
                                </FormControl>
                                <FormDescription>An internal name for this campaign.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="targetAudience"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Target Audience</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Select an audience" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="All">All Customers</SelectItem>
                                        <SelectItem value="Silver">Silver Tier</SelectItem>
                                        <SelectItem value="Gold">Gold Tier</SelectItem>
                                        <SelectItem value="Platinum">Platinum Tier</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormDescription>Choose which customer group to target.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="md:col-span-2">
                             <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Message Content</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Write your SMS message here..."
                                            className="resize-y min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <div className="flex justify-between items-center">
                                        <FormMessage />
                                        <div className="text-xs text-muted-foreground">
                                            {characterCount} / 160
                                        </div>
                                    </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Phone Preview</CardTitle>
                        <CardDescription>This is how your message will look on a mobile device.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full max-w-[280px] mx-auto bg-slate-900 rounded-[40px] border-[10px] border-slate-700 shadow-2xl overflow-hidden">
                            <div className="h-[500px] bg-slate-100 dark:bg-slate-800 p-4">
                                <div className="space-y-4">
                                    <div className="flex justify-end">
                                        <div className="bg-blue-500 text-white p-3 rounded-2xl rounded-br-none max-w-[80%] break-words">
                                            <p className="text-sm">
                                                {messageContent || "Your message will appear here..."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </form>
    </Form>
  );
}
