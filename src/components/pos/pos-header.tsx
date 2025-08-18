

'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { User } from '@/lib/types';
import { LayoutDashboard, LogOut, Search, User as UserIcon, MapPin, CalendarDays, Clock, ChevronDown, Building } from 'lucide-react';
import { ThemeToggle } from '../theme-toggle';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup
} from '../ui/dropdown-menu';
import { format } from 'date-fns';
import { useLocation } from '../location-provider';
import { Skeleton } from '../ui/skeleton';

interface PosHeaderProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  cashier: User;
}

function DateTimeLocation() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const { currentLocation, setCurrentLocation, availableLocations, isLoading } = useLocation();


    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center gap-4 text-sm text-muted-foreground order-2 sm:order-1 sm:mr-auto">
                 <Skeleton className="h-10 w-32" />
            </div>
        )
    }

    if (!currentLocation) {
        return (
             <div className="flex items-center gap-4 text-sm text-muted-foreground order-2 sm:order-1 sm:mr-auto">
                 <Button variant="outline" disabled>
                    <Building className="mr-2 h-4 w-4" />
                    No Location Selected
                </Button>
            </div>
        )
    }
    
    const posLocations = availableLocations.filter(loc => loc.pos_status === '1');

    return (
        <div className="flex items-center gap-4 text-sm text-muted-foreground order-2 sm:order-1 sm:mr-auto">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                     <Button variant="outline" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{currentLocation.location_name}</span>
                        <ChevronDown className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Change POS Location</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={currentLocation.location_id} onValueChange={(id) => setCurrentLocation(posLocations.find(l => l.location_id === id)!)}>
                        {posLocations.map(location => (
                            <DropdownMenuRadioItem key={location.location_id} value={location.location_id}>
                                {location.location_name}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
             <div className="hidden sm:flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>{format(currentTime, 'PPP')}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{format(currentTime, 'p')}</span>
            </div>
        </div>
    )
}


export function PosHeader({
  searchTerm,
  setSearchTerm,
  cashier,
}: PosHeaderProps) {

  return (
    <header className="p-4 border-b border-border flex flex-wrap items-center gap-4 sticky top-0 bg-background z-10">
      <Link href="/" className="text-xl font-bold mr-4 order-1">
        Payshia ERP
      </Link>
      <DateTimeLocation />
      <div className="relative flex-1 w-full sm:w-auto sm:flex-grow-[2] order-3 sm:order-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search products or scan barcode..."
          className="pl-10 h-11"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2 order-1 sm:order-5 ml-auto sm:ml-0">
        <ThemeToggle />
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={cashier.avatar} alt={cashier.name} data-ai-hint="profile picture"/>
                        <AvatarFallback>{cashier.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{cashier.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{cashier.role}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/dashboard" target="_blank" rel="noopener noreferrer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
