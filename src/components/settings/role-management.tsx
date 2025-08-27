
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
import { useState } from 'react';
import { PermissionEditDialog } from './permission-edit-dialog';
import type { Role } from '@/lib/types';


const initialRoles: Role[] = [
  { id: '1', name: 'Super Admin', description: 'Has full, unrestricted access to all features.', userCount: 1, permissions: ['*:*'] },
  { id: '2', name: 'Admin', description: 'Has access to most features, excluding critical system settings.', userCount: 1, permissions: ['sales:view', 'sales:create', 'sales:edit', 'sales:delete', 'crm:view', 'crm:create', 'crm:edit', 'crm:delete', 'inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete', 'inventory:transfer', 'purchasing:view', 'purchasing:create', 'purchasing:approve', 'purchasing:receive', 'settings:view', 'settings:edit', 'settings:users'] },
  { id: '3', name: 'Sales Agent', description: 'Can manage customers and sales orders.', userCount: 5, permissions: ['sales:view', 'sales:create', 'crm:view', 'crm:create', 'crm:edit'] },
  { id: '4', name: 'Inventory Manager', description: 'Can manage products, stock, and purchasing.', userCount: 3, permissions: ['inventory:view', 'inventory:create', 'inventory:edit', 'purchasing:view', 'purchasing:create', 'purchasing:receive'] },
];

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  
  const handlePermissionsUpdate = (roleId: string, updatedPermissions: string[]) => {
    setRoles(prevRoles => prevRoles.map(role => 
        role.id === roleId ? { ...role, permissions: updatedPermissions } : role
    ));
  };


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
            {roles.map((role) => (
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
