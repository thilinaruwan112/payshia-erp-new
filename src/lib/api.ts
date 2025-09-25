// src/lib/api.ts

import { toast } from "@/hooks/use-toast";

export async function fetcher(url: string, options?: RequestInit) {
  const token = localStorage.getItem('token');

  const headers = new Headers(options?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Only set Content-Type if it's not FormData
  if (options?.body && !(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Unauthorized, likely expired token
    toast({
      variant: 'destructive',
      title: 'Session Expired',
      description: 'Your session has expired. Please log in again.',
    });
    // Clear session and redirect to login
    localStorage.clear();
    window.location.href = '/login';
    // Throw an error to stop further processing in the component
    throw new Error('Session expired');
  }

  return response;
}
