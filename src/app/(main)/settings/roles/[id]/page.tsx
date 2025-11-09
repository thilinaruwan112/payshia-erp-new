
'use client';

import React, { useState, useEffect } from 'react';
import type { Role } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { fetcher } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from '@/components/location-provider';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useParams, useRouter } from 'next/navigation';

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

export default function EditRolePermissionsPage() {
  const { id: roleId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { company_id } = useLocation();

  const [role, setRole] = useState<Role | null>(null);
  const [permissionCategories, setPermissionCategories] = useState<PermissionCategory[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    async function fetchPermissionsData() {
        if (!roleId || !company_id) return;
        setIsLoading(true);
        setSelectedPermissions([]);
        try {
            const [pagesResponse, rolePermsResponse, roleResponse] = await Promise.all([
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pages`),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/role-permissions/by-role/`, {
                    method: 'POST',
                    body: JSON.stringify({
                        role_id: parseInt(roleId as string, 10),
                        company_id: company_id,
                    })
                }),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles?company_id=${company_id}`)
            ]);
            
            if (!pagesResponse.ok) throw new Error('Failed to fetch pages for permissions.');
            const pagesResult = await pagesResponse.json();
            const allPages: Page[] = pagesResult.data || [];
            setPages(allPages);

            const grouped = allPages.reduce((acc: Record<string, PermissionCategory>, page) => {
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
                const page = allPages.find(p => p.id === perm.page_id);
                if (page) {
                    if (perm.right_access === '1') initialPermissions.push(`${page.name}:read`);
                    if (perm.process_access === '1') initialPermissions.push(`${page.name}:process`);
                }
            });
            setSelectedPermissions(initialPermissions);

            if (!roleResponse.ok) throw new Error('Failed to fetch role details.');
            const rolesResult = await roleResponse.json();
            const foundRole = rolesResult.data.find((r: Role) => r.id === roleId);
            setRole(foundRole || null);


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
  }, [roleId, company_id, toast]);

  
  const isSuperAdmin = selectedPermissions.includes('admin-all:process');

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setSelectedPermissions((prev) => {
        if (permission === 'admin-all:process') {
            return checked ? ['admin-all:process'] : [];
        }

        let newPermissions = new Set(prev);

        if (checked) {
            newPermissions.add(permission);
            // If process is checked, read must also be checked
            if (permission.endsWith(':process')) {
                newPermissions.add(permission.replace(':process', ':read'));
            }
        } else {
            newPermissions.delete(permission);
            // If read is unchecked, process must also be unchecked
            if (permission.endsWith(':read')) {
                newPermissions.delete(permission.replace(':read', ':process'));
            }
        }
        return Array.from(newPermissions);
    });
  };

  const handleCheckAll = () => {
    const allPerms = pages
        .filter(p => p.name !== 'admin-all')
        .flatMap(p => [`${p.name}:read`, `${p.name}:process`]);
    setSelectedPermissions(allPerms);
  }

  const handleUncheckAll = () => {
    setSelectedPermissions([]);
  }

  const handleSaveChanges = async () => {
    if (!company_id || !role) {
        toast({ variant: 'destructive', title: 'Error', description: 'Company ID or Role is missing.' });
        return;
    }
    setIsSubmitting(true);

    const permissionsPayload: { [pageId: string]: { right_access: boolean; process_access: boolean } } = {};

    pages.forEach(page => {
        const hasRead = selectedPermissions.includes(`${page.name}:read`);
        const hasProcess = selectedPermissions.includes(`${page.name}:process`);
        if(hasRead || hasProcess) {
            permissionsPayload[page.id] = { right_access: hasRead, process_access: hasProcess };
        }
    });
    
    if (isSuperAdmin) {
        const adminPage = pages.find(p => p.name === 'admin-all');
        if (adminPage) permissionsPayload[adminPage.id] = { right_access: true, process_access: true };
    }

    const finalPayload = {
      role_id: parseInt(role.id, 10),
      company_id: company_id,
      permissions: permissionsPayload,
    };

    try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/role-permissions/bulk-update/`, {
            method: 'POST',
            body: JSON.stringify(finalPayload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update permissions.');
        }

        toast({ title: 'Permissions Updated', description: `Permissions for the "${role.name}" role have been saved.` });
        router.push('/settings/roles');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({ variant: 'destructive', title: 'Update Failed', description: errorMessage });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
        <div className="space-y-4">
          <Skeleton className="h-9 w-1/4" />
          <Skeleton className="h-4 w-1/2" />
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        </div>
    )
  }

  if (!role) {
    return <div>Role not found.</div>
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Permissions</h1>
            <p className="text-muted-foreground">Editing permissions for role: <span className="font-semibold text-primary">{role.name}</span></p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
             </Button>
              <Button onClick={handleSaveChanges} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
          </div>
        </div>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Page Access</CardTitle>
                    <CardDescription>
                        Select the pages and actions this role can access. "Read" allows viewing data, while "Process" allows creating, editing, and deleting.
                    </CardDescription>
                  </div>
                   <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCheckAll}>Check All</Button>
                        <Button variant="outline" size="sm" onClick={handleUncheckAll}>Uncheck All</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 <Accordion type="multiple" defaultValue={permissionCategories.map(p => p.category)}>
                    {permissionCategories.map(category => (
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
                    ))}
                 </Accordion>
            </CardContent>
        </Card>
    </div>
  );
}
