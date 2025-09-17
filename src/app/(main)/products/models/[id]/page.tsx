'use client'

import { ModelForm } from '@/components/model-form';
import { useToast } from '@/hooks/use-toast';
import { type Model } from '@/lib/types';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { fetcher } from '@/lib/api';

export default function EditModelPage({ params }: { params: { id: string } }) {
  const [model, setModel] = useState<Model | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { id } = params;

  useEffect(() => {
    async function fetchModel() {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await fetcher(`https://server-erp.payshia.com/master-models/${id}`);
        if (!response.ok) {
           if (response.status === 404) {
             notFound();
           }
          throw new Error('Failed to fetch model data');
        }
        const data = await response.json();
        setModel(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load model',
          description: 'Could not fetch model data from the server.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchModel();
  }, [id, toast]);

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
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!model) {
    return <div>Could not load model data. It might have been deleted.</div>;
  }

  return <ModelForm model={model} />;
}
