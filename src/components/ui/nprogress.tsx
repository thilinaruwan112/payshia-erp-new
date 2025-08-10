'use client';

import NProgress from 'nprogress';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// A component that displays a progress bar at the top of the page when navigating.
export function NProgressComponent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  // The 'useEffect' hook with an empty dependency array is used to ensure that
  // the 'NProgress.configure' and 'NProgress.start' functions are only called
  // on the client-side, after the component has mounted.
  useEffect(() => {
    NProgress.configure({ showSpinner: false });
    NProgress.start();
    const handleAnchorClick = (event: MouseEvent) => {
        const targetUrl = (event.currentTarget as HTMLAnchorElement).href;
        const currentUrl = window.location.href;
        if (targetUrl !== currentUrl) {
            NProgress.start();
        }
    };

    const handleMutation: MutationCallback = () => {
        const anchorElements = document.querySelectorAll('a');
        anchorElements.forEach(anchor => anchor.addEventListener('click', handleAnchorClick));
    };

    const mutationObserver = new MutationObserver(handleMutation);
    mutationObserver.observe(document, { childList: true, subtree: true });

    return () => {
        mutationObserver.disconnect();
    };
  }, []);

  return null;
}
