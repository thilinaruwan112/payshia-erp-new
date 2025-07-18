
'use client';

import React, { useState, useMemo } from 'react';
import { products, users } from '@/lib/data';
import type { Product, User } from '@/lib/types';
import { ProductGrid } from '@/components/pos/product-grid';
import { OrderPanel } from '@/components/pos/order-panel';
import { PosHeader } from '@/components/pos/pos-header';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ChefHat, Plus, NotebookPen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { AddToCartDialog } from '@/components/pos/add-to-cart-dialog';

export type CartItem = {
  product: Product;
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

let orderCounter = 1;

export default function POSPage() {
  const { toast } = useToast();
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isHeldOrdersOpen, setHeldOrdersOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [currentCashier, setCurrentCashier] = useState(users[2]);

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

  const handleProductSelect = (product: Product) => {
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

  const addToCart = (product: Product, quantity: number, discount: number) => {
    if (!currentOrderId) {
      return;
    }
    setActiveOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id !== currentOrderId) return order;
        const existingItem = order.cart.find(
          (item) => item.product.id === product.id
        );
        let newCart;
        if (existingItem) {
          newCart = order.cart.map((item) =>
            item.product.id === product.id
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

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (!currentOrderId) return;
    setActiveOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id !== currentOrderId) return order;
        let newCart;
        if (newQuantity <= 0) {
          newCart = order.cart.filter((item) => item.product.id !== productId);
        } else {
          newCart = order.cart.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: newQuantity }
              : item
          );
        }
        return { ...order, cart: newCart };
      })
    );
  };

  const removeFromCart = (productId: string) => {
     if (!currentOrderId) return;
     setActiveOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id !== currentOrderId) return order;
        const newCart = order.cart.filter((item) => item.product.id !== productId);
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
      prevOrders.map((order) => {
        const currentOrderIndex = prevOrders.findIndex(o => o.id === currentOrderId);
        if(currentOrderIndex > -1) {
          prevOrders.splice(currentOrderIndex, 1);
        }
        return order;
      })
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
    return products.filter(
      (product) =>
        (category === 'All' || product.category === category) &&
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, category]);
  
  const totalItems = useMemo(() => {
    if (!currentOrder) return 0;
    return currentOrder.cart.reduce((total, item) => total + item.quantity, 0);
  }, [currentOrder]);

  const orderTotals = useMemo((): OrderInfo => {
     if (!currentOrder) return { subtotal: 0, tax: 0, discount: 0, itemDiscounts: 0, total: 0 };
     const subtotal = currentOrder.cart.reduce(
        (acc, item) => acc + item.product.price * item.quantity,
        0
      );
      const itemDiscounts = currentOrder.cart.reduce((acc, item) => acc + (item.itemDiscount || 0), 0);
      const taxRate = 0.08;
      const tax = (subtotal - itemDiscounts) * taxRate;
      const total = subtotal - itemDiscounts + tax - currentOrder.discount;
      return { subtotal, tax, discount: currentOrder.discount, itemDiscounts, total };
  }, [currentOrder]);


  const orderPanelComponent = currentOrder ? (
     <OrderPanel
        key={currentOrder.id}
        cart={currentOrder.cart}
        orderTotals={orderTotals}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onHoldOrder={holdOrder}
        onSendToKitchen={sendToKitchen}
        isDrawer={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        discount={currentOrder.discount}
        setDiscount={setDiscount}
        customer={currentOrder.customer}
        orderName={currentOrder.name}
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
            category={category}
            setCategory={setCategory}
            cashier={currentCashier}
          />
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
            <ProductGrid products={filteredProducts} onProductSelect={handleProductSelect} />
          </main>
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
