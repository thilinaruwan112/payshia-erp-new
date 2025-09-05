
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { PlusCircle, MoreHorizontal, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Warranty } from '@/lib/types';
import { cn } from '@/lib/utils';
import React from 'react';
import { Separator } from '@/components/ui/separator';

const warranties: Warranty[] = [
    { id: 'WAR-001', customerName: 'John Doe', productName: 'Toyota Camry Engine', serialNumber: 'ABC-1234', purchaseDate: '2023-01-15', expiryDate: '2025-01-14', status: 'Active' },
    { id: 'WAR-002', customerName: 'Jane Smith', productName: 'Apple iPhone 14 Pro', serialNumber: 'SN:XYZ', purchaseDate: '2022-10-25', expiryDate: '2023-10-24', status: 'Expired' },
    { id: 'WAR-003', customerName: 'Jim Brown', productName: 'Ford Ranger Transmission', serialNumber: 'DEF-9012', purchaseDate: '2021-08-01', expiryDate: '2024-07-31', status: 'Active' },
    { id: 'WAR-004', customerName: 'Emily White', productName: 'Dell XPS 15 Laptop', serialNumber: 'SVC-TAG-123', purchaseDate: '2023-05-20', expiryDate: '2024-05-19', status: 'Active' },
];

const getStatusColor = (status: Warranty['status']) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Expired':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'Void':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};


export default function WarrantyPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warranty Management</h1>
          <p className="text-muted-foreground">
            Track and manage product warranties.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/service-center/warranty/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Warranty
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Warranties</CardTitle>
          <CardDescription>
            A list of all registered product warranties.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product / Serial No.</TableHead>
                    <TableHead className="hidden md:table-cell">Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                    <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {warranties.map((warranty) => (
                    <TableRow key={warranty.id}>
                    <TableCell className="font-medium">{warranty.customerName}</TableCell>
                    <TableCell>
                        <p className="font-semibold">{warranty.productName}</p>
                        <p className="text-xs text-muted-foreground">{warranty.serialNumber}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{new Date(warranty.expiryDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                        <Badge variant="secondary" className={cn(getStatusColor(warranty.status))}>
                            <ShieldCheck className="mr-1.5 h-3 w-3" />
                            {warranty.status}
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
                            <DropdownMenuItem asChild>
                                <Link href={`/service-center/warranty/${warranty.id}`}>View Details</Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          </div>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
             {warranties.map((warranty) => (
                <Card key={warranty.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-base">{warranty.productName}</CardTitle>
                                <CardDescription>{warranty.serialNumber}</CardDescription>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="-mt-2 -mr-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                 <Link href={`/service-center/warranty/${warranty.id}`}>View Details</Link>
                                </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-sm text-muted-foreground">Customer</p>
                            <p className="font-medium">{warranty.customerName}</p>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Expires</span>
                            <span>{new Date(warranty.expiryDate).toLocaleDateString()}</span>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Badge variant="secondary" className={cn("w-full justify-center py-2", getStatusColor(warranty.status))}>
                            <ShieldCheck className="mr-1.5 h-3 w-3" />
                            {warranty.status}
                        </Badge>
                    </CardFooter>
                </Card>
             ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
