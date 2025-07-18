

'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  BotMessageSquare,
  ChevronDown,
  Users,
  Building,
  ArrowRightLeft,
  Warehouse,
  Terminal,
  BarChart3,
  CreditCard,
  Landmark,
  Receipt,
  FileText,
  Wallet,
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import React from 'react';
import { ThemeToggle } from './theme-toggle';

const user = {
  name: 'Admin User',
  email: 'admin@branchbrain.com',
  role: 'Admin',
  avatar: 'https://placehold.co/100x100.png',
};

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: BarChart3,
  },
  {
    label: 'Products',
    icon: Package,
    subItems: [
      { href: '/products', label: 'All Products' },
      { href: '/products/collections', label: 'Collections' },
    ],
  },
  {
    href: '/orders',
    label: 'Orders',
    icon: ShoppingCart,
  },
  {
    href: '/suppliers',
    label: 'Suppliers',
    icon: Users,
  },
   {
    label: 'Purchasing',
    icon: Building,
    subItems: [
      { href: '/purchasing/purchase-orders', label: 'Purchase Orders' },
      { href: '/purchasing/grn', label: 'GRN' },
    ],
  },
  {
    href: '/transfers',
    label: 'Stock Transfers',
    icon: ArrowRightLeft,
  },
  {
    href: '/locations',
    label: 'Locations',
    icon: Warehouse,
  },
   {
    href: '/billing',
    label: 'Billing',
    icon: CreditCard,
  },
  {
    label: 'Accounting',
    icon: Landmark,
    subItems: [
      { href: '/accounting/dashboard', label: 'Dashboard' },
      { href: '/accounting/payments', label: 'Payments' },
      { href: '/accounting/expenses', label: 'Expenses' },
      { href: '/accounting/chart-of-accounts', label: 'Chart of Accounts' },
      { href: '/accounting/journal-entries', label: 'Journal Entries' },
    ],
  },
  {
    href: '/logistics',
    label: 'AI Logistics',
    icon: BotMessageSquare,
  },
  {
    href: '/pos-system',
    label: 'POS System',
    icon: Terminal,
    isExternal: true,
  },
];

function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="profile picture" />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
      <Truck className="h-6 w-6 text-primary" />
      <span>BranchBrain</span>
    </Link>
  );
}

const isPathActive = (pathname: string, href?: string, subItems?: { href: string }[]) => {
  if (!href && subItems) {
    return subItems.some(item => pathname.startsWith(item.href));
  }
  if (!href) return false;
  // Exact match for dashboard, startsWith for others
  if (href === '/dashboard') return pathname === href;
  return pathname.startsWith(href);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = (isExternal: boolean | undefined, e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    // For regular links on mobile, close the sidebar after clicking.
    if (!isExternal) {
       setOpenMobile(false);
    }
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <Brand />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item, index) =>
              item.subItems ? (
                <Collapsible key={index} defaultOpen={isPathActive(pathname, item.href, item.subItems)}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className="justify-start w-full group"
                        variant="ghost"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.label}</span>
                        <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    <ul className="pl-7 py-1 ml-1 border-l">
                      {item.subItems.map((subItem) => (
                        <li key={subItem.href}>
                           <Link href={subItem.href} onClick={(e) => handleLinkClick(false, e)}>
                            <SidebarMenuButton
                              variant="ghost"
                              className="w-full justify-start text-muted-foreground"
                              isActive={pathname === subItem.href}
                            >
                              {subItem.label}
                            </SidebarMenuButton>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isPathActive(pathname, item.href)}
                    className="justify-start"
                  >
                    <Link href={item.href!} onClick={(e) => handleLinkClick(item.isExternal, e)} target={item.isExternal ? "_blank" : "_self"} rel={item.isExternal ? "noopener noreferrer" : ""}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                      {item.label === 'AI Logistics' && (
                        <Badge
                          variant="destructive"
                          className="ml-auto bg-accent text-accent-foreground animate-pulse"
                        >
                          New
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="profile picture" />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.role}</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <div className="hidden md:block">
                <Brand />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
