
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
import { PlusCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Role } from '@/lib/types';
import { useLocation } from '../location-provider';
import { useToast } from '@/hooks/use-toast';
import { fetcher } from '@/lib/api';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';
import { RoleFormDialog } from './role-form-dialog';

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { company_id } = useLocation();
  const { toast } = useToast();
  
  const fetchRoles = async () => {
    if (!company_id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles?company_id=${company_id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      const result = await response.json();
      if (result.status === 'success') {
        // Initialize userCount for client-side state
        const formattedRoles = result.data.map((role: any) => ({
          ...role,
          userCount: 0, // API doesn't provide this, so we default it
        }));
        setRoles(formattedRoles);
      } else {
        throw new Error(result.message || 'API did not return a success status.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        variant: 'destructive',
        title: 'Error loading roles',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchRoles();
  }, [company_id, toast]);


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <CardTitle>All Roles</CardTitle>
                <CardDescription>A list of all user roles in your company.</CardDescription>
            </div>
            <RoleFormDialog onRoleCreated={fetchRoles}>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Role
                </Button>
            </RoleFormDialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="hidden sm:table-cell">Users</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-32" /></TableCell>
                    </TableRow>
                ))
            ) : roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell className="hidden sm:table-cell">{role.userCount}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                        <Link href={`/settings/roles/${role.id}`}>
                            Edit Permissions
                        </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
