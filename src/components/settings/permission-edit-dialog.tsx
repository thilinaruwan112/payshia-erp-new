
'use client';

import React, { useState, useEffect } from 'react';
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
import { fetcher } from '@/lib/api';
import { Skeleton } from '../ui/skeleton';
import { useLocation } from '../location-provider';

interface Page {
    id: string;
    name: string;
    display_name: string;
    description: string;
    category: string;
}

interface PermissionCategory {
    category: string;
    pages: Page[];
}

interface RolePermission {
    id: string;
    role_id: string;
    page_id: string;
    company_id: string;
    right_access: string;
    process_access: string;
}


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
  const { company_id } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [permissionCategories, setPermissionCategories] = useState<PermissionCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  useEffect(() => {
    async function fetchPermissionsData() {
        if (!isOpen || !company_id) return;
        setIsLoading(true);
        setSelectedPermissions([]);
        try {
            const [pagesResponse, rolePermsResponse] = await Promise.all([
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pages`),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/role-permissions/by-role/`, {
                    method: 'POST',
                    body: JSON.stringify({
                        role_id: parseInt(role.id, 10),
                        company_id: company_id,
                    })
                })
            ]);
            
            if (!pagesResponse.ok) throw new Error('Failed to fetch pages for permissions.');
            const pagesResult = await pagesResponse.json();
            const pages: Page[] = pagesResult.data || [];

            const grouped = pages.reduce((acc: Record<string, PermissionCategory>, page) => {
                const categoryName = page.category || 'Other';
                if (!acc[categoryName]) {
                    acc[categoryName] = { category: categoryName, pages: [] };
                }
                acc[categoryName].pages.push(page);
                return acc;
            }, {});
            setPermissionCategories(Object.values(grouped));

            if (!rolePermsResponse.ok) throw new Error('Failed to fetch permissions for this role.');
            const rolePermsResult = await rolePermsResponse.json();
            const rolePermissions: RolePermission[] = rolePermsResult.data || [];
            
            const initialPermissions: string[] = [];
            rolePermissions.forEach(perm => {
                const page = pages.find(p => p.id === perm.page_id);
                if (page) {
                    if (perm.right_access === '1') {
                        initialPermissions.push(`${page.name}:read`);
                    }
                    if (perm.process_access === '1') {
                        initialPermissions.push(`${page.name}:process`);
                    }
                }
            });
            setSelectedPermissions(initialPermissions);

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error Loading Data',
                description: error instanceof Error ? error.message : "An unknown error occurred",
            });
        } finally {
            setIsLoading(false);
        }
    }
    fetchPermissionsData();
  }, [isOpen, toast, role.id, company_id]);

  
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
                 <Accordion type="multiple" defaultValue={permissionCategories.map(p => p.category)}>
                    {isLoading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-8 w-1/3" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        permissionCategories.map(category => (
                            <AccordionItem key={category.category} value={category.category}>
                                <AccordionTrigger className="font-semibold">{category.category}</AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-4 pl-2">
                                    {category.pages.map(page => (
                                        <div key={page.id} className="grid grid-cols-3 items-center">
                                            <Label htmlFor={`${role.id}-${page.name}-read`} className="font-normal cursor-pointer col-span-1">
                                                {page.display_name}
                                            </Label>
                                            
                                            {page.name === 'admin-all' ? (
                                                <div className="flex items-center space-x-3 col-span-2 justify-end">
                                                    <Checkbox
                                                        id={`${role.id}-${page.name}-process`}
                                                        checked={selectedPermissions.includes('admin-all:process')}
                                                        onCheckedChange={(checked) => handlePermissionChange('admin-all:process', !!checked)}
                                                    />
                                                    <Label htmlFor={`${role.id}-${page.name}-process`} className="font-normal cursor-pointer text-sm">
                                                        Enable Full Access
                                                    </Label>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center space-x-3">
                                                        <Checkbox
                                                            id={`${role.id}-${page.name}-read`}
                                                            checked={isSuperAdmin || selectedPermissions.includes(`${page.name}:read`)}
                                                            onCheckedChange={(checked) => handlePermissionChange(`${page.name}:read`, !!checked)}
                                                            disabled={isSuperAdmin}
                                                        />
                                                        <Label htmlFor={`${role.id}-${page.name}-read`} className="font-normal cursor-pointer text-sm">
                                                            Read
                                                        </Label>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <Checkbox
                                                            id={`${role.id}-${page.name}-process`}
                                                            checked={isSuperAdmin || selectedPermissions.includes(`${page.name}:process`)}
                                                            onCheckedChange={(checked) => handlePermissionChange(`${page.name}:process`, !!checked)}
                                                            disabled={isSuperAdmin}
                                                        />
                                                        <Label htmlFor={`${role.id}-${page.name}-process`} className="font-normal cursor-pointer text-sm">
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
                        ))
                    )}
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
