
'use client';

import React, { type ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
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
  TrendingUp,
  LayoutGrid,
  Calculator,
  PlusCircle,
  MapPin,
  CalendarDays,
  Clock,
  Check,
  FileDigit,
  Contact,
  Gem,
  MessageSquare,
  Mail,
  HelpCircle,
  SwatchBook,
  PencilRuler,
  ShoppingBag,
  Boxes,
  Archive,
  History,
  Settings,
  BookUser,
  Building2,
  DollarSign,
  Briefcase,
  AreaChart,
  Undo2,
  CalendarCheck,
  Fingerprint,
  Star,
  PlusSquare,
  LogOut,
  ClipboardList,
  Utensils,
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
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ThemeToggle } from './theme-toggle';
import { CalculatorModal } from './calculator-modal';
import { format } from 'date-fns';
import { useLocation } from '@/components/location-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';

const navItems = [
  {
    label: 'Dashboards',
    icon: LayoutDashboard,
    subItems: [
      { href: '/dashboard', label: 'Overview', icon: LayoutGrid },
      { href: '/sales/dashboard', label: 'Sales', icon: TrendingUp },
      { href: '/inventory/dashboard', label: 'Inventory', icon: Package },
       { href: '/suppliers/dashboard', label: 'Suppliers', icon: Building },
      { href: '/crm/dashboard', label: 'CRM', icon: Users },
    ],
  },
  {
    label: 'Sales',
    icon: TrendingUp,
    subItems: [
      { href: '/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/sales/invoices', label: 'Invoices', icon: FileText },
      { href: '/sales/receipts', label: 'Receipts', icon: Receipt },
    ],
  },
  {
    label: 'CRM',
    icon: Contact,
    subItems: [
      { href: '/crm/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    label: 'Inventory & Products',
    icon: Package,
    subItems: [
      { href: '/products', label: 'All Products', icon: Boxes },
      { href: '/products/collections', label: 'Collections', icon: Archive },
      { href: '/products/brands', label: 'Brands', icon: ShoppingBag },
      { href: '/products/colors', label: 'Colors', icon: SwatchBook },
      { href: '/products/sizes', label: 'Sizes', icon: PencilRuler },
      { href: '/products/custom-fields', label: 'Custom Fields', icon: PlusSquare },
      { href: '/transfers', label: 'Stock Transfers', icon: ArrowRightLeft },
    ],
  },
  {
    label: 'Production',
    icon: ClipboardList,
    subItems: [
        { href: '/production/bom', label: 'Bill of Materials', icon: FileText },
        { href: '/production/production-note/new', label: 'Production Note', icon: PlusCircle },
    ]
  },
   {
    label: 'Suppliers',
    icon: Building,
    subItems: [
        { href: '/suppliers/dashboard', label: 'Dashboard', icon: LayoutGrid },
        { href: '/suppliers', label: 'All Suppliers', icon: Users },
        { href: '/suppliers/payments', label: 'Payments', icon: Wallet },
        { href: '/suppliers/returns', label: 'Supplier Returns', icon: Undo2 },
    ]
  },
  {
    label: 'Purchasing',
    icon: ShoppingCart,
    subItems: [
      { href: '/purchasing/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
      { href: '/purchasing/grn', label: 'Goods Received Notes (GRN)', icon: FileDigit },
    ],
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: BarChart3,
  },
  {
    label: 'Settings',
    icon: Settings,
    subItems: [
      { href: '/settings/profile', label: 'Profile', icon: Users },
      { href: '/locations', label: 'Locations', icon: Warehouse },
      { href: '/settings/tables', label: 'Dine-in Tables', icon: Utensils },
      { href: '/billing', label: 'Billing & Plans', icon: CreditCard },
      { href: '/settings/currency', label: 'Currency', icon: DollarSign },
    ],
  },
  {
    href: '/pos-system',
    label: 'POS System',
    icon: Terminal,
    isExternal: true,
  },
  {
    href: '/help',
    label: 'How to Use',
    icon: HelpCircle,
  },
];


function LocationSwitcher({ isMobile = false }: { isMobile?: boolean }) {
    const { currentLocation, setCurrentLocation, availableLocations, isLoading } = useLocation();

    if (isLoading) {
        return <Skeleton className={cn("h-10", isMobile ? "w-full" : "w-48")} />
    }

    if (!currentLocation) {
        return (
            <div className={cn("p-2", isMobile ? "" : "md:block hidden")}>
                <Button variant="outline" disabled>No Locations Found</Button>
            </div>
        )
    }

    if (isMobile) {
        return (
            <div className="md:hidden p-2">
                 <Select value={currentLocation.location_id} onValueChange={(id) => setCurrentLocation(availableLocations.find(l => l.location_id === id)!)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                         {availableLocations.map(location => (
                             <SelectItem key={location.location_id} value={location.location_id}>
                                {location.location_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )
    }

    return (
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button variant="outline" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{currentLocation.location_name}</span>
                    <ChevronDown className="h-3 w-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>Change Location</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={currentLocation.location_id} onValueChange={(id) => setCurrentLocation(availableLocations.find(l => l.location_id === id)!)}>
                    {availableLocations.map(location => (
                         <DropdownMenuRadioItem key={location.location_id} value={location.location_id}>
                            {location.location_name}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}


function DateTimeLocation() {
    const [currentTime, setCurrentTime] = React.useState<Date | null>(null);

    React.useEffect(() => {
        const now = new Date();
        setCurrentTime(now);

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!currentTime) {
      return (
        <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground sm:mr-auto">
          <LocationSwitcher />
          <div className="h-5 w-24 bg-muted rounded-md animate-pulse" />
          <div className="h-5 w-20 bg-muted rounded-md animate-pulse" />
        </div>
      );
    }

    return (
        <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground sm:mr-auto">
           <LocationSwitcher />
            <Popover>
                <PopoverTrigger asChild>
                     <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <span>{format(currentTime, 'PPP')}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={currentTime}
                        disabled
                    />
                </PopoverContent>
            </Popover>
            <Popover>
                 <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{format(currentTime, 'p')}</span>
                    </Button>
                </PopoverTrigger>
                 <PopoverContent className="w-auto p-4">
                    <div className="text-center">
                        <div className="text-4xl font-bold">
                            {format(currentTime, 'HH:mm')}
                        </div>
                        <div className="text-lg text-muted-foreground">
                            {format(currentTime, 'ss')}s
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}

function QuickAccessMenu() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <LayoutGrid />
                    <span className="sr-only">Quick Access</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Quick Access</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/products/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span>New Product</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/purchasing/purchase-orders/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span>New Purchase Order</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/accounting/expenses/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span>New Expense</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/accounting/journal-entries/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span>New Journal Entry</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function UserMenu({ user }: { user: any }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="profile photo" />
            <AvatarFallback>{user.name ? user.name.charAt(0) : 'U'}</AvatarFallback>
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
        <DropdownMenuItem asChild>
            <Link href="/settings/profile">
                <Users className="mr-2 h-4 w-4" />
                <span>Profile</span>
            </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
      <Truck className="h-6 w-6 text-primary" />
      <span>Payshia ERP</span>
    </Link>
  );
}

const isPathActive = (pathname: string, href?: string, subItems?: any[]) => {
  if (!href && subItems) {
    return subItems.some(item => isPathActive(pathname, item.href, item.subItems));
  }
  if (!href) return false;
  
  const exactMatchPaths = ['/dashboard', '/products', '/suppliers', '/reports', '/pos-system', '/help'];
  if (exactMatchPaths.includes(href)) {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

const NavMenu = ({ items, pathname, handleLinkClick }: { items: any[], pathname: string, handleLinkClick: any }) => {
    return (
        <SidebarMenu>
            {items.map((item, index) =>
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
                      <NavMenu items={item.subItems} pathname={pathname} handleLinkClick={handleLinkClick} />
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
                      {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            )}
        </SidebarMenu>
    );
};


export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [user, setUser] = useState({ name: '', email: '', role: '', avatar: '' });

  useEffect(() => {
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    if (userName) {
      setUser({
        name: userName,
        email: userEmail || `${userName.toLowerCase().replace(' ', '.')}@payshia.com`,
        role: 'User',
        avatar: `https://placehold.co/100x100.png?text=${userName.charAt(0)}`
      });
    }
  }, []);

  const handleLinkClick = (isExternal: boolean | undefined, e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
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
         <LocationSwitcher isMobile={true} />
         <SidebarSeparator />
        <SidebarContent className="p-4">
          <NavMenu items={navItems} pathname={pathname} handleLinkClick={handleLinkClick} />
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="profile photo" />
              <AvatarFallback>{user.name ? user.name.charAt(0) : 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.role}</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <DateTimeLocation />
          </div>
          <div className="flex items-center gap-2">
            <CalculatorModal>
              <Button variant="ghost" size="icon">
                <Calculator />
                <span className="sr-only">Calculator</span>
              </Button>
            </CalculatorModal>
            <QuickAccessMenu />
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left border-t p-4 px-6 text-xs text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} Payshia ERP. All rights reserved.</span>
            <span>
              Powered by{' '}
              <a href="https://payshia.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                  Payshia Software Solutions
              </a>
            </span>
        </footer>
      </SidebarInset>
    </>
  );
}
