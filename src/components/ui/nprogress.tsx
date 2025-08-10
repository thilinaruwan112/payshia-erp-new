
'use client';

import NProgress from 'nprogress';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function NProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
    return () => {
      NProgress.start();
    };
  }, [pathname, searchParams]);
  
  useEffect(() => {
     NProgress.done();
  }, [])

  return null;
}


// A component that displays a progress bar at the top of the page when navigating.
export function NProgressComponent() {
  return (
    <Suspense>
        <NProgressInner />
    </Suspense>
  )
}
