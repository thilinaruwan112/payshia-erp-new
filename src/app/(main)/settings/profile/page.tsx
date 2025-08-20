
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
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

const profileFormSchema = z.object({
  first_name: z.string().min(2, { message: "First name must be at least 2 characters." }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  user_name: z.string().min(3, { message: "Username must be at least 3 characters." }),
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

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('userId');
    setUserId(id);
  }, []);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
  });

  useEffect(() => {
    async function fetchUserData() {
      if (!userId) {
          setIsLoading(false);
          return
      };
      
      try {
        const response = await fetch(`https://server-erp.payshia.com/users/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user data.');
        }
        const result = await response.json();
        if (result.status === 'success') {
          form.reset(result.data);
        } else {
          throw new Error(result.message || 'Failed to parse user data.');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({ variant: 'destructive', title: 'Error', description: errorMessage });
      } finally {
        setIsLoading(false);
      }
    }
    fetchUserData();
  }, [userId, form, toast]);

  async function onSubmit(data: ProfileFormValues) {
    if (!userId) return;
    setIsSubmitting(true);
    
    const payload = {
      ...data,
      update_by: 'user', // Assuming the user is updating their own profile
    };

    try {
        const response = await fetch(`https://server-erp.payshia.com/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update profile.');
        }

        toast({
            title: 'Profile Updated!',
            description: 'Your profile has been successfully updated.',
        });
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const watchedImagePath = form.watch('img_path');

  if (isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Card>
                <CardHeader><Skeleton className="h-20 w-20 rounded-full" /></CardHeader>
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
            <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
            <p className="text-muted-foreground">Manage your personal information and account settings.</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-6">
                         <Avatar className="h-24 w-24">
                            <AvatarImage src={watchedImagePath || undefined} data-ai-hint="profile photo"/>
                            <AvatarFallback className="text-3xl">
                                {form.getValues().first_name?.charAt(0)}{form.getValues().last_name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                             <CardTitle className="text-2xl">{form.getValues().first_name} {form.getValues().last_name}</CardTitle>
                             <CardDescription>@{form.getValues().user_name}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <FormField control={form.control} name="img_path" render={({ field }) => (
                            <FormItem><FormLabel>Profile Image URL</FormLabel><FormControl><Input type="url" placeholder="https://example.com/profile.png" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
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
                            <FormField control={form.control} name="nic_number" render={({ field }) => (
                                <FormItem><FormLabel>NIC Number</FormLabel><FormControl><Input placeholder="199012345678" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="PNumber" render={({ field }) => (
                                <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+94712345678" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="WPNumber" render={({ field }) => (
                                <FormItem><FormLabel>WhatsApp Number</FormLabel><FormControl><Input placeholder="+94712345678" {...field} /></FormControl><FormMessage /></FormItem>
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
                             <FormField control={form.control} name="civil_status" render={({ field }) => (
                                <FormItem><FormLabel>Civil Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Single">Single</SelectItem>
                                            <SelectItem value="Married">Married</SelectItem>
                                        </SelectContent>
                                    </Select>
                                <FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="sex" render={({ field }) => (
                                <FormItem><FormLabel>Gender</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                <FormMessage /></FormItem>
                            )}/>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>
          </form>
        </Form>
    </div>
  );
}
