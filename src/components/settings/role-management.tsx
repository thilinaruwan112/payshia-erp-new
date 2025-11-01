
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
import { PermissionEditDialog } from './permission-edit-dialog';
import type { Role } from '@/lib/types';
import { useLocation } from '../location-provider';
import { useToast } from '@/hooks/use-toast';
import { fetcher } from '@/lib/api';
import { Skeleton } from '../ui/skeleton';

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { company_id } = useLocation();
  const { toast } = useToast();
  
  const handlePermissionsUpdate = (roleId: string, updatedPermissions: string[]) => {
    setRoles(prevRoles => prevRoles.map(role => 
        role.id === roleId ? { ...role, permissions: updatedPermissions } : role
    ));
  };

  useEffect(() => {
    async function fetchRoles() {
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
          // Initialize userCount and permissions for client-side state
          const formattedRoles = result.data.map((role: any) => ({
            ...role,
            userCount: 0, // API doesn't provide this, so we default it
            permissions: [], // Permissions will be managed client-side for now
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
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Role
            </Button>
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
                    <PermissionEditDialog role={role} onPermissionsUpdate={handlePermissionsUpdate}>
                        <Button size="sm" variant="outline">
                            Edit Permissions
                        </Button>
                    </PermissionEditDialog>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
