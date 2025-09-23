
'use client';

import { useEffect, useState } from 'react';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import type { Company } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Mail, Globe, Phone, User, Briefcase, Pencil } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { fetcher } from '@/lib/api';

interface InfoLineProps {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}

const InfoLine = ({ icon: Icon, label, value }: InfoLineProps) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-1" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
};

export default function CompanyProfilePage() {
  const { company_id } = useLocation();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!company_id) {
        setIsLoading(false);
        return;
    };
    async function fetchCompanyData() {
        setIsLoading(true);
        try {
            const response = await fetcher(`https://server-erp.payshia.com/companies/${company_id}`);
            if (!response.ok) throw new Error('Failed to fetch company data');
            const data = await response.json();
            setCompany(data);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not load company data.'
            });
        } finally {
            setIsLoading(false);
        }
    }
    fetchCompanyData();
  }, [company_id, toast]);

  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                 <Skeleton className="h-9 w-64" />
                 <Skeleton className="h-10 w-24" />
            </div>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <div className="space-y-2">
                             <Skeleton className="h-7 w-72" />
                             <Skeleton className="h-5 w-48" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-8">
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!company) {
    return <p>No company data found.</p>
  }
  
  const companyLogoUrl = company.org_logo && company.org_logo !== "no-logo.png" 
    ? `${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${company.org_logo}`
    : `https://placehold.co/100x100.png?text=${company.company_name.charAt(0)}`;


  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Company Profile</h1>
                <p className="text-muted-foreground">Manage your company's information and branding.</p>
            </div>
             <Button asChild>
                <Link href="/settings/company-profile/edit">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Profile
                </Link>
            </Button>
        </div>
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center gap-6">
                    <Image src={companyLogoUrl} alt={`${company.company_name} Logo`} width={100} height={100} className="rounded-lg border bg-muted" data-ai-hint="logo" />
                    <div>
                        <CardTitle className="text-3xl">{company.company_name}</CardTitle>
                        <CardDescription className="text-base">{company.description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                         <h3 className="text-lg font-semibold text-primary border-b pb-2">Contact Information</h3>
                        <InfoLine icon={Building2} label="Address" value={`${company.company_address}, ${company.company_city}`} />
                        <InfoLine icon={Mail} label="Email" value={company.company_email} />
                        <InfoLine icon={Phone} label="Phone" value={company.company_telephone} />
                         <InfoLine icon={Globe} label="Website" value={company.website} />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-primary border-b pb-2">Leadership</h3>
                        <InfoLine icon={User} label="Owner / CEO" value={company.owner_name} />
                        <InfoLine icon={Briefcase} label="Position" value={company.job_position} />
                    </div>
                </div>

                 <div className="space-y-4 pt-6">
                    <h3 className="text-lg font-semibold text-primary border-b pb-2">Company Statements</h3>
                     <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                        {company.mission && <div><h4>Mission</h4><p>{company.mission}</p></div>}
                        {company.vision && <div><h4>Vision</h4><p>{company.vision}</p></div>}
                        {company.founder_message && <div><h4>Founder's Message</h4><p>{company.founder_message}</p></div>}
                     </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
