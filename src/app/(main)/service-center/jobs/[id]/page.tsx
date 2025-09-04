
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ArrowLeft, Printer, FileText } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";

const technicianReportSchema = z.object({
  technicianNotes: z.string().min(10, { message: "Technician notes must be at least 10 characters." }),
  partsUsed: z.string().optional(),
});

type TechnicianReportValues = z.infer<typeof technicianReportSchema>;

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data - In a real app, you would fetch this based on params.id
  const jobDetails = {
    id: params.id,
    customer: 'John Doe',
    item: 'Toyota Camry (ABC-1234)',
    reportedIssues: 'Customer states there is a loud grinding noise from the front-right wheel when braking. Also requests an oil change.',
    status: 'New',
    date: '2023-10-26',
    technicianReport: {
        notes: "",
        partsUsed: "",
    }
  };

  const form = useForm<TechnicianReportValues>({
    resolver: zodResolver(technicianReportSchema),
    defaultValues: {
      technicianNotes: jobDetails.technicianReport.notes,
      partsUsed: jobDetails.technicianReport.partsUsed,
    },
  });

  async function onSubmit(data: TechnicianReportValues) {
    setIsSubmitting(true);
    console.log({ jobId: params.id, ...data });
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: 'Technician Report Saved',
      description: `The report for job #${params.id} has been updated.`,
    });
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Job Details: {jobDetails.id}
          </h1>
          <p className="text-muted-foreground">
            View details and update the technician report.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button>
            <Printer className="mr-2 h-4 w-4" />
            Print Job Sheet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Job Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-semibold">{jobDetails.status}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Date Opened</span>
                        <span className="font-semibold">{jobDetails.date}</span>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Customer</p>
                        <p className="font-semibold">{jobDetails.customer}</p>
                    </div>
                     <div>
                        <p className="text-muted-foreground">Item</p>
                        <p className="font-semibold">{jobDetails.item}</p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Reported Issues</CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-muted-foreground">{jobDetails.reportedIssues}</p>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
           <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Technician's Report</CardTitle>
                        <CardDescription>
                            Enter the findings of the inspection and any parts used.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <FormField
                            control={form.control}
                            name="technicianNotes"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Technician Notes / Diagnosis</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="e.g. Front-right brake pads and rotor are worn and require replacement. Oil change completed..."
                                        className="resize-y min-h-[150px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="partsUsed"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Parts Used / Recommended</FormLabel>
                                <FormControl>
                                     <Textarea
                                        placeholder="e.g. - 1x Front Brake Pad Set&#10;- 1x Front Right Rotor&#10;- 4L 5W-30 Synthetic Oil&#10;- 1x Oil Filter"
                                        className="resize-y min-h-[100px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Report
                        </Button>
                    </CardFooter>
                </Card>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
