
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
import type { Table as TableType } from '@/lib/types';
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
import { TableFormDialog } from '@/components/table-form-dialog';

export default function TablesPage() {
  const [tables, setTables] = useState<TableType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableType | null>(null);
  const { toast } = useToast();
  const { company_id, availableLocations } = useLocation();

  const fetchTables = async () => {
    if (!company_id) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const response = await fetch(`https://server-erp.payshia.com/master-tables/filter/by-company?company_id=${company_id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch tables');
        }
        const data = await response.json();
        setTables(data || []);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Failed to load tables',
            description: 'Could not fetch tables from the server.',
        });
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchTables();
  }, [company_id, toast]);

  const handleDelete = async () => {
    if (!selectedTable) return;

    try {
        const response = await fetch(`https://server-erp.payshia.com/master-tables/${selectedTable.id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete table');
        }
        setTables(tables.filter(t => t.id !== selectedTable.id));
        toast({
            title: 'Table Deleted',
            description: `The table "${selectedTable.table_name}" has been deleted.`,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: 'destructive',
            title: 'Failed to delete table',
            description: errorMessage,
        });
    } finally {
        setIsConfirmOpen(false);
        setSelectedTable(null);
    }
  };


  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dine-in Tables</h1>
            <p className="text-muted-foreground">
              Manage the tables available in your restaurant or store.
            </p>
          </div>
          <TableFormDialog onTableCreated={fetchTables}>
            <Button className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Table
            </Button>
          </TableFormDialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Tables</CardTitle>
            <CardDescription>
              A list of all dine-in tables for your locations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table Name</TableHead>
                  <TableHead>Location</TableHead>
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
                  tables.map((table) => (
                    <TableRow key={table.id}>
                      <TableCell className="font-medium">{table.table_name}</TableCell>
                      <TableCell>{availableLocations.find(l => l.location_id === table.location_id)?.location_name}</TableCell>
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
                             <TableFormDialog table={table} onTableCreated={fetchTables}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
                            </TableFormDialog>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onSelect={() => {
                                  setSelectedTable(table);
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
                 {!isLoading && tables.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                            No tables found.
                        </TableCell>
                    </TableRow>
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
              This action cannot be undone. This will permanently delete the table {' '}
              <span className="font-bold text-foreground">{selectedTable?.table_name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTable(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
