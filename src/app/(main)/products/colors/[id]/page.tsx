
'use client'

import { ColorForm } from '@/components/color-form';
import { useToast } from '@/hooks/use-toast';
import { type Color } from '@/lib/types';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function EditColorPage({ params }: { params: { id: string } }) {
  const [color, setColor] = useState<Color | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchColor() {
      if (!params.id) return;
      setIsLoading(true);
      try {
        const response = await fetch(`https://server-erp.payshia.com/colors/${params.id}`);
        if (!response.ok) {
           if (response.status === 404) {
             notFound();
           }
          throw new Error('Failed to fetch color data');
        }
        const data = await response.json();
        setColor(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load color',
          description: 'Could not fetch color data from the server.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchColor();
  }, [params.id, toast]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <Skeleton className="h-9 w-64" />
                 <Skeleton className="h-4 w-80 mt-2" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                 <Skeleton className="h-10 w-24" />
                 <Skeleton className="h-10 w-24" />
            </div>
        </div>
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!color) {
    return <div>Could not load color data. It might have been deleted.</div>;
  }

  return <ColorForm color={color} />;
}
