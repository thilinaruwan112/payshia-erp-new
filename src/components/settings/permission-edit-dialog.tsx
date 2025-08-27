
'use client';

import React, { useState } from 'react';
import type { Role } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

const allPermissions = [
  {
    category: 'Sales',
    permissions: [
      { id: 'sales:view', label: 'View Sales Data (Invoices, Orders)' },
      { id: 'sales:create', label: 'Create Invoices & Orders' },
      { id: 'sales:edit', label: 'Edit Invoices & Orders' },
      { id: 'sales:delete', label: 'Delete Invoices & Orders' },
    ],
  },
  {
    category: 'CRM',
    permissions: [
      { id: 'crm:view', label: 'View Customers' },
      { id: 'crm:create', label: 'Create New Customers' },
      { id: 'crm:edit', label: 'Edit Customer Profiles' },
      { id: 'crm:delete', label: 'Delete Customers' },
    ],
  },
  {
    category: 'Inventory',
    permissions: [
      { id: 'inventory:view', label: 'View Products & Stock Levels' },
      { id: 'inventory:create', label: 'Create New Products' },
      { id: 'inventory:edit', label: 'Edit Product Details' },
      { id: 'inventory:delete', label: 'Delete Products' },
      { id: 'inventory:transfer', label: 'Perform Stock Transfers' },
    ],
  },
  {
    category: 'Purchasing',
    permissions: [
        { id: 'purchasing:view', label: 'View Purchase Orders & GRNs' },
        { id: 'purchasing:create', label: 'Create Purchase Orders' },
        { id: 'purchasing:approve', label: 'Approve Purchase Orders' },
        { id: 'purchasing:receive', label: 'Create Goods Received Notes (GRN)' },
    ]
  },
  {
    category: 'Settings',
    permissions: [
        { id: 'settings:view', label: 'View Company Settings' },
        { id: 'settings:edit', label: 'Edit Company Settings' },
        { id: 'settings:users', label: 'Manage Users & Roles' },
    ]
  },
   {
    category: 'Admin',
    permissions: [
        { id: '*:*', label: 'Full Access (All Permissions)' },
    ]
  }
];


interface PermissionEditDialogProps {
  children: React.ReactNode;
  role: Role;
  onPermissionsUpdate: (roleId: string, permissions: string[]) => void;
}

export function PermissionEditDialog({
  children,
  role,
  onPermissionsUpdate,
}: PermissionEditDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    role.permissions || []
  );
  
  const isSuperAdmin = selectedPermissions.includes('*:*');

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setSelectedPermissions((prev) => {
        if (permissionId === '*:*') {
            return checked ? ['*:*'] : [];
        }
        if (checked) {
            return [...prev, permissionId];
        } else {
            return prev.filter((p) => p !== permissionId);
        }
    });
  };

  const handleSaveChanges = () => {
    // In a real app, this would be an API call.
    onPermissionsUpdate(role.id, selectedPermissions);
    toast({
      title: 'Permissions Updated',
      description: `Permissions for the "${role.name}" role have been saved.`,
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Permissions for: {role.name}</DialogTitle>
          <DialogDescription>
            Select the permissions this role should have.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <ScrollArea className="h-96 pr-6">
                 <Accordion type="multiple" defaultValue={allPermissions.map(p => p.category)}>
                    {allPermissions.map(category => (
                        <AccordionItem key={category.category} value={category.category}>
                            <AccordionTrigger className="font-semibold">{category.category}</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-3 pl-2">
                                {category.permissions.map(permission => (
                                    <div key={permission.id} className="flex items-center space-x-3">
                                        <Checkbox
                                            id={`${role.id}-${permission.id}`}
                                            checked={isSuperAdmin || selectedPermissions.includes(permission.id)}
                                            onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                                            disabled={isSuperAdmin && permission.id !== '*:*'}
                                        />
                                        <Label htmlFor={`${role.id}-${permission.id}`} className="font-normal cursor-pointer">
                                            {permission.label}
                                        </Label>
                                    </div>
                                ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                 </Accordion>
            </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
