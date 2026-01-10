
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page is deprecated and functionality has been moved to the main reports page.
// This component will now just redirect.
export default function DeprecatedCreditSalesSummaryPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/reports?report=Credit%20Sales%20Summary%20Report');
  }, [router]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Credit Sales Summary</h1>
        <p className="text-muted-foreground">
          Redirecting...
        </p>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Redirecting</CardTitle>
            <CardDescription>This report has been moved to the main reports center.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Please wait while you are redirected to the new, centralized reports page.</p>
        </CardContent>
       </Card>
    </div>
  );
}
