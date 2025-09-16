
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

// Mock data type, in a real app this would be in types.ts
export type PayhereSetting = {
  id: string;
  locationId: string;
  locationName?: string;
  merchantId?: string;
  merchantSecret?: string;
};

// Mock fetch function
async function fetchPayhereSettings(companyId: number): Promise<PayhereSetting[]> {
    // In a real app, you would fetch this from your backend:
    // e.g., await fetch(`/api/payhere-settings?companyId=${companyId}`);
    console.log("Fetching settings for company:", companyId)
    return Promise.resolve([
        { id: '1', locationId: '1', merchantId: '122XXX', merchantSecret: 'SECRETXXX' },
        { id: '2', locationId: '2', merchantId: '123YYY', merchantSecret: 'SECRETYYY' },
    ]);
}


export default function PayhereSettingsPage() {
    const [settings, setSettings] = useState<PayhereSetting[]>([]);
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
            const fetchedSettings = await fetchPayhereSettings(company_id);
            const settingsWithNames = fetchedSettings.map(setting => ({
                ...setting,
                locationName: availableLocations.find(loc => loc.location_id === setting.locationId)?.location_name || 'Unknown Location'
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

    const displayData = useMemo(() => {
        return settings.flatMap(setting => {
            const rows = [];
            if (setting.merchantId) {
                rows.push({
                    id: `${setting.id}-mid`,
                    locationName: setting.locationName,
                    keyName: 'Merchant ID',
                    value: setting.merchantId,
                    originalSetting: setting,
                });
            }
            if (setting.merchantSecret) {
                rows.push({
                    id: `${setting.id}-sec`,
                    locationName: setting.locationName,
                    keyName: 'Merchant Secret',
                    value: '••••••••••••', // Mask the secret
                    originalSetting: setting,
                });
            }
            return rows;
        });
    }, [settings]);

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
                                displayData.map(row => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-medium">{row.locationName}</TableCell>
                                        <TableCell>{row.keyName}</TableCell>
                                        <TableCell className="font-mono">{row.value}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <PayhereFormDialog setting={row.originalSetting} onSave={refreshSettings}>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                            Edit
                                                        </DropdownMenuItem>
                                                    </PayhereFormDialog>
                                                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
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
