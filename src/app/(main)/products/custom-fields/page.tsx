
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

interface CustomField {
    id: string;
    field_name: string;
    description: string;
}

export default function CustomFieldsPage() {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<CustomField | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCustomFields() {
      setIsLoading(true);
      try {
        const response = await fetch('https://server-erp.payshia.com/custom-fields/filter/by-company?company_id=1');
        if (!response.ok) {
          throw new Error('Failed to fetch custom fields');
        }
        const data = await response.json();
        setCustomFields(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load custom fields',
          description: 'Could not fetch custom fields from the server.',
        });
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCustomFields();
  }, [toast]);

  const handleDelete = async () => {
    if (!selectedField) return;

    try {
        const response = await fetch(`https://server-erp.payshia.com/custom-fields/${selectedField.id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete custom field');
        }
        setCustomFields(customFields.filter(f => f.id !== selectedField.id));
        toast({
            title: 'Custom Field Deleted',
            description: `The field "${selectedField.field_name}" has been deleted.`,
        });
    } catch (error) {
         const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: 'destructive',
            title: 'Failed to delete field',
            description: errorMessage,
        });
    } finally {
        setIsConfirmOpen(false);
        setSelectedField(null);
    }
  };


  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Custom Fields</h1>
            <p className="text-muted-foreground">
              Manage your custom fields for your products.
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/products/custom-fields/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Field
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Custom Fields</CardTitle>
            <CardDescription>
              A list of all custom fields in your system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field Name</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  customFields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell className="font-medium">{field.field_name}</TableCell>
                      <TableCell>{field.description}</TableCell>
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
                            <DropdownMenuItem 
                              className="text-destructive"
                              onSelect={() => {
                                  setSelectedField(field);
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
              This action cannot be undone. This will permanently delete the custom field {' '}
              <span className="font-bold text-foreground">{selectedField?.field_name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedField(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
