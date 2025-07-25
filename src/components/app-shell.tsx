

'use client';

import React, { type ReactNode, useState, useEffect } from 'react';
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

const user = {
  name: 'Admin User',
  email: 'admin@payshia.com',
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
    label: 'Master',
    icon: Package,
    subItems: [
      { href: '/products', label: 'All Products', icon: Boxes },
      { href: '/products/collections', label: 'Collections', icon: Archive },
      { href: '/products/brands', label: 'Brands', icon: ShoppingBag },
      { href: '/products/colors', label: 'Colors', icon: SwatchBook },
      { href: '/products/sizes', label: 'Sizes', icon: PencilRuler },
    ],
  },
  {
    href: '/inventory/forecast',
    label: 'AI Forecast',
    icon: TrendingUp,
  },
  {
    href: '/orders',
    label: 'Orders',
    icon: ShoppingCart,
  },
  {
    label: 'Sales',
    icon: TrendingUp,
    subItems: [
      { href: '/sales/invoices', label: 'Invoices' },
      { href: '/sales/receipts', label: 'Receipts' },
    ],
  },
  {
    label: 'CRM',
    icon: Contact,
    subItems: [
        { href: '/crm/customers', label: 'Customers' },
        { href: '/crm/loyalty-schema', label: 'Loyalty Schema' },
        { href: '/crm/sms-campaigns', label: 'SMS Campaigns', icon: MessageSquare },
        { href: '/crm/email-campaigns', label: 'Email Campaigns', icon: Mail },
    ],
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
      { href: '/accounting/fixed-assets', label: 'Fixed Assets' },
    ],
  },
  {
    href: '/logistics',
    label: 'AI Logistics',
    icon: BotMessageSquare,
  },
  {
    href: '/help',
    label: 'How to Use',
    icon: HelpCircle,
  },
  {
    href: '/pos-system',
    label: 'POS System',
    icon: Terminal,
    isExternal: true,
  },
];

function LocationSwitcher({ isMobile = false }: { isMobile?: boolean }) {
    const { currentLocation, setCurrentLocation, availableLocations } = useLocation();

    if (isMobile) {
        return (
            <div className="md:hidden p-2">
                 <Select value={currentLocation.id} onValueChange={(id) => setCurrentLocation(availableLocations.find(l => l.id === id)!)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                         {availableLocations.map(location => (
                             <SelectItem key={location.id} value={location.id}>
                                {location.name}
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
                    <span>{currentLocation.name}</span>
                    <ChevronDown className="h-3 w-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>Change Location</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={currentLocation.id} onValueChange={(id) => setCurrentLocation(availableLocations.find(l => l.id === id)!)}>
                    {availableLocations.map(location => (
                         <DropdownMenuRadioItem key={location.id} value={location.id}>
                            {location.name}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}


function DateTimeLocation() {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        setCurrentTime(new Date());
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

             <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>{format(currentTime, 'PPP')}</span>
            </div>
            <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{format(currentTime, 'pp')}</span>
            </div>
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
      <span>Payshia ERP</span>
    </Link>
  );
}

const isPathActive = (pathname: string, href?: string, subItems?: any[]) => {
  if (!href && subItems) {
    return subItems.some(item => isPathActive(pathname, item.href, item.subItems));
  }
  if (!href) return false;
  // Exact match for dashboard and products, startsWith for others
  if (href === '/dashboard' || href === '/products') {
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
    );
};


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
         <LocationSwitcher isMobile={true} />
         <SidebarSeparator />
        <SidebarContent className="p-4">
          <NavMenu items={navItems} pathname={pathname} handleLinkClick={handleLinkClick} />
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
            <UserMenu />
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
