
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { users } from '@/lib/data';
import type { Product, User, ProductVariant, Collection, Brand } from '@/lib/types';
import { ProductGrid } from '@/components/pos/product-grid';
import { OrderPanel } from '@/components/pos/order-panel';
import { PosHeader } from '@/components/pos/pos-header';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ChefHat, Plus, NotebookPen, Loader2, Receipt, Undo2, Settings, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { AddToCartDialog } from '@/components/pos/add-to-cart-dialog';
import { useLocation } from '@/components/location-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export type PosProduct = Product & {
  variant: ProductVariant;
  variantName: string;
};

export type CartItem = {
  product: PosProduct;
  quantity: number;
  itemDiscount?: number;
};

export type OrderInfo = {
  subtotal: number;
  tax: number;
  discount: number; // Order-level discount
  itemDiscounts: number; // Sum of all item-level discounts
  total: number;
};

export type ActiveOrder = {
  id: string;
  name: string;
  cart: CartItem[];
  discount: number; // Order-level discount
  customer: User;
};

interface ProductWithVariants {
    product: Product;
    variants: ProductVariant[];
}

interface CollectionProductLink {
    product_id: string;
}


let orderCounter = 1;

export default function POSPage() {
  const { toast } = useToast();
  const [posProducts, setPosProducts] = useState<PosProduct[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [collectionProducts, setCollectionProducts] = useState<Record<string, string[]>>({});
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<{type: 'category' | 'collection' | 'brand', value: string}>({type: 'category', value: 'All'});

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isHeldOrdersOpen, setHeldOrdersOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<PosProduct | null>(null);

  const [currentCashier, setCurrentCashier] = useState(users[2]);
  
  const { currentLocation, isLoading: isLocationLoading } = useLocation();

  useEffect(() => {
    async function fetchPosData() {
        setIsLoadingProducts(true);
        try {
            const [productsResponse, collectionsResponse, brandsResponse] = await Promise.all([
                fetch(`https://server-erp.payshia.com/products/with-variants`),
                fetch(`https://server-erp.payshia.com/collections/company?company_id=1`),
                fetch(`https://server-erp.payshia.com/brands/company?company_id=1`)
            ]);

            if (!productsResponse.ok || !collectionsResponse.ok || !brandsResponse.ok) {
                throw new Error('Failed to fetch POS data');
            }
            const productsData: { products: ProductWithVariants[] } = await productsResponse.json();
            const collectionsData: Collection[] = await collectionsResponse.json();
            const brandsData: Brand[] = await brandsResponse.json();
            
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
    fetchPosData();
  }, [toast]);
  
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
  
  const createNewOrder = () => {
    const newOrder: ActiveOrder = {
      id: `order-${Date.now()}`,
      name: `Order #${orderCounter++}`,
      cart: [],
      discount: 0,
      customer: users[3], // Default to a walk-in customer
    };
    setActiveOrders((prev) => [...prev, newOrder]);
    setCurrentOrderId(newOrder.id);
  };
  
  // Start with one order on load
  React.useEffect(() => {
    if (activeOrders.length === 0) {
      createNewOrder();
    }
  }, [activeOrders.length]);

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
    createNewOrder(); // Create a new empty order after clearing the paid one
    setDrawerOpen(false); // Close drawer after clearing cart
  };

  const sendToKitchen = () => {
    if (!currentOrder || currentOrder.cart.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Cart is empty',
        description: 'Cannot send an empty order to the kitchen.',
      });
      return;
    }
    toast({
      title: 'KOT Sent!',
      description: `Order for ${currentOrder.name} sent to the kitchen.`,
      icon: <ChefHat className="h-6 w-6 text-green-500" />,
    });
  };

  const setDiscount = (newDiscount: number) => {
    if (!currentOrderId) return;
     setActiveOrders((prevOrders) =>
      prevOrders.map((order) => 
        order.id === currentOrderId ? { ...order, discount: newDiscount } : order
      )
    );
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
        } else {
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
     if (!currentOrder) return { subtotal: 0, tax: 0, discount: 0, itemDiscounts: 0, total: 0 };
     const subtotal = currentOrder.cart.reduce(
        (acc, item) => acc + (item.product.price as number) * item.quantity,
        0
      );
      const itemDiscounts = currentOrder.cart.reduce((acc, item) => acc + (item.itemDiscount || 0), 0);
      const taxRate = 0.08;
      const tax = (subtotal - itemDiscounts) * taxRate;
      const total = subtotal - itemDiscounts + tax - currentOrder.discount;
      return { subtotal, tax, discount: currentOrder.discount, itemDiscounts, total };
  }, [currentOrder]);

   if (isLocationLoading) {
    return <div className="flex h-screen w-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
  }

  if (!currentLocation) {
    return (
        <div className="flex h-screen w-screen items-center justify-center p-4">
             <Card className="text-center">
                <CardHeader>
                    <CardTitle>No Location Found</CardTitle>
                    <CardDescription>Could not find a location with POS enabled. Please check your locations settings in the admin dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/locations" target="_blank">
                            Go to Locations
                        </Link>
                    </Button>
                </CardContent>
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
        onSendToKitchen={sendToKitchen}
        isDrawer={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        setDiscount={setDiscount}
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
                setHeldOrdersOpen(false);
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] h-screen w-screen bg-background text-foreground overflow-hidden">
        <div className="flex-1 flex flex-col overflow-y-auto">
          <PosHeader
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            cashier={currentCashier}
          />
          <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm"><History className="mr-2 h-4 w-4" /> Receipts</Button>
              <Button variant="outline" size="sm"><Undo2 className="mr-2 h-4 w-4" /> Refund</Button>
              <Button variant="outline" size="sm"><Undo2 className="mr-2 h-4 w-4" /> Return</Button>
            </div>
            <div className="flex items-center gap-2">
               <Button variant="outline" size="sm"><Settings className="mr-2 h-4 w-4" /> Settings</Button>
            </div>
          </div>
           <div className="flex-1 flex">
            {/* Main Content */}
            <main className="flex-1 p-4">
              <div className="flex justify-end gap-2 mb-4">
                <Drawer open={isHeldOrdersOpen} onOpenChange={setHeldOrdersOpen}>
                    <DrawerTrigger asChild>
                        <Button variant="outline" size="lg">
                            <NotebookPen className="mr-2 h-4 w-4" />
                            Held Orders ({activeOrders.filter(o => o.id !== currentOrderId).length})
                        </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                        {heldOrdersList}
                    </DrawerContent>
                </Drawer>
                <Button onClick={createNewOrder} size="lg">
                    <Plus className="mr-2 h-4 w-4" /> New Order
                </Button>
              </div>
              {isLoadingProducts ? (
                <div className="flex items-center justify-center h-[calc(100vh-250px)]">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : (
                  <ProductGrid products={filteredProducts} onProductSelect={handleProductSelect} />
              )}
            </main>
            {/* Category Sidebar */}
            <aside className="hidden md:block w-48 border-l border-border">
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

