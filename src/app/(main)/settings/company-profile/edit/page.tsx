
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "@/components/location-provider";
import { Skeleton } from "@/components/ui/skeleton";

const companyFormSchema = z.object({
  company_name: z.string().min(3, "Company name is required."),
  company_address: z.string().min(3, "Address is required."),
  company_address2: z.string().optional(),
  company_city: z.string().min(2, "City is required."),
  company_postalcode: z.string().optional(),
  company_email: z.string().email("A valid email is required."),
  company_telephone: z.string().min(10, "A valid phone number is required."),
  company_telephone2: z.string().optional(),
  owner_name: z.string().optional(),
  job_position: z.string().optional(),
  website: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  description: z.string().optional(),
  vision: z.string().optional(),
  mission: z.string().optional(),
  founder_message: z.string().optional(),
  org_logo: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  founder_photo: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

export default function EditCompanyProfilePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const { company_id } = useLocation();

    const form = useForm<CompanyFormValues>({
        resolver: zodResolver(companyFormSchema),
    });

    useEffect(() => {
        if (!company_id) {
            setIsFetching(false);
            return;
        }
        async function fetchCompanyData() {
            setIsFetching(true);
            try {
                const response = await fetch(`https://server-erp.payshia.com/companies/${company_id}`);
                if (!response.ok) throw new Error('Failed to fetch company data');
                const data = await response.json();
                form.reset(data);
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not load company data.'
                });
            } finally {
                setIsFetching(false);
            }
        }
        fetchCompanyData();
    }, [company_id, form, toast]);

    async function onSubmit(data: CompanyFormValues) {
        if (!company_id) return;
        setIsLoading(true);
        
        try {
            const response = await fetch(`https://server-erp.payshia.com/companies/${company_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update company.');
            }
            
            toast({
                title: 'Company Profile Updated!',
                description: 'Your company details have been saved.',
            });
            
            const companyName = form.getValues('company_name');
            if (localStorage.getItem('companyName') !== companyName) {
                localStorage.setItem('companyName', companyName);
            }
            router.push('/settings/company-profile');
            router.refresh();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            toast({
                variant: 'destructive',
                title: 'Operation Failed',
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    }
    
    if (isFetching) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <Card>
                    <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                        </div>
                        <Skeleton className="h-10" />
                        <Skeleton className="h-10" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Edit Company Profile</h1>
                <p className="text-muted-foreground">Update your company's information and branding.</p>
            </div>
            <Card className="w-full max-w-4xl">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Company Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                        <FormField
                                control={form.control}
                                name="company_name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Company Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Payshia Software Solutions" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="owner_name"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Owner Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Samantha Perera" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="job_position"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Job Position</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. CEO" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="company_email"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Company Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="e.g. contact@yourcompany.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="website"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Website</FormLabel>
                                        <FormControl>
                                            <Input type="url" placeholder="e.g. https://payshia.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="company_telephone"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Primary Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. +94112233445" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="company_telephone2"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Secondary Phone (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. +94771234567" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="company_address"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Address Line 1</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. 123, Galle Road" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control}
                                    name="company_address2"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Address Line 2 (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Liberty Plaza" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="company_city"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Colombo" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="company_postalcode"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Postal Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 10100" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Company Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="A brief description of your company." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="org_logo"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Company Logo URL</FormLabel>
                                        <FormControl>
                                            <Input type="url" placeholder="https://example.com/logo.png" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="founder_photo"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Founder Photo URL</FormLabel>
                                        <FormControl>
                                            <Input type="url" placeholder="https://example.com/founder.png" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="founder_message"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Founder's Message (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="A message from the founder." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="mission"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Mission (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Your company's mission." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="vision"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Vision (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Your company's vision." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter className="justify-end gap-2">
                            <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}
