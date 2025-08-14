

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Product, User, ProductVariant, Collection, Brand, Invoice, ActiveOrder, CartItem, Table as TableType } from '@/lib/types';
import { ProductGrid } from '@/components/pos/product-grid';
import { OrderPanel } from '@/components/pos/order-panel';
import { PosHeader } from '@/components/pos/pos-header';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ChefHat, Plus, NotebookPen, Loader2, Receipt, Undo2, Settings, History, ArrowLeft, FileText, UserPlus, RefreshCcw, Maximize, Menu, MapPin, Beer, Utensils, Pizza, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AddToCartDialog } from '@/components/pos/add-to-cart-dialog';
import { useLocation } from '@/components/location-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomerFormDialog } from '@/components/customer-form-dialog';
import { users } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export type PosProduct = Product & {
  variant: ProductVariant;
  variantName: string;
};

export type OrderInfo = {
  subtotal: number;
  serviceCharge: number;
  discount: number; // Order-level discount
  itemDiscounts: number; // Sum of all item-level discounts
  total: number;
};


interface ProductWithVariants {
    product: Product;
    variants: ProductVariant[];
}

interface CollectionProductLink {
    product_id: string;
}

interface BalanceDetails {
    grand_total: string;
    total_paid_amount: string;
    balance: number;
    company_id: string;
    customer_id: string;
    ref_id: string;
}

let orderCounter = 1;

const OrderTypeSelection = ({ 
    onSelectOrderType, 
    onSelectTable,
    tables,
    isLoadingTables,
    activeOrders
}: { 
    onSelectOrderType: (type: ActiveOrder['orderType']) => void; 
    onSelectTable: (tableName: string) => void;
    tables: TableType[];
    isLoadingTables: boolean;
    activeOrders: ActiveOrder[];
}) => {
    
    const isTableInUse = (tableName: string) => {
        return activeOrders.some(order => order.tableName === tableName);
    }

    return (
        <main className="p-2">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card className="p-8 text-center text-2xl font-semibold cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => onSelectOrderType('Take Away')}>
                   Take Away
                </Card>
                 <Card className="p-8 text-center text-2xl font-semibold cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => onSelectOrderType('Retail')}>
                   Retail
                </Card>
                 <Card className="p-8 text-center text-2xl font-semibold cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => onSelectOrderType('Delivery')}>
                   Delivery
                </Card>
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-4">Set Table</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                    {isLoadingTables ? (
                        Array.from({length: 8}).map((_, i) => <Card key={i} className="p-4 h-24 animate-pulse bg-muted"></Card>)
                    ) : (
                        tables.map(table => {
                            const inUse = isTableInUse(table.table_name);
                            return (
                            <Card key={table.id} className="p-4 cursor-pointer hover:border-primary" onClick={() => onSelectTable(table.table_name)}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge>Dine-In</Badge>
                                    <Badge variant={!inUse ? 'default' : 'destructive'} className={cn(!inUse && 'bg-green-500')}>{!inUse ? 'Available' : 'In Use'}</Badge>
                                </div>
                                <p className="text-lg font-bold">{table.table_name}</p>
                            </Card>
                        )})
                    )}
                </div>
            </div>
        </main>
    )
}

const StewardSelection = ({ onSelectSteward, onBack, stewards, isLoading }: { onSelectSteward: (steward: User) => void; onBack: () => void; stewards: User[], isLoading: boolean; }) => {
    return (
        <main className="p-2">
             <Button variant="ghost" onClick={onBack} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Order Type
            </Button>
            <h2 className="text-2xl font-bold mb-4">Select Steward</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {isLoading ? (
                    Array.from({length: 4}).map((_, i) => <Card key={i} className="p-4 h-40 animate-pulse bg-muted"></Card>)
                ) : (
                    stewards.map(steward => (
                        <Card key={steward.id} className="p-4 text-center cursor-pointer hover:border-primary" onClick={() => onSelectSteward(steward)}>
                            <Avatar className="h-20 w-20 mx-auto">
                                <AvatarImage src={steward.avatar} alt={steward.name} data-ai-hint="profile photo" />
                                <AvatarFallback>{steward.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <p className="mt-2 font-semibold">{steward.name}</p>
                            <p className="text-xs text-muted-foreground">{steward.role}</p>
                        </Card>
                    ))
                )}
            </div>
        </main>
    )
};


export default function POSPage() {
  const { toast } = useToast();
  const [posProducts, setPosProducts] = useState<PosProduct[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [tables, setTables] = useState<TableType[]>([]);
  const [stewards, setStewards] = useState<User[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingStewards, setIsLoadingStewards] = useState(false);
  const [collectionProducts, setCollectionProducts] = useState<Record<string, string[]>>({});
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<{type: 'category' | 'collection' | 'brand', value: string}>({type: 'category', value: 'All'});

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isNewOrderDialogOpen, setNewOrderDialogOpen] = useState(false);
  const [newOrderDialogStep, setNewOrderDialogStep] = useState<'type' | 'steward'>('type');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [isRefundDialogOpen, setRefundDialogOpen] = useState(false);

  const [isPendingInvoicesDialogOpen, setPendingInvoicesDialogOpen] = useState(false);
  const [selectedReceiptsCustomer, setSelectedReceiptsCustomer] = useState<string | null>(null);
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [isPendingInvoicesLoading, setIsPendingInvoicesLoading] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [invoiceBalance, setInvoiceBalance] = useState<BalanceDetails | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);


  const [selectedProduct, setSelectedProduct] = useState<PosProduct | null>(null);
  const defaultCashier = { id: 'user-3', name: 'Cashier Chloe', role: 'Sales Agent', avatar: 'https://placehold.co/100x100.png?text=CC', email: 'chloe@payshia.com', customer_id: '3' };
  const walkInCustomer = { id: 'user-4', name: 'Walk-in Customer', role: 'Customer', avatar: 'https://placehold.co/100x100.png?text=WC', loyaltyPoints: 0, email: 'walkin@payshia.com', phone: 'N/A', address: 'N/A', customer_id: '4' };

  const [currentCashier, setCurrentCashier] = useState<User>(defaultCashier);
  
  const { currentLocation, isLoading: isLocationLoading, company_id, setCurrentLocation, availableLocations } = useLocation();

  useEffect(() => {
    async function fetchPosData() {
        setIsLoadingProducts(true);
        try {
            const [productsResponse, collectionsResponse, brandsResponse, customersResponse] = await Promise.all([
                fetch(`https://server-erp.payshia.com/products/with-variants`),
                fetch(`https://server-erp.payshia.com/collections/company?company_id=${company_id}`),
                fetch(`https://server-erp.payshia.com/brands/company?company_id=${company_id}`),
                fetch(`https://server-erp.payshia.com/customers/company/filter/?company_id=${company_id}`),
            ]);

            if (!productsResponse.ok || !collectionsResponse.ok || !brandsResponse.ok || !customersResponse.ok) {
                throw new Error('Failed to fetch POS data');
            }
            const productsData: { products: ProductWithVariants[] } = await productsResponse.json();
            const collectionsData: Collection[] = await collectionsResponse.json();
            const brandsData: Brand[] = await brandsResponse.json();
            const customersData: User[] = await customersResponse.json();
            
            const formattedCustomers = customersData.map(c => ({...c, id: c.customer_id, name: `${c.customer_first_name} ${c.customer_last_name}`}));
            setCustomers([walkInCustomer, ...formattedCustomers]);

            setCollections(collectionsData || []);
            setBrands(brandsData || []);
            
            const flattenedProducts = (productsData.products || []).flatMap(p => {
              if (!p.variants || p.variants.length === 0) {
                 return [{
                  ...p.product,
                  price: parseFloat(p.product.price as any) || 0,
                  min_price: parseFloat(p.product.min_price as any) || 0,
                  wholesale_price: parseFloat(p.product.wholesale_price as any) || 0,
                  cost_price: parseFloat(p.product.cost_price as any) || 0,
                  variant: { id: p.product.id, sku: `SKU-${p.product.id}` }, // Create a mock variant
                  variantName: p.product.name,
                }];
              }

              return p.variants.map(v => {
                const variantParts = [p.product.name];
                if (v.color) variantParts.push(v.color);
                if (v.size) variantParts.push(v.size);
                
                return {
                  ...p.product,
                  price: parseFloat(p.product.price as any) || 0,
                  min_price: parseFloat(p.product.min_price as any) || 0,
                  wholesale_price: parseFloat(p.product.wholesale_price as any) || 0,
                  cost_price: parseFloat(p.product.cost_price as any) || 0,
                  variant: v,
                  variantName: variantParts.join(' - '),
                };
              })
            });

            setPosProducts(flattenedProducts);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not fetch data from the server.',
            });
            setPosProducts([]);
            setCollections([]);
            setBrands([]);
        } finally {
            setIsLoadingProducts(false);
        }
    }
    if (company_id) {
        fetchPosData();
    }
  }, [toast, company_id]);
  
  useEffect(() => {
    const fetchPendingInvoices = async () => {
        if (!selectedReceiptsCustomer || !company_id) {
            setPendingInvoices([]);
            return;
        }
        setIsPendingInvoicesLoading(true);
        try {
            const response = await fetch(`https://server-erp.payshia.com/invoices/filter/pending?company_id=${company_id}&customer_code=${selectedReceiptsCustomer}`);
            if (!response.ok) {
                throw new Error('Failed to fetch pending invoices');
            }
            const data = await response.json();
            setPendingInvoices(data);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not fetch invoices for this customer.',
            });
            setPendingInvoices([]);
        } finally {
            setIsPendingInvoicesLoading(false);
        }
    };
    
    if (isPendingInvoicesDialogOpen) {
      fetchPendingInvoices();
    }
  }, [selectedReceiptsCustomer, toast, company_id, isPendingInvoicesDialogOpen]);
  
  useEffect(() => {
    async function fetchPosDialogData() {
        setIsLoadingTables(true);
        setIsLoadingStewards(true);
        try {
            const [tablesResponse, stewardsResponse] = await Promise.all([
                fetch('https://server-erp.payshia.com/master-tables'),
                fetch('https://server-erp.payshia.com/filter/users?user_status=3')
            ]);
            
            if (!tablesResponse.ok) throw new Error('Failed to fetch tables');
            const tablesData = await tablesResponse.json();
            setTables(tablesData);

            if (!stewardsResponse.ok) throw new Error('Failed to fetch stewards');
            const stewardsData = await stewardsResponse.json();
            const formattedStewards = stewardsData.data.map((s: any) => ({
                id: s.id,
                name: `${s.first_name} ${s.last_name}`,
                role: s.acc_type,
                avatar: s.img_path,
                customer_id: s.id,
            }));
            setStewards(formattedStewards);

        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not fetch POS data.',
            });
            setTables([]);
            setStewards([]);
        } finally {
            setIsLoadingTables(false);
            setIsLoadingStewards(false);
        }
    };

    if(isNewOrderDialogOpen) {
        fetchPosDialogData();
    }
  }, [isNewOrderDialogOpen, toast]);

  const handleInvoiceSelect = async (invoice: Invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setIsBalanceLoading(true);
    setInvoiceBalance(null);
    try {
      const response = await fetch(`https://server-erp.payshia.com/invoices/balance?company_id=${company_id}&customer_id=${invoice.customer_code}&ref_id=${invoice.invoice_number}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoice balance');
      }
      const data: BalanceDetails = await response.json();
      setInvoiceBalance(data);
      setPaymentAmount(data.balance.toFixed(2));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch invoice balance details.',
      });
      setInvoiceBalance(null);
    } finally {
        setIsBalanceLoading(false);
    }
  };

  const handleCreateReceipt = async () => {
    if (!selectedInvoiceForPayment || !currentLocation || !invoiceBalance) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please ensure an invoice is selected and all details are available.'
      });
      return;
    }
    setIsSubmittingPayment(true);
    
    const payload = {
        type: paymentMethod === 'Cash' ? '0' : paymentMethod === 'Card' ? '1' : '2',
        is_active: 1,
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: parseFloat(paymentAmount),
        created_by: parseInt(currentCashier.customer_id, 10),
        ref_id: selectedInvoiceForPayment.invoice_number,
        location_id: parseInt(currentLocation.location_id, 10),
        customer_id: parseInt(selectedInvoiceForPayment.customer_code, 10),
        today_invoice: selectedInvoiceForPayment.invoice_number,
        company_id: company_id,
    };
    
    try {
        const response = await fetch('https://server-erp.payshia.com/receipts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to create receipt.");
        }

        toast({
            title: 'Receipt Created!',
            description: `Payment of $${paymentAmount} recorded successfully.`
        });
        setPendingInvoicesDialogOpen(false); // Close dialog on success
        // Reset state
        setSelectedInvoiceForPayment(null);
        setInvoiceBalance(null);
        setPaymentAmount('');
        setSelectedReceiptsCustomer(null);

    } catch (error) {
         const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
         toast({
            variant: 'destructive',
            title: 'Error Creating Receipt',
            description: errorMessage
        });
    } finally {
        setIsSubmittingPayment(false);
    }
  };


  const handleFilterChange = async (type: 'category' | 'collection' | 'brand', value: string) => {
    setActiveFilter({ type, value });
    if (type === 'collection' && value !== 'All' && !collectionProducts[value]) {
        // Fetch products for this collection if not already fetched
        try {
            const response = await fetch(`https://server-erp.payshia.com/collection-products/collection/${value}`);
            if (!response.ok) throw new Error('Failed to fetch collection products');
            const data: CollectionProductLink[] = await response.json();
            setCollectionProducts(prev => ({ ...prev, [value]: data.map(p => p.product_id) }));
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load products for this collection.' });
        }
    }
  }


  const currentOrder = useMemo(
    () => activeOrders.find((order) => order.id === currentOrderId),
    [activeOrders, currentOrderId]
  );
  
  const createNewOrder = (
    orderType: ActiveOrder['orderType'], 
    steward?: User,
    tableName?: string,
) => {
    const newOrder: ActiveOrder = {
      id: `order-${Date.now()}`,
      name: tableName ? tableName : `${orderType} #${orderCounter++}`,
      cart: [],
      discount: 0,
      serviceCharge: 0,
      serviceChargeEnabled: false,
      customer: walkInCustomer,
      orderType,
      tableName,
      steward,
    };
    setActiveOrders((prev) => [...prev, newOrder]);
    setCurrentOrderId(newOrder.id);
    setNewOrderDialogOpen(false);
    setNewOrderDialogStep('type');
    setSelectedTable(null);
  };
  
  const handleSendToKitchen = () => {
    if (!currentOrder || currentOrder.cart.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Cart is empty',
        description: 'Cannot send an empty order to the kitchen.',
      });
      return;
    }
    const orderData = {
        orderId: currentOrder.id,
        orderName: currentOrder.name,
        cashierName: currentCashier.name,
        items: currentOrder.cart.map(item => ({ name: item.product.variantName, quantity: item.quantity })),
    };
    
    const encodedData = btoa(JSON.stringify(orderData));
    window.open(`/pos/kot/${currentOrder.id}?data=${encodedData}`, '_blank');
    
    toast({
      title: 'KOT Sent!',
      description: `Order for ${currentOrder.name} sent to the kitchen.`,
      icon: <ChefHat className="h-6 w-6 text-green-500" />,
    });
  };

  const handleProductSelect = (product: PosProduct) => {
    if (!currentOrderId) {
       toast({
        variant: 'destructive',
        title: 'No Active Order',
        description: 'Please create a new order first.',
      });
      return;
    }
    setSelectedProduct(product);
  }

  const addToCart = (product: PosProduct, quantity: number, discount: number) => {
    if (!currentOrderId) {
      return;
    }
    setActiveOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id !== currentOrderId) return order;
        const existingItem = order.cart.find(
          (item) => item.product.variant.id === product.variant.id
        );
        let newCart;
        if (existingItem) {
          newCart = order.cart.map((item) =>
            item.product.variant.id === product.variant.id
              ? { ...item, quantity: item.quantity + quantity, itemDiscount: (item.itemDiscount || 0) + discount }
              : item
          );
        } else {
          newCart = [...order.cart, { product, quantity, itemDiscount: discount }];
        }
        return { ...order, cart: newCart };
      })
    );
    setSelectedProduct(null); // Close the dialog
  };

  const updateQuantity = (variantId: string, newQuantity: number) => {
    if (!currentOrderId) return;
    setActiveOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id !== currentOrderId) return order;
        let newCart;
        if (newQuantity <= 0) {
          newCart = order.cart.filter((item) => item.product.variant.id !== variantId);
        } else {
          newCart = order.cart.map((item) =>
            item.product.variant.id === variantId
              ? { ...item, quantity: newQuantity }
              : item
          );
        }
        return { ...order, cart: newCart };
      })
    );
  };

  const removeFromCart = (variantId: string) => {
     if (!currentOrderId) return;
     setActiveOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id !== currentOrderId) return order;
        const newCart = order.cart.filter((item) => item.product.variant.id !== variantId);
        return {...order, cart: newCart };
      })
    );
  };

  const holdOrder = () => {
    if (!currentOrder || currentOrder.cart.length === 0) {
        toast({
            variant: 'default',
            title: 'Cannot Hold Empty Order',
            description: 'Add items to the cart before holding.',
        });
        return;
    }
    toast({
        title: 'Order Held',
        description: `${currentOrder.name} has been put on hold.`,
    });
    setCurrentOrderId(null);
    setDrawerOpen(false);
  }

  const clearCart = () => {
    if (!currentOrderId) return;
    setActiveOrders((prevOrders) =>
        prevOrders.filter((order) => order.id !== currentOrderId)
    );
    setCurrentOrderId(null);
    setDrawerOpen(false); // Close drawer after clearing cart
  };

  const setDiscount = (newDiscount: number) => {
    if (!currentOrderId) return;
     setActiveOrders((prevOrders) =>
      prevOrders.map((order) => 
        order.id === currentOrderId ? { ...order, discount: newDiscount } : order
      )
    );
  }

  const toggleServiceCharge = (enabled: boolean) => {
    if (!currentOrderId) return;
    setActiveOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === currentOrderId ? { ...order, serviceChargeEnabled: enabled } : order
      )
    );
  };
  
  const updateOrderDetails = (orderId: string, newDetails: Partial<Pick<ActiveOrder, 'orderType' | 'tableName' | 'steward'>>) => {
      setActiveOrders(prevOrders => prevOrders.map(order => {
          if (order.id === orderId) {
              const updatedOrder = { ...order, ...newDetails };
              if (newDetails.tableName) {
                  updatedOrder.name = newDetails.tableName;
              } else if (newDetails.orderType) {
                   updatedOrder.name = `${newDetails.orderType} #${order.id.slice(-4)}`;
              }
              return updatedOrder;
          }
          return order;
      }));
  };
  
  const updateCustomer = (orderId: string, customer: User) => {
    setActiveOrders(prevOrders => prevOrders.map(order => 
        order.id === orderId ? { ...order, customer } : order
    ));
  }

  const filteredProducts = useMemo(() => {
    let productsToFilter = posProducts;
    
    if (activeFilter.type === 'brand') {
       if (activeFilter.value !== 'All') {
         productsToFilter = posProducts.filter(p => p.brand_id === activeFilter.value);
       }
    } else if (activeFilter.type === 'collection') {
        const productIdsInCollection = collectionProducts[activeFilter.value];
        if (productIdsInCollection) {
            productsToFilter = posProducts.filter(p => productIdsInCollection.includes(p.id));
        } else if (activeFilter.value !== 'All') {
             return []; // Or show loading state
        }
    } else if (activeFilter.type === 'category' && activeFilter.value !== 'All') {
        productsToFilter = posProducts.filter(p => p.category === activeFilter.value);
    }
    
    return productsToFilter.filter(product =>
      product.variantName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, activeFilter, posProducts, collectionProducts]);
  
  const totalItems = useMemo(() => {
    if (!currentOrder) return 0;
    return currentOrder.cart.reduce((total, item) => total + item.quantity, 0);
  }, [currentOrder]);

  const orderTotals = useMemo((): OrderInfo => {
     if (!currentOrder) return { subtotal: 0, serviceCharge: 0, discount: 0, itemDiscounts: 0, total: 0 };
     const subtotal = currentOrder.cart.reduce(
        (acc, item) => acc + (item.product.price as number) * item.quantity,
        0
      );
      const itemDiscounts = currentOrder.cart.reduce((acc, item) => acc + (item.itemDiscount || 0), 0);
      const serviceCharge = currentOrder.serviceChargeEnabled ? subtotal * 0.10 : 0;
      const total = subtotal - itemDiscounts + serviceCharge - currentOrder.discount;
      return { subtotal, serviceCharge: serviceCharge, discount: currentOrder.discount, itemDiscounts, total };
  }, [currentOrder]);

   if (isLocationLoading) {
    return <div className="flex h-screen w-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
  }

  if (!currentLocation) {
    const posLocations = availableLocations.filter(loc => loc.pos_status === '1');
    return (
        <div className="flex h-screen w-screen items-center justify-center p-4">
             <Card className="text-center w-full max-w-lg">
                <CardHeader>
                    <MapPin className="h-12 w-12 mx-auto text-primary" />
                    <CardTitle className="mt-4">Select a Location</CardTitle>
                    <CardDescription>Choose your current Point of Sale location to begin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {posLocations.length > 0 ? (
                        posLocations.map(loc => (
                            <Button 
                                key={loc.location_id}
                                className="w-full h-12 text-lg" 
                                variant="outline"
                                onClick={() => setCurrentLocation(loc)}
                            >
                                {loc.location_name}
                            </Button>
                        ))
                    ) : (
                        <p className="text-muted-foreground">No POS-enabled locations found. Please configure one in the admin dashboard.</p>
                    )}
                </CardContent>
                 <CardFooter>
                    <Button asChild className="w-full" variant="link">
                        <Link href="/dashboard" target="_blank">
                            Go to Admin Dashboard
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
  }

  const orderPanelComponent = currentOrder ? (
     <OrderPanel
        key={currentOrder.id}
        order={currentOrder}
        orderTotals={orderTotals}
        cashierName={currentCashier.name}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={() => clearCart()}
        onHoldOrder={holdOrder}
        onSendToKitchen={handleSendToKitchen}
        isDrawer={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        setDiscount={setDiscount}
        toggleServiceCharge={toggleServiceCharge}
        onUpdateDetails={updateOrderDetails}
        availableTables={tables}
        availableStewards={stewards}
        customers={customers}
        onUpdateCustomer={updateCustomer}
     />
  ) : (
      <div className="flex flex-col h-full bg-card items-center justify-center text-center p-8">
        <NotebookPen className="h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">No Active Order</h3>
        <p className="text-muted-foreground mt-2">Select a held order or create a new one to begin.</p>
      </div>
  );

  const heldOrdersList = (
    <div className='p-4 space-y-2'>
        <h3 className='font-bold text-lg mb-2'>Held Orders</h3>
        {activeOrders.filter(o => o.id !== currentOrderId).map(order => (
            <Button key={order.id} variant="outline" className='w-full justify-between' onClick={() => {
                setCurrentOrderId(order.id);
                setDrawerOpen(false); // also close held orders drawer if open
            }}>
                <span>{order.name}</span>
                <Badge>{order.cart.reduce((acc, item) => acc + item.quantity, 0)}</Badge>
            </Button>
        ))}
         {activeOrders.filter(o => o.id !== currentOrderId).length === 0 && (
            <p className='text-muted-foreground text-sm'>No orders are currently on hold.</p>
        )}
    </div>
  );
  
  const categories = ['All', ...new Set(posProducts.map((p) => p.category))];

  return (
    <>
      <AddToCartDialog
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />
       <Dialog open={isRefundDialogOpen} onOpenChange={setRefundDialogOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                         <h2 className="text-2xl font-bold">Select Return Products</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">Note : A La Carte Items cannot be Returned!</p>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Select Customer</Label>
                        <Select><SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger><SelectContent></SelectContent></Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Select Invoice (If Available)</Label>
                        <Select><SelectTrigger><SelectValue placeholder="Select Invoice" /></SelectTrigger><SelectContent></SelectContent></Select>
                    </div>
                     <div className="col-span-2 space-y-2">
                        <Label>Reason</Label>
                        <Input placeholder="Enter Reason for Return" />
                    </div>
                </div>
                 {/* TODO: Add product selection list here */}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
                    <Button>Process Return</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      <div className="flex h-screen w-screen overflow-hidden">
        <div className="flex-1 flex flex-col overflow-y-auto">
          <PosHeader
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            cashier={currentCashier}
          />
          <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
                <Dialog open={isPendingInvoicesDialogOpen} onOpenChange={setPendingInvoicesDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <FileText className="mr-2 h-4 w-4" />
                            Pending Invoices
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>View Pending Invoices</DialogTitle>
                          <DialogDescription>Select a customer to view their pending invoices and record payments.</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div className="space-y-4">
                                <Select onValueChange={setSelectedReceiptsCustomer}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a customer..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map(c => (
                                            <SelectItem key={c.customer_id} value={c.customer_id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <ScrollArea className="h-96">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Invoice ID</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isPendingInvoicesLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                                        <Loader2 className="h-6 w-6 animate-spin inline-block" />
                                                    </TableCell>
                                                </TableRow>
                                            ) : pendingInvoices.length > 0 ? (
                                                pendingInvoices.map(invoice => (
                                                    <TableRow key={invoice.id} onClick={() => handleInvoiceSelect(invoice)} className="cursor-pointer hover:bg-muted">
                                                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                                                        <TableCell>{format(new Date(invoice.invoice_date), 'dd MMM yyyy')}</TableCell>
                                                        <TableCell className="text-right font-mono">${parseFloat(invoice.grand_total).toLocaleString('en-US', {minimumFractionDigits: 2})}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                                        No pending invoices found for this customer.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </div>
                            <Card className="h-full">
                                {selectedInvoiceForPayment ? (
                                    <>
                                    <CardHeader>
                                        <CardTitle>Payment for {selectedInvoiceForPayment.invoice_number}</CardTitle>
                                        {isBalanceLoading && <CardDescription>Loading balance details...</CardDescription>}
                                    </CardHeader>
                                    <CardContent>
                                        {isBalanceLoading ? (
                                            <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                                        ) : invoiceBalance ? (
                                            <div className="space-y-4">
                                                 <div className="grid grid-cols-2 gap-4">
                                                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                                                        <p className="text-xs text-muted-foreground">Paid Amount</p>
                                                        <p className="text-lg font-bold text-green-600">${parseFloat(invoiceBalance.total_paid_amount).toFixed(2)}</p>
                                                    </div>
                                                    <div className="text-center p-2 bg-destructive/10 rounded-lg">
                                                        <p className="text-xs text-destructive/80">Due Amount</p>
                                                        <p className="text-lg font-bold text-destructive">${invoiceBalance.balance.toFixed(2)}</p>
                                                    </div>
                                                 </div>
                                                 <div className="space-y-4 pt-4 border-t">
                                                    <Label htmlFor="payment-method">Payment Method</Label>
                                                    <Select onValueChange={setPaymentMethod} defaultValue={paymentMethod}>
                                                        <SelectTrigger id="payment-method"><SelectValue placeholder="Select Payment Method" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Cash">Cash</SelectItem>
                                                            <SelectItem value="Card">Card</SelectItem>
                                                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                     <Label htmlFor="payment-amount">Amount</Label>
                                                    <Input 
                                                        id="payment-amount"
                                                        placeholder="Amount" 
                                                        type="number" 
                                                        value={paymentAmount}
                                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                                    />
                                                 </div>
                                            </div>
                                        ) : (
                                            <p className="text-destructive text-center py-12">Could not load balance information.</p>
                                        )}
                                    </CardContent>
                                     <CardFooter>
                                        <Button className="w-full" onClick={handleCreateReceipt} disabled={isBalanceLoading || !invoiceBalance || isSubmittingPayment}>
                                            {isSubmittingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Proceed
                                        </Button>
                                    </CardFooter>
                                    </>
                                ) : (
                                    <div className="flex flex-col h-full items-center justify-center text-center text-muted-foreground p-8">
                                        <p>Select an invoice to view payment details.</p>
                                    </div>
                                )}
                            </Card>
                        </div>
                    </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" onClick={() => setRefundDialogOpen(true)}>
                    <Undo2 className="mr-2 h-4 w-4" /> Refund
                </Button>
            </div>
            <div className="flex items-center gap-2">
               <Drawer>
                  <DrawerTrigger asChild>
                      <Button variant="outline">
                          <NotebookPen className="mr-2 h-4 w-4" />
                          Held Orders ({activeOrders.filter(o => o.id !== currentOrderId).length})
                      </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                      {heldOrdersList}
                  </DrawerContent>
              </Drawer>
              <Dialog open={isNewOrderDialogOpen} onOpenChange={setNewOrderDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Order
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">Create New Order</DialogTitle>
                            <DialogDescription>Select an order type or choose a table for dine-in.</DialogDescription>
                        </DialogHeader>
                        {newOrderDialogStep === 'type' ? (
                            <OrderTypeSelection 
                                onSelectOrderType={(type) => createNewOrder(type)} 
                                onSelectTable={(tableName) => {
                                    setSelectedTable(tableName);
                                    setNewOrderDialogStep('steward');
                                }} 
                                tables={tables}
                                isLoadingTables={isLoadingTables}
                                activeOrders={activeOrders}
                            />
                        ) : (
                             <StewardSelection
                                onBack={() => setNewOrderDialogStep('type')}
                                onSelectSteward={(steward) => createNewOrder('Dine-In', steward, selectedTable!)}
                                stewards={stewards}
                                isLoading={isLoadingStewards}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </div>
          </div>
           <div className="flex-1 flex overflow-hidden">
            {/* Main Content */}
            <ScrollArea className="flex-1 p-4">
              {isLoadingProducts ? (
                <div className="flex items-center justify-center h-[calc(100vh-250px)]">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : (
                  <ProductGrid products={filteredProducts} onProductSelect={handleProductSelect} />
              )}
            </ScrollArea>
            {/* Category Sidebar */}
            <aside className="hidden md:block w-48 border-l border-border overflow-y-auto">
                <ScrollArea className="h-full p-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground px-2 mb-2">Categories</h3>
                    <div className="flex flex-col gap-1">
                        {categories.map(cat => (
                            <Button
                                key={cat}
                                variant={activeFilter.type === 'category' && activeFilter.value === cat ? 'secondary' : 'ghost'}
                                className="justify-start"
                                onClick={() => handleFilterChange('category', cat)}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                     <h3 className="text-xs font-semibold uppercase text-muted-foreground px-2 my-2 pt-2 border-t">Collections</h3>
                    <div className="flex flex-col gap-1">
                        <Button
                            variant={activeFilter.type === 'collection' && activeFilter.value === 'All' ? 'secondary' : 'ghost'}
                            className="justify-start"
                            onClick={() => handleFilterChange('collection', 'All')}
                        >
                            All Collections
                        </Button>
                        {collections.map(col => (
                            <Button
                                key={col.id}
                                variant={activeFilter.type === 'collection' && activeFilter.value === col.id ? 'secondary' : 'ghost'}
                                className="justify-start"
                                onClick={() => handleFilterChange('collection', col.id)}
                            >
                                {col.title}
                            </Button>
                        ))}
                    </div>
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground px-2 my-2 pt-2 border-t">Brands</h3>
                    <div className="flex flex-col gap-1">
                         <Button
                            variant={activeFilter.type === 'brand' && activeFilter.value === 'All' ? 'secondary' : 'ghost'}
                            className="justify-start"
                            onClick={() => handleFilterChange('brand', 'All')}
                        >
                            All Brands
                        </Button>
                        {brands.map(brand => (
                            <Button
                                key={brand.id}
                                variant={activeFilter.type === 'brand' && activeFilter.value === brand.id ? 'secondary' : 'ghost'}
                                className="justify-start"
                                onClick={() => handleFilterChange('brand', brand.id)}
                            >
                                {brand.name}
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </aside>
           </div>
        </div>

        {/* Desktop Order Panel - always visible on large screens */}
        <aside className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 bg-card border-t lg:border-t-0 lg:border-l border-border flex-col hidden lg:flex">
          {orderPanelComponent}
        </aside>

        {/* Mobile "View Order" button and Drawer - only on small screens */}
          <div className="lg:hidden">
            {currentOrder && currentOrder.cart.length > 0 && (
              <div className="fixed bottom-4 left-4 right-4 z-20">
                <Drawer open={isDrawerOpen} onOpenChange={setDrawerOpen}>
                    <DrawerTrigger asChild>
                          <Button className="w-full h-16 text-lg shadow-lg">
                            <div className="flex items-center justify-between w-full">
                                <div className='flex items-center gap-2'>
                                    <ShoppingCart className="h-6 w-6" />
                                    <span>View {currentOrder.name}</span>
                                    <Badge variant="secondary" className="text-base">{totalItems}</Badge>
                                </div>
                                <span className='font-bold'>${orderTotals.total.toFixed(2)}</span>
                            </div>
                        </Button>
                    </DrawerTrigger>
                    <DrawerContent className='h-[90vh]'>
                        {orderPanelComponent}
                    </DrawerContent>
                </Drawer>
              </div>
            )}
          </div>
      </div>
    </>
  );
}
