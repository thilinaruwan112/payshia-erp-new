
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Table as TableType, Invoice, Product, ProductVariant, Collection, Brand, User, ActiveOrder, CartItem, StockInfo, PaymentMethod } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Utensils, Users, NotebookPen, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { fetcher } from '@/lib/api';
import { useCurrency } from '@/components/currency-provider';
import { ProductGrid, type PosProduct } from '@/components/pos/product-grid';
import { OrderPanel, type OrderInfo } from '@/components/pos/order-panel';
import { AddToCartDialog } from '@/components/pos/add-to-cart-dialog';
import { format } from 'date-fns';
import { openCenteredPopup } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ProductWithVariantsResponse {
    product: Product;
    variants: { variant: ProductVariant; images: any[] }[];
    product_images: any[];
}

export default function StewardDashboard() {
  const [tables, setTables] = useState<TableType[]>([]);
  const [heldOrders, setHeldOrders] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { company_id, currentLocation } = useLocation();
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();

  const [activeTable, setActiveTable] = useState<TableType | null>(null);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [posProducts, setPosProducts] = useState<PosProduct[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [stewards, setStewards] = useState<User[]>([]);
   const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isServiceChargeActive, setIsServiceChargeActive] = useState(true);
  
  const [selectedProduct, setSelectedProduct] = useState<PosProduct | null>(null);
  const [currentSteward, setCurrentSteward] = useState<User | null>(null);


    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        if (userId && userName) {
        setCurrentSteward({
            id: userId,
            customer_id: userId,
            user_name: userName,
            first_name: userName,
            last_name: '',
            role: 'Steward',
        });
        }
  }, []);

  const fetchData = useCallback(async () => {
    if (!company_id || !currentLocation) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [tablesResponse, heldOrdersResponse, productsResponse, customersResponse, stewardsResponse, paymentMethodsResponse] = await Promise.all([
        fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/master-tables/filter/by-company?company_id=${company_id}`),
        fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/invoices/filter/hold/by-company-status?company_id=${company_id}&invoice_status=2`),
        fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${company_id}`),
        fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/company/filter/?company_id=${company_id}`),
        fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/filter/users?company_id=${company_id}&user_status=3`),
        fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/payment-method/filter/by-company?company_id=${company_id}`),
      ]);

      if (!tablesResponse.ok) throw new Error('Failed to fetch tables');
      const allTables: TableType[] = await tablesResponse.json() || [];
      const locationTables = allTables.filter(t => t.location_id === currentLocation.location_id);
      setTables(locationTables);

      if (!heldOrdersResponse.ok) throw new Error('Failed to fetch held orders');
      const allHeldOrders: Invoice[] = await heldOrdersResponse.json() || [];
      const locationHeldOrders = allHeldOrders.filter(o => o.location_id === currentLocation.location_id);
      setHeldOrders(locationHeldOrders);

      if (!productsResponse.ok) throw new Error('Failed to fetch products');
      const productsData: { products: ProductWithVariantsResponse[] } = await productsResponse.json();
      const locationFilteredProducts = (productsData.products || []).filter(p => p.product.available_locations?.split(',').includes(currentLocation.location_id) && p.product.item_type !== 'raw');
      const flattenedProducts = locationFilteredProducts.flatMap(p => {
        const mainProductFrontImage = p.product_images.find(img => img.image_type === 'front img')?.img_url || p.product.product_image_url;
        return p.variants.map(v => {
            const variantFrontImage = v.images.find(img => img.image_type === 'front img')?.img_url;
            const finalImageUrl = variantFrontImage || mainProductFrontImage;
            const variantAttributes = [v.variant.color, v.variant.size].filter(Boolean).join(' - ');
            const variantName = variantAttributes ? `${p.product.name} - ${variantAttributes}` : `${p.product.name} (${v.variant.sku})`;
            return { ...p.product, imageUrl: finalImageUrl ? `${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${finalImageUrl}` : undefined, price: parseFloat(v.variant.price as any) || 0, variant: v.variant, variantName };
        });
      });
      setPosProducts(flattenedProducts);

      if (!customersResponse.ok) throw new Error('Failed to fetch customers');
      setCustomers((await customersResponse.json()) || []);
      
       if (!paymentMethodsResponse.ok) throw new Error('Failed to fetch payment methods');
      setPaymentMethods((await paymentMethodsResponse.json()) || []);

      if (!stewardsResponse.ok) throw new Error('Failed to fetch stewards');
      const stewardsResult = await stewardsResponse.json();
      const stewardsData = stewardsResult.data || [];
      setStewards((stewardsData || []).map((s: any) => ({ 
        id: s.id, user_name: `${s.first_name} ${s.last_name}`, role: s.acc_type, 
        avatar: s.img_path, customer_id: s.id, first_name: s.first_name, last_name: s.last_name
      })));

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch dashboard data.' });
    } finally {
      setIsLoading(false);
    }
  }, [company_id, currentLocation, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTableClick = async (table: TableType) => {
    setActiveTable(table);
    const existingOrder = heldOrders.find(order => order.table_id === table.id);
    if (existingOrder) {
        // Load existing order
        const findPosProduct = (variantId: string | undefined): PosProduct | undefined => {
            if (!variantId) return undefined;
            return posProducts.find(p => p.variant.id === variantId);
        }
        const cartItemsPromises = (existingOrder.items || []).map(async (item): Promise<CartItem | null> => {
            const product = findPosProduct(item.product_variant_id);
            if (!product) return null;
            const placeholderBatch: StockInfo = { product_id: item.product_id.toString(), product_variant_id: item.product_variant_id || item.product_id.toString(), patch_code: 'HELD', expire_date: 'N/A', total_in: '0', total_out: '0', stock_balance: '9999' };
            return { uniqueId: `${product.variant.id}-HELD-${item.id}`, product, quantity: parseFloat(String(item.quantity)), itemDiscount: parseFloat(String(item.item_discount)), batch: placeholderBatch, originalItemId: item.id, originalQuantity: parseFloat(String(item.quantity)) };
        });
        const loadedCartItems = (await Promise.all(cartItemsPromises)).filter((item): item is CartItem => item !== null);
        const customer = customers.find(c => c.customer_id === existingOrder.customer_code);
        const steward = stewards.find(s => s.id === existingOrder.steward_id);
        
        setActiveOrder({
          id: `order-${Date.now()}`, name: table.table_name, cart: loadedCartItems,
          discount: parseFloat(existingOrder.discount_amount) - loadedCartItems.reduce((acc, item) => acc + (item.itemDiscount || 0), 0),
          serviceCharge: parseFloat(existingOrder.service_charge), customer: customer || customers[0],
          orderType: 'Dine-In', tableName: table.table_name, steward: steward,
          originalInvoiceNumber: existingOrder.invoice_number,
        });

    } else {
      // Create new order for this table
      setActiveOrder({
        id: `order-${Date.now()}`, name: table.table_name, cart: [], discount: 0, serviceCharge: 0,
        customer: customers[0], orderType: 'Dine-In', tableName: table.table_name, steward: currentSteward || undefined
      });
    }
  };
  
  const addToCart = async (product: PosProduct, quantity: number, discount: number, batch: StockInfo, imageUrl?: string) => {
    if (!activeOrder) return;
    
    setActiveOrder(prevOrder => {
      if (!prevOrder) return null;
      const existingItemIndex = prevOrder.cart.findIndex(item => item.product.variant.id === product.variant.id && item.batch.patch_code === batch.patch_code);
      let newCart;
      if (existingItemIndex > -1) {
          newCart = [...prevOrder.cart];
          newCart[existingItemIndex] = { ...newCart[existingItemIndex], quantity: newCart[existingItemIndex].quantity + quantity, itemDiscount: (newCart[existingItemIndex].itemDiscount || 0) + discount };
      } else {
          newCart = [...prevOrder.cart, { uniqueId: `${product.variant.id}-${batch.patch_code}-${Date.now()}`, product: {...product, imageUrl }, quantity, itemDiscount: discount, batch }];
      }
      return { ...prevOrder, cart: newCart };
    });
    setSelectedProduct(null);
  };
  
   const orderTotals = useMemo((): OrderInfo => {
    if (!activeOrder || !currentLocation) return { subtotal: 0, serviceCharge: 0, tdl: 0, sscl: 0, vat: 0, discount: 0, itemDiscounts: 0, total: 0 };
    const { cart, discount, orderType } = activeOrder;
    const { service_charge_status, tdl_status, sscl_status, vat_status } = currentLocation;
    let subtotal = 0; let itemDiscounts = 0;
    for (const item of cart) {
      subtotal += (item.product.price as number) * item.quantity;
      itemDiscounts += item.itemDiscount || 0;
    }
    const baseForTaxes = subtotal - itemDiscounts;
    let serviceCharge = 0;
    if (orderType === 'Dine-In' && service_charge_status === 'Enabled' && isServiceChargeActive) serviceCharge = baseForTaxes * 0.10;
    const baseForTdl = baseForTaxes + serviceCharge;
    let tdl = (tdl_status === 'Enabled') ? baseForTdl * 0.01 : 0;
    const baseForSscl = baseForTaxes + serviceCharge;
    let sscl = (sscl_status === 'Enabled') ? baseForSscl * 0.025 : 0;
    const baseForVat = baseForTaxes + serviceCharge + tdl + sscl;
    let vat = (vat_status === 'Enabled') ? baseForVat * 0.18 : 0;
    const total = baseForTaxes + serviceCharge + tdl + sscl + vat - discount;
    return { subtotal, serviceCharge, tdl, sscl, vat, discount, itemDiscounts, total };
  }, [activeOrder, currentLocation, isServiceChargeActive]);

    const orderType = activeOrder?.orderType;

  const onClearCart = () => {
    if (activeOrder?.originalInvoiceNumber) { // If it's a held order, just reset the state
        setActiveOrder(null);
        setActiveTable(null);
    } else { // If it's a new order, remove it completely
        setActiveOrder(null);
        setActiveTable(null);
    }
    fetchData(); // Refresh data
  };

  const onHoldAndKitchen = async () => {
    if (!activeOrder || !currentSteward || !company_id || !currentLocation || !activeTable) return;
    if (activeOrder.cart.length === 0) {
      toast({ variant: 'default', title: 'Cannot Process Empty Order', description: 'Add items to the cart first.' });
      return;
    }
    const totalDiscount = orderTotals.discount + orderTotals.itemDiscounts;
    // UPDATE LOGIC (PUT)
    if (activeOrder.originalInvoiceNumber) {
        const itemsToUpdatePayload = activeOrder.cart
            .map(item => {
                const isNewItem = !item.originalItemId;
                const originalQty = item.originalQuantity || 0;
                const newQty = item.quantity;
                const qtyToAdd = newQty - originalQty;

                if (isNewItem || qtyToAdd > 0) {
                    return {
                        user_id: parseInt(activeOrder.steward?.id || currentSteward.id, 10), product_id: parseInt(item.product.id, 10), item_price: item.product.price,
                        item_discount: item.itemDiscount || 0, quantity: isNewItem ? newQty : qtyToAdd, customer_id: parseInt(activeOrder.customer.customer_id, 10),
                        table_id: parseInt(activeTable.id, 10), cost_price: item.product.costPrice || 0, product_variant_id: parseInt(item.product.variant.id, 10), printed_status: 0,
                    };
                }
                return null;
            }).filter((item): item is NonNullable<typeof item> => item !== null);
        const updatePayload = {
            grand_total: orderTotals.total, discount_amount: totalDiscount, service_charge: orderTotals.serviceCharge,
            remark: `${activeOrder.orderType} order (updated)`, table_id: parseInt(activeTable.id, 10), order_ready_status: 1, items: itemsToUpdatePayload,
        };
        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/pos-invoices/update-with-items/?company_id=${company_id}&invoice_number=${activeOrder.originalInvoiceNumber}`;
        try {
            const response = await fetcher(url, { method: 'PUT', body: JSON.stringify(updatePayload) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to update held invoice.');
            toast({ title: 'Order Updated!', description: `Held order ${activeOrder.originalInvoiceNumber} has been updated.` });
            if(itemsToUpdatePayload.length > 0) openCenteredPopup(`/pos/kot/${activeOrder.originalInvoiceNumber}?company_id=${company_id}`, 'KOT', 400, 600);
            onClearCart();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            toast({ variant: 'destructive', title: 'Error Updating Order', description: errorMessage });
        }
        return;
    }
    // CREATE LOGIC (POST)
    const payload = {
        invoice_date: format(new Date(), 'yyyy-MM-dd'), inv_amount: orderTotals.subtotal, grand_total: orderTotals.total, discount_amount: totalDiscount,
        discount_percentage: orderTotals.subtotal > 0 ? (totalDiscount / orderTotals.subtotal) * 100 : 0, customer_code: activeOrder.customer.customer_id,
        service_charge: orderTotals.serviceCharge, tendered_amount: 0, close_type: 'N/A', invoice_status: '2', payment_status: 'Pending',
        current_time: format(new Date(), 'yyyy-MM-dd HH:mm:ss'), location_id: parseInt(currentLocation.location_id, 10),
        table_id: parseInt(activeTable.id, 10), order_ready_status: 1, created_by: currentSteward.user_name, is_active: 1,
        steward_id: activeOrder.steward?.id || "N/A", cost_value: activeOrder.cart.reduce((acc, item) => acc + ((item.product.cost_price as number || 0) * item.quantity), 0),
        remark: `${activeOrder.orderType} order`, ref_hold: "direct", company_id: String(company_id), chanel: "POS",
        items: activeOrder.cart.map(item => ({
            user_id: parseInt(activeOrder.steward?.id || currentSteward.id, 10), product_id: parseInt(item.product.id, 10), item_price: item.product.price,
            item_discount: item.itemDiscount || 0, quantity: item.quantity, customer_id: parseInt(activeOrder.customer.customer_id, 10),
            table_id: parseInt(activeTable.id, 10), cost_price: item.product.costPrice || 0, is_active: 1, hold_status: 0, printed_status: 0, product_variant_id: parseInt(item.product.variant.id, 10),
        })),
        vat_amount: orderTotals.vat, sscl_tax: orderTotals.sscl, tdl: orderTotals.tdl,
    };
    try {
      const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pos-invoices`, { method: 'POST', body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to send to kitchen.');
      toast({ title: 'KOT Sent!', description: 'Order sent to the kitchen.' });
      openCenteredPopup(`/pos/kot/${result.invoice_number}?company_id=${company_id}`, 'KOT', 400, 600);
      onClearCart();
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
       toast({ variant: 'destructive', title: 'Error Sending KOT', description: errorMessage });
    }
  };

  const updateQuantity = (variantId: string, batchCode: string, newQuantity: number) => {
    if (!activeOrder) return;
    setActiveOrder(prev => {
      if (!prev) return null;
      const newCart = newQuantity <= 0 
          ? prev.cart.filter(item => !(item.product.variant.id === variantId && item.batch.patch_code === batchCode))
          : prev.cart.map(item => item.product.variant.id === variantId && item.batch.patch_code === batchCode ? { ...item, quantity: newQuantity } : item);
      return { ...prev, cart: newCart };
    });
  };

  const removeFromCart = (uniqueId?: string) => {
    if (!activeOrder || !uniqueId) return;
    setActiveOrder(prev => prev ? { ...prev, cart: prev.cart.filter(item => item.uniqueId !== uniqueId) } : null);
  };
  
  const setDiscount = (newDiscount: number) => {
     if (!activeOrder) return;
     setActiveOrder(prev => prev ? { ...prev, discount: newDiscount } : null);
  };

  const onUpdateDetails = (orderId: string, newDetails: Partial<Pick<ActiveOrder, 'orderType' | 'tableName' | 'steward'>>) => {
     if (!activeOrder) return;
     setActiveOrder(prev => {
         if (!prev || prev.id !== orderId) return prev;
         const updatedOrder = { ...prev, ...newDetails };
         if (newDetails.tableName) updatedOrder.name = newDetails.tableName;
         else if (newDetails.orderType) updatedOrder.name = newDetails.orderType;
         return updatedOrder;
     });
  };

   const updateCustomer = (orderId: string, customer: User) => {
    setActiveOrder(prev => prev ? { ...prev, customer } : null);
  };
  
  const onCustomerCreated = (newCustomer: User) => {
    setCustomers(prev => [...prev, newCustomer]);
    if(activeOrder) {
        updateCustomer(activeOrder.id, newCustomer);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!currentLocation) return <div className="text-center text-muted-foreground p-8">Please select a location to view the steward dashboard.</div>;

  const orderPanelComponent = activeOrder && currentSteward ? (
     <OrderPanel
        key={activeOrder.id} order={activeOrder} orderTotals={orderTotals}
        cashierName={currentSteward.user_name || 'Steward'} currentLocation={currentLocation}
        paymentMethods={paymentMethods}
        onUpdateQuantity={updateQuantity} onRemoveItem={removeFromCart} onClearCart={onClearCart}
        onHoldAndKitchen={onHoldAndKitchen}
        setDiscount={setDiscount} 
        isServiceChargeActive={isServiceChargeActive}
        setIsServiceChargeActive={setIsServiceChargeActive}
        onUpdateDetails={onUpdateDetails}
        availableTables={tables} availableStewards={stewards}
        customers={customers} onUpdateCustomer={updateCustomer}
        onCustomerCreated={onCustomerCreated}
     />
  ) : null;
  
  if (activeOrder) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full overflow-hidden">
            <div className="lg:col-span-2 h-full overflow-y-auto">
                 <ProductGrid products={posProducts} onProductSelect={(p) => setSelectedProduct(p)} orderType={activeOrder.orderType} currentLocation={currentLocation} />
            </div>
            <div className="h-full overflow-y-auto bg-card border-l">
                {orderPanelComponent}
            </div>
            <AddToCartDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} />
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Steward Dashboard</h1>
        <p className="text-muted-foreground">Manage tables for {currentLocation.location_name}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {tables.map(table => {
          const inUse = heldOrders.some(order => order.table_id === table.id);
          const order = heldOrders.find(o => o.table_id === table.id);
          return (
             <Card 
                key={table.id} 
                className={cn("p-4 transition-all flex flex-col justify-between h-40 cursor-pointer", inUse ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/20" : "hover:border-primary hover:bg-muted")}
                onClick={() => handleTableClick(table)}
             >
                <CardHeader className="p-0 flex-row justify-between items-start">
                  <CardTitle className="text-lg">{table.table_name}</CardTitle>
                   <Badge variant={inUse ? 'destructive' : 'default'} className={cn(inUse ? '' : 'bg-green-600')}>
                      {inUse ? 'Seated' : 'Available'}
                   </Badge>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col justify-center items-center text-center">
                    {inUse ? (
                        <div className="text-center">
                            <p className="font-bold text-2xl">{order?.grand_total ? `${currencySymbol}${parseFloat(order.grand_total).toFixed(2)}` : ''}</p>
                            <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                <Users className="h-4 w-4" />
                                <span className="text-sm">
                                  {customers.find(c => c.customer_id === order?.customer_code)?.first_name || 'Walk-in'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <Utensils className="h-10 w-10 text-muted-foreground" />
                    )}
                </CardContent>
            </Card>
          );
        })}
      </div>
       <div className="fixed bottom-8 right-8">
            <Button size="lg" className="h-16 w-16 rounded-full shadow-lg" onClick={() => setActiveOrder({ id: `order-${Date.now()}`, name: 'Take Away', cart: [], discount: 0, serviceCharge: 0, customer: customers[0], orderType: 'Take Away' })}>
                <Plus className="h-8 w-8" />
                <span className="sr-only">New Take Away Order</span>
            </Button>
       </div>
    </div>
  );
}

    

    