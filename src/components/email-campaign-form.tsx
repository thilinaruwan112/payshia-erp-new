
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

const emailCampaignFormSchema = z.object({
  name: z.string().min(3, "Campaign name is required."),
  subject: z.string().min(3, "Subject line is required."),
  targetAudience: z.enum(["All", "Silver", "Gold", "Platinum", "Custom"]),
  content: z.string().min(20, "Email content is required."),
});

type EmailCampaignFormValues = z.infer<typeof emailCampaignFormSchema>;

export function EmailCampaignForm() {
  const router = useRouter();
  const { toast } = useToast();
  
  const defaultValues: Partial<EmailCampaignFormValues> = {
    name: "",
    subject: "",
    targetAudience: "All",
    content: "",
  };

  const form = useForm<EmailCampaignFormValues>({
    resolver: zodResolver(emailCampaignFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const emailContent = form.watch('content');

  function onSubmit(data: EmailCampaignFormValues) {
    console.log(data);
    toast({
      title: "Campaign Sent!",
      description: `Your email campaign "${data.name}" has been sent.`,
    });
    router.push('/crm/email-campaigns');
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">New Email Campaign</h1>
                 <p className="text-muted-foreground">Craft and send a new email to your customers.</p>
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
                                    <Input placeholder="e.g. End of Year Sale" {...field} />
                                </FormControl>
                                <FormDescription>An internal name for this campaign.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Subject Line</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Don't miss these deals!" {...field} />
                                </FormControl>
                                <FormDescription>The subject of the email.</FormDescription>
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
                                        <SelectItem value="Custom">Custom</SelectItem>
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
                                    <FormLabel>Email Body</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Write your email content here. HTML is supported."
                                            className="resize-y min-h-[250px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
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
                        <CardTitle>Email Preview</CardTitle>
                        <CardDescription>This is a rough preview of your email.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full border rounded-lg overflow-hidden">
                            <div className="p-4 bg-muted text-sm text-muted-foreground">
                                <p>To: [Customer Name]</p>
                                <p>From: Payshia ERP &lt;no-reply@payshia.com&gt;</p>
                            </div>
                            <div className="p-4">
                                <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: emailContent || "<p>Your email content will appear here...</p>" }}>
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
