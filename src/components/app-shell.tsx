
'use client';

import React, { type ReactNode, useState, useEffect, useCallback } from 'react';
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
  PackagePlus,
  LayoutList,
  UserCog,
  Wrench,
  Search,
  ShieldCheck,
  Ban,
  Percent,
  Barcode,
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
  SidebarMenuSkeleton,
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
} from './ui/dropdown-menu';
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
import { useLocation } from './location-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import Image from 'next/image';
import type { Role, User } from '@/lib/types';
import { fetcher } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const iconMap: { [key: string]: React.ElementType } = {
  dashboard: LayoutDashboard,
  sales: TrendingUp,
  'sales-dashboard': TrendingUp,
  orders: ShoppingCart,
  invoices: FileText,
  receipts: Receipt,
  'service-center': Wrench,
  'job-dashboard': LayoutDashboard,
  'new-job': PlusCircle,
  'find-job': Search,
  warranty: ShieldCheck,
  crm: Contact,
  customers: Users,
  'inventory-products': Package,
  'inventory-dashboard': LayoutDashboard,
  'all-products': Boxes,
  categories: LayoutList,
  collections: Archive,
  brands: ShoppingBag,
  models: ShoppingBag,
  colors: SwatchBook,
  sizes: PencilRuler,
  'custom-fields': PlusSquare,
  transfers: ArrowRightLeft,
  'goods-requisition': FileText,
  'stock-adjustment': ArrowRightLeft,
  'opening-stock': PackagePlus,
  'ai-forecast': TrendingUp,
  'barcode-print': Barcode,
  production: ClipboardList,
  bom: FileText,
  'production-note': History,
  'production-run': Percent,
  suppliers: Building,
  'suppliers-dashboard': LayoutGrid,
  'all-suppliers': Users,
  'supplier-payments': Wallet,
  'supplier-returns': Undo2,
  purchasing: ShoppingCart,
  'purchase-orders': ShoppingCart,
  grn: FileDigit,
  accounting: Calculator,
  'accounting-dashboard': LayoutDashboard,
  'chart-of-accounts': FileText,
  'journal-entries': BookUser,
  expenses: Receipt,
  'fixed-assets': Building2,
  'transaction-setup': FileDigit,
  reports: BarChart3,
  'reports-center': LayoutGrid,
  settings: Settings,
  profile: Users,
  'settings-users': UserCog,
  'roles-permissions': UserCog,
  'settings-locations': Warehouse,
  'dine-in-tables': Utensils,
  'payment-methods': CreditCard,
  'payhere-gateway': CreditCard,
  analytics: AreaChart,
  cancellation: Ban,
  'billing-plans': CreditCard,
  currency: DollarSign,
  'pos-system': Terminal,
  'how-to-use': HelpCircle,
};

interface NavItem {
  href?: string;
  label: string;
  icon: React.ElementType;
  name: string;
  subItems?: NavItem[];
}

interface Page {
    id: string;
    name: string;
    display_name: string;
    description: string;
    category: string;
    page_url: string | null;
}

interface RolePermission {
    id: string;
    role_id: string;
    page_id: string;
    company_id: string;
    right_access: string; // '1' or '0'
    process_access: string; // '1' or '0'
}


function LocationSwitcher({ isMobile = false }: { isMobile?: boolean }) {
    const { currentLocation, setCurrentLocation, availableLocations, isLoading } = useLocation();

    if (isLoading) {
        return <Skeleton className={cn("h-10", isMobile ? "w-full" : "w-48")} />
    }

    if (!currentLocation && availableLocations.length === 0) {
        return (
            <div className={cn("p-2", isMobile ? "" : "md:block hidden")}>
                <Button variant="outline" disabled>No Locations Found</Button>
            </div>
        )
    }

    if (isMobile) {
        return (
            <div className="md:hidden p-2">
                 <Select value={currentLocation?.location_id || ''} onValueChange={(id) => setCurrentLocation(availableLocations.find(l => l.location_id === id)!)}>
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
                    <span>{currentLocation?.location_name || 'Select Location'}</span>
                    <ChevronDown className="h-3 w-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>Change Location</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={currentLocation?.location_id} onValueChange={(id) => setCurrentLocation(availableLocations.find(l => l.location_id === id)!)}>
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
            {user.role && (
                <p className="text-xs font-semibold leading-none text-foreground/80 pt-1">
                    {user.role}
                </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
            <Link href="/settings/profile">
                <Users className="mr-2 h-4 w-4" />
                <span>Profile</span>
            </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
            <Link href="/settings/company-profile">
                <Building2 className="mr-2 h-4 w-4" />
                <span>Company Profile</span>
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

function Brand({ companyName }: { companyName: string }) {
  return (
    <Link href="/dashboard" className="flex items-center justify-center gap-2">
       <Image src="https://content-provider.payshia.com/payshia-erp/branding/payshia-erp-logo-01.webp" alt="Payshia ERP Logo" width={32} height={32} />
       <span className="font-bold text-lg">Payshia ERP</span>
    </Link>
  );
}

const isPathActive = (pathname: string, href?: string, subItems?: any[]) => {
  if (!href && subItems) {
    return subItems.some(item => isPathActive(pathname, item.href, item.subItems));
  }
  if (!href) return false;
  
  const exactMatchPaths = ['/dashboard', '/products', '/suppliers', '/reports', '/pos-system', '/help', '/service-center/warranty'];
  if (exactMatchPaths.includes(href)) {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

const NavMenu = ({ items, pathname, handleLinkClick }: { items: NavItem[], pathname: string, handleLinkClick: any }) => {
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
                        {item.icon && <item.icon className="mr-2 h-4 w-4" />}
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
                    <Link href={item.href!} onClick={(e) => handleLinkClick(false, e)}>
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
  const [user, setUser] = useState({ name: '', email: '', role: '', roleId: '', avatar: '' });
  const [companyName, setCompanyName] = useState('Payshia ERP');
  const [roles, setRoles] = useState<Role[]>([]);
  const { company_id } = useLocation();
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [isLoadingNav, setIsLoadingNav] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
        const userId = localStorage.getItem('userId');
        const companyId = localStorage.getItem('companyId');
        
        if (!userId || !companyId) return;

        try {
            const [userResponse, rolesResponse] = await Promise.all([
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${userId}`),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles?company_id=${companyId}`)
            ]);

            if (!userResponse.ok) throw new Error('Failed to fetch user data');
            const userData = await userResponse.json();
            
            if (!rolesResponse.ok) throw new Error('Failed to fetch roles');
            const rolesData = await rolesResponse.json();
            const companyRoles: Role[] = rolesData.data || [];
            
            setRoles(companyRoles);
            const roleId = userData.data.role_id;
            const roleName = companyRoles.find(r => r.id === roleId)?.name || 'User';

            setUser({
                name: `${userData.data.first_name} ${userData.data.last_name}`,
                email: userData.data.email,
                role: roleName,
                roleId: roleId,
                avatar: userData.data.img_path || `https://placehold.co/100x100.png?text=${userData.data.first_name.charAt(0)}`
            });

        } catch (error) {
            console.error("Failed to fetch user session details:", error);
        }
    };

    fetchUserData();
    const name = localStorage.getItem('companyName');
    if (name) {
      setCompanyName(name);
    }
  }, [company_id]);
  
  useEffect(() => {
    const fetchNavData = async () => {
        if (!user.roleId || !company_id) return;
        setIsLoadingNav(true);
        try {
            const [pagesResponse, permsResponse] = await Promise.all([
                fetcher('https://qa-server-erp.payshia.com/pages'),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/role-permissions/by-role/`, {
                    method: 'POST',
                    body: JSON.stringify({ role_id: parseInt(user.roleId, 10), company_id: company_id })
                })
            ]);

            if (!pagesResponse.ok) throw new Error('Failed to fetch pages.');
            if (!permsResponse.ok) throw new Error('Failed to fetch role permissions.');

            const pagesResult = await pagesResponse.json();
            const permsResult = await permsResponse.json();

            const allPages: Page[] = pagesResult.data || [];
            const userPermissions: RolePermission[] = permsResult.data || [];

            const accessiblePageIds = new Set(userPermissions.filter(p => p.right_access === '1').map(p => p.page_id));
            const accessiblePages = allPages.filter(page => accessiblePageIds.has(page.id));

            const categoryMap: { [key: string]: NavItem } = {};
            const topLevelItems: NavItem[] = [];

            accessiblePages.forEach((page) => {
                if (!page.page_url) return;
                
                const icon = iconMap[page.name] || HelpCircle;
                const navItem: NavItem = {
                    href: page.page_url,
                    label: page.display_name,
                    icon: icon,
                    name: page.name,
                };
                
                if (page.category) {
                    if (!categoryMap[page.category]) {
                        const parentName = page.category.toLowerCase().replace(' & ', '-').replace(/ /g, '-');
                        categoryMap[page.category] = {
                            label: page.category,
                            icon: iconMap[parentName] || HelpCircle,
                            name: parentName,
                            subItems: [],
                        };
                    }
                    // Add item to its category
                    categoryMap[page.category].subItems!.push(navItem);
                } else {
                    // This is a top-level item with no category
                    topLevelItems.push(navItem);
                }
            });
            
            // Filter out categories that ended up with no accessible sub-items
            for (const categoryName in categoryMap) {
                if (categoryMap[categoryName].subItems!.length === 0) {
                    delete categoryMap[categoryName];
                }
            }
            
            const finalNavItems = [...topLevelItems, ...Object.values(categoryMap)];
            setNavItems(finalNavItems);
            
        } catch (error) {
            toast({
              variant: 'destructive',
              title: 'Error Loading Navigation',
              description: error instanceof Error ? error.message : "Could not build navigation menu.",
            });
            console.error("Failed to fetch nav items:", error);
        } finally {
            setIsLoadingNav(false);
        }
    };

    fetchNavData();
  }, [user.roleId, company_id, toast]);


  const handleLinkClick = (isExternal: boolean | undefined, e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (!isExternal) {
       setOpenMobile(false);
    }
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <Brand companyName={companyName} />
        </SidebarHeader>
         <LocationSwitcher isMobile={true} />
         <SidebarSeparator />
        <SidebarContent className="p-4">
           {isLoadingNav ? (
                <div className="space-y-2">
                    {Array.from({length: 8}).map((_, i) => <SidebarMenuSkeleton key={i} showIcon />)}
                </div>
           ) : (
                <NavMenu items={navItems} pathname={pathname} handleLinkClick={handleLinkClick} />
           )}
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
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold">{companyName}</h1>
            </div>
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
