

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PayhereFormDialog } from '@/components/payhere-form';
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { KeySetting } from '@/lib/types';
import { fetcher } from '@/lib/api';


export default function PayhereSettingsPage() {
    const [settings, setSettings] = useState<KeySetting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { company_id, availableLocations } = useLocation();
    const { toast } = useToast();

    const refreshSettings = async () => {
        if (!company_id) {
            setIsLoading(false);
            return;
        };
        setIsLoading(true);
        try {
            const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/key-settings/company?company_id=${company_id}`);
            if (!response.ok) throw new Error('Failed to fetch settings.');
            const data: KeySetting[] = await response.json();
            
            const payhereKeys = ['Merchant ID', 'Merchant Secret'];
            const filteredSettings = data.filter(setting => payhereKeys.includes(setting.key));

            const settingsWithNames = filteredSettings.map(setting => ({
                ...setting,
                locationName: availableLocations.find(loc => loc.location_id === setting.location_id)?.location_name || 'Unknown Location'
            }));
            setSettings(settingsWithNames);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not load PayHere settings.'
            });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if(availableLocations.length > 0) {
            refreshSettings();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [company_id, availableLocations]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">PayHere Settings</h1>
                    <p className="text-muted-foreground">
                        Configure your PayHere payment gateway credentials for each location.
                    </p>
                </div>
                <PayhereFormDialog onSave={refreshSettings}>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New
                    </Button>
                </PayhereFormDialog>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Configured Keys</CardTitle>
                    <CardDescription>A list of all PayHere credentials for your locations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Location</TableHead>
                                <TableHead>Key Name</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({length: 4}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                settings.map(setting => (
                                    <TableRow key={setting.id}>
                                        <TableCell className="font-medium">{setting.locationName}</TableCell>
                                        <TableCell>{setting.key}</TableCell>
                                        <TableCell className="font-mono">{setting.key.toLowerCase().includes('secret') ? '••••••••••••' : setting.value}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                     {/* The form dialog for editing would be more complex and is out of scope for this update */}
                                                    <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" disabled>Delete</DropdownMenuItem>
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
    );
}
