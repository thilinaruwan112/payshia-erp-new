
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import LandingPage from '@/components/landing-page';

export default function RootPage() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Check for authentication status
    const userId = localStorage.getItem('userId');
    if (userId) {
      router.replace('/dashboard');
    } else {
      setIsVerifying(false);
    }
  }, [router]);

  if (isVerifying) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in, show the public landing page.
  return <LandingPage />;
}
