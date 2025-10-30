
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
    pages: [
      { name: 'Sales Dashboard', id: 'sales-dashboard' },
      { name: 'Orders', id: 'orders' },
      { name: 'Invoices', id: 'invoices' },
      { name: 'Receipts', id: 'receipts' },
    ],
  },
  {
    category: 'CRM',
    pages: [
      { name: 'Customers', id: 'crm-customers' },
    ],
  },
  {
    category: 'Inventory & Products',
    pages: [
      { name: 'Inventory Dashboard', id: 'inventory-dashboard' },
      { name: 'All Products', id: 'products' },
      { name: 'Categories', id: 'product-categories' },
      { name: 'Collections', id: 'product-collections' },
      { name: 'Brands', id: 'product-brands' },
      { name: 'Stock Transfers', id: 'stock-transfers' },
      { name: 'Opening Stock', id: 'opening-stock' },
    ],
  },
  {
    category: 'Purchasing',
    pages: [
        { name: 'Purchase Orders', id: 'purchase-orders' },
        { name: 'Goods Received Notes (GRN)', id: 'grn' },
    ]
  },
  {
    category: 'Accounting',
    pages: [
        { name: 'Accounting Dashboard', id: 'accounting-dashboard' },
        { name: 'Chart of Accounts', id: 'chart-of-accounts' },
        { name: 'Journal Entries', id: 'journal-entries' },
        { name: 'Expenses', id: 'expenses' },
    ]
  },
  {
    category: 'Settings',
    pages: [
        { name: 'Company Profile', id: 'settings-company' },
        { name: 'Users & Roles', id: 'settings-users' },
        { name: 'Locations', id: 'settings-locations' },
    ]
  },
   {
    category: 'Admin',
    pages: [
        { name: 'Full Access (All Permissions)', id: 'admin-all' },
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
  
  const isSuperAdmin = selectedPermissions.includes('admin-all:process');

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setSelectedPermissions((prev) => {
        // Special case for super admin
        if (permission === 'admin-all:process') {
            return checked ? ['admin-all:process'] : [];
        }
        // If checking 'process', also check 'read'
        if (checked && permission.endsWith(':process')) {
            const readPermission = permission.replace(':process', ':read');
            const newPermissions = [...prev, permission];
            if (!prev.includes(readPermission)) {
                newPermissions.push(readPermission);
            }
            return newPermissions;
        }
        // If unchecking 'read', also uncheck 'process'
        if (!checked && permission.endsWith(':read')) {
            const processPermission = permission.replace(':read', ':process');
            return prev.filter(p => p !== permission && p !== processPermission);
        }
        // Standard add/remove
        if (checked) {
            return [...prev, permission];
        } else {
            return prev.filter((p) => p !== permission);
        }
    });
  };

  const handleSaveChanges = () => {
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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Permissions for: {role.name}</DialogTitle>
          <DialogDescription>
            Select the pages and actions this role can access. "Read" allows viewing data, while "Process" allows creating, editing, and deleting.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <ScrollArea className="h-96 pr-6">
                 <Accordion type="multiple" defaultValue={allPermissions.map(p => p.category)}>
                    {allPermissions.map(category => (
                        <AccordionItem key={category.category} value={category.category}>
                            <AccordionTrigger className="font-semibold">{category.category}</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-4 pl-2">
                                {category.pages.map(page => (
                                    <div key={page.id} className="grid grid-cols-3 items-center">
                                        <Label htmlFor={`${role.id}-${page.id}-read`} className="font-normal cursor-pointer col-span-1">
                                            {page.name}
                                        </Label>
                                        
                                        {page.id === 'admin-all' ? (
                                            <div className="flex items-center space-x-3 col-span-2 justify-end">
                                                <Checkbox
                                                    id={`${role.id}-${page.id}-process`}
                                                    checked={selectedPermissions.includes('admin-all:process')}
                                                    onCheckedChange={(checked) => handlePermissionChange('admin-all:process', !!checked)}
                                                />
                                                <Label htmlFor={`${role.id}-${page.id}-process`} className="font-normal cursor-pointer text-sm">
                                                    Enable Full Access
                                                </Label>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center space-x-3">
                                                    <Checkbox
                                                        id={`${role.id}-${page.id}-read`}
                                                        checked={isSuperAdmin || selectedPermissions.includes(`${page.id}:read`)}
                                                        onCheckedChange={(checked) => handlePermissionChange(`${page.id}:read`, !!checked)}
                                                        disabled={isSuperAdmin}
                                                    />
                                                    <Label htmlFor={`${role.id}-${page.id}-read`} className="font-normal cursor-pointer text-sm">
                                                        Read
                                                    </Label>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <Checkbox
                                                        id={`${role.id}-${page.id}-process`}
                                                        checked={isSuperAdmin || selectedPermissions.includes(`${page.id}:process`)}
                                                        onCheckedChange={(checked) => handlePermissionChange(`${page.id}:process`, !!checked)}
                                                        disabled={isSuperAdmin}
                                                    />
                                                    <Label htmlFor={`${role.id}-${page.id}-process`} className="font-normal cursor-pointer text-sm">
                                                        Process
                                                    </Label>
                                                </div>
                                            </>
                                        )}
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
