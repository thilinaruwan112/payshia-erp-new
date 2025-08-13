
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

const registerFormSchema = z.object({
  first_name: z.string().min(2, { message: "First name must be at least 2 characters." }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  user_name: z.string().min(3, { message: "Username must be at least 3 characters." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  sex: z.string().min(1, { message: "Please select a gender." }),
  addressl1: z.string().min(3, { message: "Address is required." }),
  addressl2: z.string().optional(),
  city: z.string().min(2, { message: "City is required." }),
  PNumber: z.string().min(10, { message: "A valid phone number is required." }),
  WPNumber: z.string().optional(),
  civil_status: z.string().min(1, { message: "Please select a civil status." }),
  nic_number: z.string().min(10, { message: "NIC number is required." }),
  img_path: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
        email: '',
        user_name: '',
        password: '',
        first_name: '',
        last_name: '',
        sex: 'Male',
        addressl1: '',
        addressl2: '',
        city: '',
        PNumber: '',
        WPNumber: '',
        civil_status: 'Single',
        nic_number: '',
        img_path: '',
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    
    const payload = {
        ...data,
        pass: data.password,
        user_status: 'Active',
        acc_type: 'user',
        update_by: 'system',
    };

    try {
        const response = await fetch('https://server-erp.payshia.com/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create account. Please try again.');
        }

        toast({
            title: 'Account Created!',
            description: 'Your account has been successfully created. Please log in.',
        });
        router.push('/login');

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: 'destructive',
            title: 'Registration Failed',
            description: errorMessage,
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <Link href="/" className="flex items-center gap-2 font-bold text-2xl mb-4">
        <Truck className="h-8 w-8 text-primary" />
        <span>Payshia ERP</span>
      </Link>
      <Card className="w-full max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="text-xl">Create your Account</CardTitle>
              <CardDescription>
                Enter your information to create a user account.
              </CardDescription>
            </CardHeader>
            <CardContent>
             <ScrollArea className="h-[50vh] pr-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="first_name" render={({ field }) => (
                        <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="last_name" render={({ field }) => (
                        <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                 <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="m@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="user_name" render={({ field }) => (
                        <FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="johndoe" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="PNumber" render={({ field }) => (
                        <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+94712345678" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="WPNumber" render={({ field }) => (
                        <FormItem><FormLabel>WhatsApp Number (Optional)</FormLabel><FormControl><Input placeholder="+94712345678" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                <FormField control={form.control} name="addressl1" render={({ field }) => (
                    <FormItem><FormLabel>Address Line 1</FormLabel><FormControl><Input placeholder="123 Main Street" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="addressl2" render={({ field }) => (
                        <FormItem><FormLabel>Address Line 2 (Optional)</FormLabel><FormControl><Input placeholder="Apt 4B" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Colombo" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="nic_number" render={({ field }) => (
                        <FormItem><FormLabel>NIC Number</FormLabel><FormControl><Input placeholder="199012345678" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="civil_status" render={({ field }) => (
                        <FormItem><FormLabel>Civil Status</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Single">Single</SelectItem>
                                    <SelectItem value="Married">Married</SelectItem>
                                </SelectContent>
                            </Select>
                        <FormMessage /></FormItem>
                    )}/>
                </div>
                 <FormField control={form.control} name="sex" render={({ field }) => (
                    <FormItem><FormLabel>Gender</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                        </Select>
                    <FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="img_path" render={({ field }) => (
                    <FormItem><FormLabel>Profile Image URL (Optional)</FormLabel><FormControl><Input type="url" placeholder="https://example.com/profile.png" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
              <div className="text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="underline">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
