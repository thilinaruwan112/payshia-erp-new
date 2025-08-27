
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
import { MoreHorizontal, PlusCircle } from 'lucide-react';

// Mock data for roles
const roles = [
  { id: '1', name: 'Administrator', description: 'Has full access to all features.', userCount: 2 },
  { id: '2', name: 'Sales Agent', description: 'Can manage customers and sales orders.', userCount: 5 },
  { id: '3', name: 'Inventory Manager', description: 'Can manage products, stock, and purchasing.', userCount: 3 },
];

export function RoleManagement() {

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
                     <Button size="sm" variant="outline">
                        Edit Permissions
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
