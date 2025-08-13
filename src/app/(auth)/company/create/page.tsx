
'use client'

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
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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

export default function CreateCompanyPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<CompanyFormValues>({
        resolver: zodResolver(companyFormSchema),
        defaultValues: {
            company_name: "",
            company_address: "",
            company_email: "",
            company_telephone: "",
        },
    });

    async function onSubmit(data: CompanyFormValues) {
        setIsLoading(true);
        const userId = localStorage.getItem('pendingUserId');

        if (!userId) {
            toast({
                variant: 'destructive',
                title: 'Session Error',
                description: 'Could not find user information. Please log in again.'
            });
            router.push('/login');
            return;
        }

        const companyPayload = {
            ...data,
            is_active: 1,
            created_by: 'admin'
        };

        try {
            const companyResponse = await fetch('https://server-erp.payshia.com/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(companyPayload),
            });

            if (!companyResponse.ok) {
                const errorData = await companyResponse.json();
                throw new Error(errorData.message || 'Failed to create company.');
            }
            
            const companyResult = await companyResponse.json();
            const companyId = companyResult.data.id;

            const associationPayload = {
                company_id: companyId,
                user_id: parseInt(userId, 10),
                created_by: 'admin',
            };

            const associationResponse = await fetch('https://server-erp.payshia.com/company-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(associationPayload),
            });

            if (!associationResponse.ok) {
                 const errorData = await associationResponse.json();
                 throw new Error(errorData.message || 'Company created, but failed to associate user.');
            }

            toast({
                title: 'Company Created!',
                description: 'Your company has been set up successfully. Redirecting to dashboard...',
            });
            
            localStorage.removeItem('pendingUserId');
            router.push('/dashboard');

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

    return (
        <Card className="w-full max-w-3xl">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle className="text-2xl">Create Your Company</CardTitle>
                        <CardDescription>
                            Let's set up your company profile to get you started with the ERP.
                        </CardDescription>
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
                    <CardFooter className="flex justify-end">
                        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Company & Continue
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
