
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
import { AnalyticsFormDialog } from '@/components/analytics-form';
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data type, in a real app this would be in types.ts
export type AnalyticsSetting = {
  id: string;
  locationId: string;
  locationName?: string;
  facebookPixelId?: string;
  googleAnalyticsId?: string;
};

// Mock fetch function
async function fetchAnalyticsSettings(companyId: number): Promise<AnalyticsSetting[]> {
    // In a real app, you would fetch this from your backend:
    // e.g., await fetch(`/api/analytics-settings?companyId=${companyId}`);
    console.log("Fetching settings for company:", companyId)
    return Promise.resolve([
        { id: '1', locationId: '1', facebookPixelId: 'FB-PIXEL-123', googleAnalyticsId: 'G-ABCDEF123' },
        { id: '2', locationId: '2', facebookPixelId: 'FB-PIXEL-456', googleAnalyticsId: 'G-GHIJKL456' },
    ]);
}


export default function AnalyticsSettingsPage() {
    const [settings, setSettings] = useState<AnalyticsSetting[]>([]);
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
            const fetchedSettings = await fetchAnalyticsSettings(company_id);
            const settingsWithNames = fetchedSettings.map(setting => ({
                ...setting,
                locationName: availableLocations.find(loc => loc.location_id === setting.locationId)?.location_name || 'Unknown Location'
            }));
            setSettings(settingsWithNames);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not load analytics settings.'
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
            if (setting.facebookPixelId) {
                rows.push({
                    id: `${setting.id}-fb`,
                    locationName: setting.locationName,
                    keyName: 'Facebook Pixel ID',
                    value: setting.facebookPixelId,
                    originalSetting: setting,
                });
            }
            if (setting.googleAnalyticsId) {
                rows.push({
                    id: `${setting.id}-ga`,
                    locationName: setting.locationName,
                    keyName: 'Google Analytics ID',
                    value: setting.googleAnalyticsId,
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
                    <h1 className="text-3xl font-bold tracking-tight">Analytics & Tracking</h1>
                    <p className="text-muted-foreground">
                        Configure your marketing and analytics platform integrations.
                    </p>
                </div>
                <AnalyticsFormDialog onSave={refreshSettings}>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New
                    </Button>
                </AnalyticsFormDialog>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Configured Keys</CardTitle>
                    <CardDescription>A list of all analytics tracking IDs for your locations.</CardDescription>
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
                                                    <AnalyticsFormDialog setting={row.originalSetting} onSave={refreshSettings}>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                            Edit
                                                        </DropdownMenuItem>
                                                    </AnalyticsFormDialog>
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
