
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
import { products } from '@/lib/data';
import type { User } from '@/lib/types';
import { LayoutDashboard, LogOut, Search, User as UserIcon, MapPin, CalendarDays, Clock } from 'lucide-react';
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
} from '../ui/dropdown-menu';
import { format } from 'date-fns';

interface PosHeaderProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  cashier: User;
}

function DateTimeLocation() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex items-center gap-4 text-sm text-muted-foreground order-2 sm:order-1 sm:mr-auto">
             <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Downtown Store</span>
            </div>
             <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>{format(currentTime, 'PPP')}</span>
            </div>
            <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{format(currentTime, 'p')}</span>
            </div>
        </div>
    )
}


export function PosHeader({
  searchTerm,
  setSearchTerm,
  category,
  setCategory,
  cashier
}: PosHeaderProps) {
  const categories = ['All', ...new Set(products.map((p) => p.category))];

  return (
    <header className="p-4 border-b border-border flex flex-wrap items-center gap-4 sticky top-0 bg-background z-10">
      <Link href="/" className="text-xl font-bold mr-4 order-1">
        BranchBrain
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
      <div className="flex-grow sm:flex-grow-0 order-4 sm:order-4">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[180px] h-11">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
