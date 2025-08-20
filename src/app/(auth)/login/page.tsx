
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
        const response = await fetch('https://server-erp.payshia.com/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Invalid credentials. Please try again.');
        }

        const userData = await response.json();
        const userId = userData?.data?.id;
        const userName = userData?.data?.user_name;

        if (!userId || !userName) {
             throw new Error('Login successful, but user ID or name was not returned.');
        }
        
        // Check for company association
        const companyCheckResponse = await fetch(`https://server-erp.payshia.com/company-users/filter/by-user?user_id=${userId}`);
        
        if (!companyCheckResponse.ok) {
            throw new Error('Failed to check for company association.');
        }

        const companyData = await companyCheckResponse.json();
        
        // Clear any previous company data
        localStorage.removeItem('companyId');
        localStorage.removeItem('companyName');

        if (companyData.status === 'success' && companyData.has_company && companyData.data && companyData.data.length > 0) {
            const companyLink = companyData.data[0];
            const companyId = companyLink.company_id;

            // Fetch company details to get the name
            const companyDetailsResponse = await fetch(`https://server-erp.payshia.com/companies/${companyId}`);
            if (!companyDetailsResponse.ok) {
                throw new Error('Found company association, but failed to fetch company details.');
            }
            const companyDetails = await companyDetailsResponse.json();
            const companyName = companyDetails.company_name;

            // Store company info
            localStorage.setItem('companyId', companyId);
            localStorage.setItem('companyName', companyName);

            toast({
                title: 'Login Successful!',
                description: 'Welcome back!',
            });
            router.push('/dashboard');
        } else {
             toast({
                title: 'Login Successful!',
                description: 'Welcome! Please create a company to continue.',
            });
            // Store user ID and name to associate with company later
            localStorage.setItem('pendingUserId', userId);
            localStorage.setItem('pendingUserName', userName);
            router.push('/company/create');
        }


    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: errorMessage,
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Link href="/" className="flex items-center gap-2 font-bold text-2xl mb-4">
        <Truck className="h-8 w-8 text-primary" />
        <span>Payshia ERP</span>
      </Link>
      <Card className="w-full max-w-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>
                Enter your email below to login to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="m@example.com" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
              <div className="text-center text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="underline">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
