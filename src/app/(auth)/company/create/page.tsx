
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
  company_address_line1: z.string().min(3, "Address is required."),
  company_address_line2: z.string().optional(),
  company_city: z.string().min(2, "City is required."),
  company_email: z.string().email("A valid email is required."),
  company_phone: z.string().min(10, "A valid phone number is required."),
  company_crn: z.string().optional(),
  company_vat_number: z.string().optional(),
  description: z.string().optional(),
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
            company_address_line1: "",
            company_email: "",
            company_phone: "",
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
            const companyResponse = await fetch('https://server-erp.payshia.com/company', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(companyPayload),
            });

            if (!companyResponse.ok) {
                const errorData = await companyResponse.json();
                throw new Error(errorData.message || 'Failed to create company.');
            }
            
            const companyResult = await companyResponse.json();
            const companyId = companyResult.company.id;

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
                                name="company_phone"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Company Phone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. +94112233445" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="company_address_line1"
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={form.control}
                                name="company_address_line2"
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
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={form.control}
                                name="company_crn"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Company Registration No. (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. PV00123456" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="company_vat_number"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>VAT Number (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. 1122334455-7000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
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
