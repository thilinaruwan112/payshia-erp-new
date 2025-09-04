
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import type { Model } from '@/lib/types';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLocation } from '@/components/location-provider';

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const { toast } = useToast();
  const { company_id } = useLocation();

  useEffect(() => {
    async function fetchModels() {
      if (!company_id) {
        setIsLoading(false);
        return;
      };
      setIsLoading(true);
      try {
        const response = await fetch(`https://server-erp.payshia.com/master-models/company?company_id=${company_id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch models');
        }
        const data = await response.json();
        setModels(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load models',
          description: 'Could not fetch models from the server.',
        });
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchModels();
  }, [toast, company_id]);

  const handleDelete = async () => {
    if (!selectedModel) return;

    try {
        const response = await fetch(`https://server-erp.payshia.com/master-models/${selectedModel.id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete model');
        }
        setModels(models.filter(b => b.id !== selectedModel.id));
        toast({
            title: 'Model Deleted',
            description: `The model "${selectedModel.name}" has been deleted.`,
        });
    } catch (error) {
         const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: 'destructive',
            title: 'Failed to delete model',
            description: errorMessage,
        });
    } finally {
        setIsConfirmOpen(false);
        setSelectedModel(null);
    }
  };


  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Models</h1>
            <p className="text-muted-foreground">
              Manage your product models.
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/products/models/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Model
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Models</CardTitle>
            <CardDescription>
              A list of all models in your system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-64" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  models.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">{model.name}</TableCell>
                      <TableCell>{model.description}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/products/models/${model.id}`}>
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onSelect={() => {
                                  setSelectedModel(model);
                                  setIsConfirmOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

       <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the model {' '}
              <span className="font-bold text-foreground">{selectedModel?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedModel(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
