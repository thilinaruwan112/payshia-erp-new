
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
import { fixedAssets } from '@/lib/data';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FixedAsset } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const getStatusColor = (status: FixedAsset['status']) => {
  switch (status) {
    case 'In Use':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Under Maintenance':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'Disposed':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

export default function FixedAssetsPage() {
  const { toast } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);

  const depreciationDetails = useMemo(() => {
    if (!selectedAsset) return { amount: 0, method: 'N/A' };
    // Simplified depreciation calculation for demonstration
    const usefulLifeYears = selectedAsset.assetType === 'Buildings' ? 40 : (selectedAsset.assetType === 'Vehicles' || selectedAsset.assetType === 'Machinery' ? 5 : 3);
    const monthlyDepreciation = selectedAsset.purchaseCost / usefulLifeYears / 12;

    return {
        amount: monthlyDepreciation,
        method: 'Straight-Line'
    };
  }, [selectedAsset]);

  const handleRunDepreciation = () => {
    if (!selectedAsset) return;

    toast({
      title: 'Depreciation Process Simulated',
      description: `Journal entries for ${selectedAsset.name} have been posted.`,
    });
    // In a real app, this would also update the asset's accumulated depreciation
    setIsConfirmOpen(false);
    setSelectedAsset(null);
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fixed Assets</h1>
            <p className="text-muted-foreground">
              Manage your company's long-term assets.
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/accounting/fixed-assets/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Asset
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Asset Register</CardTitle>
            <CardDescription>
              A comprehensive list of all fixed assets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Purchase Date</TableHead>
                  <TableHead className="text-right">Purchase Cost</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Accum. Dep.</TableHead>
                  <TableHead className="text-right">Book Value</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fixedAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{asset.assetType}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{new Date(asset.purchaseDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-mono">${asset.purchaseCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right hidden md:table-cell font-mono">${asset.accumulatedDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-mono">${(asset.purchaseCost - asset.accumulatedDepreciation).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className={cn(getStatusColor(asset.status))}>
                          {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => {
                              setSelectedAsset(asset);
                              setIsConfirmOpen(true);
                            }}>
                            Run Depreciation
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Dispose Asset
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Depreciation</AlertDialogTitle>
            <AlertDialogDescription>
              This will post a journal entry to record depreciation for{' '}
              <span className="font-bold text-foreground">{selectedAsset?.name}</span>.
              This action cannot be undone.
              <div className="mt-4 space-y-1 text-sm text-muted-foreground bg-muted p-3 rounded-md border">
                <p><strong>Method:</strong> {depreciationDetails.method}</p>
                <p><strong>Amount:</strong> <span className="font-mono">${depreciationDetails.amount.toFixed(2)}</span> (for the current month)</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedAsset(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRunDepreciation}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
