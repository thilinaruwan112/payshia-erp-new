
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { Product, User, ProductVariant, Collection, Brand, Table as TableType, Location, ActiveOrder, CartItem, StockInfo, Invoice, TransactionReturn, InvoiceItem } from '@/lib/types';
import { ProductGrid } from '@/components/pos/product-grid';
import { OrderPanel } from '@/components/pos/order-panel';
import { PosHeader } from '@/components/pos/pos-header';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ChefHat, Plus, NotebookPen, Loader2, Receipt, Undo2, Banknote, Maximize, Menu, LineChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { AddToCartDialog } from '@/components/pos/add-to-cart-dialog';
import { useLocation } from '@/components/location-provider';
import { format } from 'date-fns';
import { LocationSelectionDialog } from '@/components/pos/dialogs/location-selection-dialog';
import { NewOrderDialog } from '@/components/pos/dialogs/new-order-dialog';
import { HeldOrderDetailsDialog } from '@/components/pos/dialogs/held-order-details-dialog';
import { PendingInvoicesDialog } from '@/components/pos/dialogs/pending-invoices-dialog';
import { ReturnDialog, type ReturnItem } from '@/components/pos/dialogs/return-dialog';
import { RefundDialog } from '@/components/pos/dialogs/refund-dialog';
import { TodaySalesDialog } from '@/components/pos/dialogs/today-sales-dialog';
import { useCurrency } from '@/components/currency-provider';
import { fetcher } from '@/lib/api';

export type PosProduct = Product & {
  variant: ProductVariant;
  variantName: string;
  imageUrl?: string;
};

export type OrderInfo = {
  subtotal: number;
  serviceCharge: number;
  discount: number; // Order-level discount
  itemDiscounts: number; // Sum of all item-level discounts
  total: number;
};

interface ProductWithVariantsResponse {
    product: Product;
    variants: { variant: ProductVariant; images: any[] }[]; // Adjusted to new structure
    product_images: any[];
}

interface CollectionProductLink {
    product_id: string;
}

const walkInCustomer: User = {
    id: 'walk-in',
    customer_id: 'walk-in',
    name: 'Walk-in Customer',
    customer_first_name: 'Walk-in',
    customer_last_name: 'Customer',
    role: 'Customer',
    loyaltyPoints: 0,
};

export default function POSPage() {
  const { toast } = useToast();
  const [posProducts, setPosProducts] = useState<PosProduct[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [customers, setCustomers] = useState<User[]>([walkInCustomer]);
  const [tables, setTables] = useState<TableType[]>([]);
  const [stewards, setStewards] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<{type: 'category' | 'collection' | 'brand', value: string}>({type: 'category', value: 'All'});
  
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isNewOrderDialogOpen, setNewOrderDialogOpen] = useState(false);
  const [isHeldOrderDetailsDialogOpen, setHeldOrderDetailsDialogOpen] = useState(false);
  const [isPendingInvoicesDialogOpen, setPendingInvoicesDialogOpen] = useState(false);
  const [isTodaySalesDialogOpen, setTodaySalesDialogOpen] = useState(false);
  
  const [collectionProducts, setCollectionProducts] = useState<Record<string, string[]>>({});
  const [selectedProduct, setSelectedProduct] = useState<PosProduct | null>(null);
  

  const [currentCashier, setCurrentCashier] = useState<User | null>(null);
  const { currentLocation, isLoading: isLocationLoading, setCurrentLocation, availableLocations, company_id } = useLocation();
  const { currencySymbol } = useCurrency();
  
  // State for Return Dialog
  const [returnType, setReturnType] = useState<'invoice' | 'manual'>('invoice');
  const [selectedReturnCustomer, setSelectedReturnCustomer] = useState<string | null>(null);
  const [pastInvoices, setPastInvoices] = useState<Invoice[]>([]);
  const [isLoadingPastInvoices, setIsLoadingPastInvoices] = useState(false);
  const [selectedInvoiceForReturn, setSelectedInvoiceForReturn] = useState<Invoice | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [isReturnDialogOpen, setReturnDialogOpen] = useState(false);
  const [isRefundDialogOpen, setRefundDialogOpen] = useState(false);

  // Barcode scanning state
  const [barcode, setBarcode] = useState('');

  const handleBarcodeScan = useCallback((scannedCode: string) => {
    const product = posProducts.find(p => p.variant.sku === scannedCode);
    if (product) {
        toast({ title: "Product Found!", description: `Opening details for ${product.variantName}` });
        setSelectedProduct(product);
    } else {
        toast({ variant: 'destructive', title: "Not Found", description: `No product found with barcode: ${scannedCode}`});
    }
  }, [posProducts, toast]);


  useEffect(() => {
    let barcodeTimeout: NodeJS.Timeout;

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            if (barcode.length > 2) { // Minimum length for a barcode
                handleBarcodeScan(barcode);
            }
            setBarcode(''); // Reset after enter
            return;
        }

        // Ignore control keys, function keys, etc.
        if (event.key && event.key.length === 1) {
            setBarcode(prev => prev + event.key);
        }
        
        // Clear the buffer after a short delay to prevent accidental concatenation
        clearTimeout(barcodeTimeout);
        barcodeTimeout = setTimeout(() => setBarcode(''), 200);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        clearTimeout(barcodeTimeout);
    };
  }, [barcode, handleBarcodeScan]);


  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    if (userId && userName) {
      setCurrentCashier({
        id: userId,
        customer_id: userId,
        name: userName,
        role: 'Cashier',
        avatar: `https://placehold.co/100x100.png?text=${userName.charAt(0)}`,
      });
    }
  }, []);

  useEffect(() => {
    async function fetchPosData() {
        if (!company_id || !currentLocation) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [productsResponse, collectionsResponse, brandsResponse, customersResponse, tablesResponse, stewardsResponse] = await Promise.all([
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${company_id}`),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/collections/company?company_id=${company_id}`),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/company?company_id=${company_id}`),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/company/filter/?company_id=${company_id}`),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/master-tables/filter/by-company?company_id=${company_id}`),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/filter/users?user_status=3&company_id=${company_id}`)
            ]);

            if (!productsResponse.ok || !collectionsResponse.ok || !brandsResponse.ok || !customersResponse.ok) {
                throw new Error('Failed to fetch POS data');
            }
            const productsData: { products: ProductWithVariantsResponse[] } = await productsResponse.json();
            const collectionsData: Collection[] = await collectionsResponse.json();
            const brandsData: Brand[] = await brandsResponse.json();
            const customersData: User[] = await customersResponse.json();
            const tablesData: TableType[] = await tablesResponse.json();
            const stewardsResult = await stewardsResponse.json();
            const stewardsData = stewardsResult.data || [];
            
            setTables(tablesData || []);
             setStewards((stewardsData || []).map((s: any) => ({ 
                id: s.id, 
                name: `${s.first_name} ${s.last_name}`, 
                role: s.acc_type, 
                avatar: s.img_path, 
                customer_id: s.id,
                customer_first_name: s.first_name,
                customer_last_name: s.last_name,
             })));
            
            const formattedCustomers = (customersData || []).map(c => ({
                ...c,
                id: c.customer_id,
                name: `${c.customer_first_name} ${c.customer_last_name}`,
                role: 'Customer',
            }));
            setCustomers([walkInCustomer, ...formattedCustomers]);

            setCollections(collectionsData || []);
            setBrands(brandsData || []);
            
            const locationFilteredProducts = (productsData.products || []).filter(p => 
                p.product.available_locations?.split(',').includes(currentLocation.location_id)
            );
            
            const flattenedProducts = locationFilteredProducts.flatMap(p => {
                const mainProductFrontImage = p.product_images.find(img => img.image_type === 'front img')?.img_url || p.product.product_image_url;

                if (!p.variants || p.variants.length === 0) {
                    return [{
                        ...p.product,
                        imageUrl: mainProductFrontImage ? `${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${mainProductFrontImage}` : undefined,
                        price: parseFloat(p.product.price as any) || 0,
                        min_price: parseFloat(p.product.min_price as any) || 0,
                        wholesale_price: parseFloat(p.product.wholesale_price as any) || 0,
                        cost_price: parseFloat(p.product.cost_price as any) || 0,
                        variant: { id: p.product.id, sku: `SKU-${p.product.id}` }, // Simplified variant
                        variantName: p.product.name,
                    }];
                }

                return p.variants.map(v => {
                    const variantFrontImage = v.images.find(img => img.image_type === 'front img')?.img_url;
                    const finalImageUrl = variantFrontImage || mainProductFrontImage;

                    const variantAttributes = [v.variant.color, v.variant.size].filter(Boolean).join(' - ');
                    const variantName = variantAttributes ? `${p.product.name} - ${variantAttributes}` : `${p.product.name} (${v.variant.sku})`;

                    return {
                        ...p.product,
                        imageUrl: finalImageUrl ? `${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${finalImageUrl}` : undefined,
                        price: parseFloat(v.variant.price as any) || 0,
                        min_price: parseFloat(v.variant.min_price as any) || 0,
                        wholesale_price: parseFloat(v.variant.wholesale_price as any) || 0,
                        cost_price: parseFloat(v.variant.cost_price as any) || 0,
                        variant: v.variant,
                        variantName,
                    };
                });
            });
            setPosProducts(flattenedProducts);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch data from the server.' });
        } finally {
            setIsLoading(false);
        }
    }
    
    if (currentLocation) {
        fetchPosData();
    }
  }, [toast, currentLocation, company_id]);

  useEffect(() => {
    async function fetchInvoicesForReturn() {
      if (!selectedReturnCustomer || !company_id) {
        setPastInvoices([]);
        return;
      }
      setIsLoadingPastInvoices(true);
      try {
        const response = await fetcher(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/full/invoices/by-customer?customer_code=${selectedReturnCustomer}&company_id=${company_id}`
        );
        if (!response.ok) throw new Error("Failed to fetch invoices");
        const data: Invoice[] = await response.json();
        setPastInvoices(data.filter((inv) => inv.payment_status === "paid") || []);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch invoices for this customer.",
        });
        setPastInvoices([]);
      } finally {
        setIsLoadingPastInvoices(false);
      }
    }
    if (isReturnDialogOpen && returnType === "invoice") {
      fetchInvoicesForReturn();
    }
  }, [selectedReturnCustomer, toast, isReturnDialogOpen, returnType, company_id]);
  
  const handleInvoiceSelect = (invoice: Invoice) => {
    if (!invoice?.items) return;
    setSelectedInvoiceForReturn(invoice);
    const items = (invoice.items || []).map(item => {
        const matchingPosProduct = posProducts.find(p => p.variant.id === item.product_variant_id);
        return {
            id: item.product_variant_id || item.product_id.toString(),
            name: matchingPosProduct?.variantName || 'Unknown Product',
            unit: 'Nos',
            rate: parseFloat(item.item_price as string),
            quantity: 0,
            originalQuantity: parseFloat(item.quantity as string),
            amount: 0,
            reason: '',
            productId: item.product_id.toString(),
            productVariantId: item.product_variant_id || item.product_id.toString(),
        }
    });
    setReturnItems(items);
  };
  
  const handleProcessReturn = async () => {
    if (returnItems.length === 0 || !selectedReturnCustomer || !currentLocation || !company_id || !currentCashier) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select items and a customer.' });
      return;
    }
    setIsSubmittingReturn(true);
    const payload: Partial<TransactionReturn> = {
      customer_id: selectedReturnCustomer,
      location_id: currentLocation.location_id,
      company_id: String(company_id),
      return_amount: returnItems.reduce((acc, item) => acc + item.amount, 0).toString(),
      reason: returnReason,
      created_by: currentCashier?.name || 'Admin',
      created_at: new Date().toISOString(),
      updated_by: currentCashier?.name || 'Admin',
      is_active: '1',
      ref_invoice: selectedInvoiceForReturn?.invoice_number || null,
      stock_entries: returnItems.filter(item => item.quantity > 0).map(item => ({
        type: 'IN',
        product_id: parseInt(item.productId),
        product_variant_id: parseInt(item.productVariantId),
        quantity: item.quantity.toString(),
        patch_code: 'RETURN', // This might need to be dynamic
        expire_date: '0000-00-00',
        manufacture_date: format(new Date(), 'yyyy-MM-dd'),
        reference: 'Customer Return',
        transaction_type: 'customer_return',
        location_id: currentLocation.location_id,
        ref_id: selectedInvoiceForReturn?.invoice_number || 'N/A',
      })),
    };
    
    try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/transaction-returns`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to process return.');
        }
        toast({ title: 'Return Processed', description: 'The return has been successfully logged.' });
        setReturnDialogOpen(false);
        // Reset state
        setReturnType('invoice');
        setSelectedReturnCustomer(null);
        setReturnItems([]);
        setReturnReason('');
        setSelectedInvoiceForReturn(null);

    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({ variant: 'destructive', title: 'Return Failed', description: errorMessage });
    } finally {
        setIsSubmittingReturn(false);
    }
  };


  const handleFilterChange = async (type: 'category' | 'collection' | 'brand', value: string) => {
    setActiveFilter({ type, value });
    if (type === 'collection' && value !== 'All' && !collectionProducts[value]) {
        try {
            const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/collection-products?collection_id=${value}&company_id=${company_id}`);
            if (!response.ok) throw new Error('Failed to fetch collection products');
            const data: CollectionProductLink[] = await response.json();
            setCollectionProducts(prev => ({ ...prev, [value]: data.map(p => p.product_id) }));
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load products for this collection.' });
        }
    }
  }

  const currentOrder = useMemo(() => activeOrders.find((order) => order.id === currentOrderId), [activeOrders, currentOrderId]);
  
  const createNewOrder = (orderType: ActiveOrder['orderType'], steward?: User, tableName?: string) => {
    if (customers.length === 0) {
        toast({
            variant: 'destructive',
            title: 'No Customer Available',
            description: 'Please add a customer before creating an order. The "Walk-in" customer should be available by default.',
        });
        return;
    }
    const newOrder: ActiveOrder = {
      id: `order-${Date.now()}`,
      name: tableName || orderType,
      cart: [],
      discount: 0,
      serviceCharge: 0,
      customer: walkInCustomer, // Default to Walk-in Customer
      orderType,
      tableName,
      steward,
    };
    setActiveOrders((prev) => [...prev, newOrder]);
    setCurrentOrderId(newOrder.id);
    setNewOrderDialogOpen(false);
  };
  
 const handleHoldAndKitchen = async () => {
    if (!currentOrder || !currentCashier || !company_id || !currentLocation) return;
    if (currentOrder.cart.length === 0) {
      toast({
        variant: 'default',
        title: 'Cannot Process Empty Order',
        description: 'Add items to the cart first.',
      });
      return;
    }

    const totalDiscount = orderTotals.discount + orderTotals.itemDiscounts;
  
    // UPDATE LOGIC (PUT)
    if (currentOrder.originalInvoiceNumber) {
        const itemsToUpdatePayload = currentOrder.cart
            .map(item => {
                const newItemQty = item.quantity;
                const originalQty = item.originalQuantity || 0;
                const qtyToAdd = newItemQty - originalQty;
                
                if (qtyToAdd > 0) {
                    return {
                        user_id: parseInt(currentOrder.steward?.id || currentCashier.id, 10),
                        product_id: parseInt(item.product.id, 10),
                        item_price: item.product.price,
                        item_discount: item.itemDiscount || 0,
                        quantity: qtyToAdd,
                        customer_id: parseInt(currentOrder.customer.customer_id, 10),
                        table_id: tables.find(t => t.table_name === currentOrder.tableName)?.id ? parseInt(tables.find(t => t.table_name === currentOrder.tableName)!.id, 10) : 0,
                        cost_price: item.product.costPrice || 0,
                        product_variant_id: parseInt(item.product.variant.id, 10),
                    };
                }
                return null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

        const updatePayload = {
            grand_total: orderTotals.total,
            discount_amount: totalDiscount,
            service_charge: orderTotals.serviceCharge,
            remark: `${currentOrder.orderType} order (updated)`,
            table_id: tables.find(t => t.table_name === currentOrder.tableName)?.id ? parseInt(tables.find(t => t.table_name === currentOrder.tableName)!.id, 10) : 0,
            order_ready_status: 1,
            items: itemsToUpdatePayload,
        };
      
        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/pos-invoices/update-with-items/?company_id=${company_id}&invoice_number=${currentOrder.originalInvoiceNumber}`;
  
        try {
            const response = await fetcher(url, {
            method: 'PUT',
            body: JSON.stringify(updatePayload),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to update held invoice.');
    
            toast({ title: 'Order Updated!', description: `Held order ${currentOrder.originalInvoiceNumber} has been updated.` });
            if(itemsToUpdatePayload.length > 0) {
                window.open(`/pos/kot/${currentOrder.originalInvoiceNumber}?company_id=${company_id}`, '_blank');
            }
            onClearCart(currentOrderId!);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            toast({ variant: 'destructive', title: 'Error Updating Order', description: errorMessage });
        }
        return;
    }
  
    // CREATE LOGIC (POST)
    const payload = {
        invoice_date: format(new Date(), 'yyyy-MM-dd'),
        inv_amount: orderTotals.subtotal, 
        grand_total: orderTotals.total, 
        discount_amount: totalDiscount,
        discount_percentage: orderTotals.subtotal > 0 ? (totalDiscount / orderTotals.subtotal) * 100 : 0,
        customer_code: currentOrder.customer.customer_id, 
        service_charge: orderTotals.serviceCharge,
        tendered_amount: 0, 
        close_type: 'N/A', 
        invoice_status: '2', // Status for held order
        current_time: format(new Date(), 'yyyy-MM-dd HH:mm:ss'), 
        location_id: parseInt(currentLocation.location_id, 10), 
        table_id: tables.find(t => t.table_name === currentOrder.tableName)?.id ? parseInt(tables.find(t => t.table_name === currentOrder.tableName)!.id, 10) : 0, 
        order_ready_status: 1, 
        created_by: currentCashier.name, 
        is_active: 1, 
        steward_id: "N/A",
        cost_value: currentOrder.cart.reduce((acc, item) => acc + ((item.product.costPrice as number || 0) * item.quantity), 0),
        remark: `${currentOrder.orderType} order`, 
        ref_hold: "direct",
        company_id: String(company_id),
        chanel: "POS",
        items: currentOrder.cart.map(item => ({
            user_id: parseInt(steward?.id || currentCashier.id, 10),
            product_id: parseInt(item.product.id, 10), 
            item_price: item.product.price,
            item_discount: item.itemDiscount || 0, 
            quantity: item.quantity, 
            customer_id: parseInt(currentOrder.customer.customer_id, 10),
            table_id: tables.find(t => t.table_name === currentOrder.tableName)?.id ? parseInt(tables.find(t => t.table_name === currentOrder.tableName)!.id, 10) : 0,
            cost_price: item.product.costPrice || 0,
            is_active: 1,
            hold_status: 0,
            printed_status: 0,
            product_variant_id: parseInt(item.product.variant.id, 10),
        })),
    };

    try {
      const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pos-invoices`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to send to kitchen.');
      
      toast({ title: 'KOT Sent!', description: 'Order sent to the kitchen.', icon: <ChefHat className="h-6 w-6 text-green-500" /> });
      
      window.open(`/pos/kot/${result.invoice_number}?company_id=${company_id}`, '_blank');
      
      onClearCart(currentOrderId!);
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
       toast({ variant: 'destructive', title: 'Error Sending KOT', description: errorMessage });
    }
  };

  const addToCart = async (product: PosProduct, quantity: number, discount: number, batch: StockInfo, imageUrl?: string) => {
    if (!currentOrderId) {
      toast({
        title: 'No Active Order',
        description: 'Please create a new order before adding items.',
        variant: 'destructive',
      });
      setSelectedProduct(null);
      return;
    }
    
    setActiveOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id !== currentOrderId) return order;
        
        const existingItemIndex = order.cart.findIndex(item => item.product.variant.id === product.variant.id && item.batch.patch_code === batch.patch_code);
        let newCart;
        
        if (existingItemIndex > -1) {
            newCart = [...order.cart];
            newCart[existingItemIndex] = {
                ...newCart[existingItemIndex],
                quantity: newCart[existingItemIndex].quantity + quantity,
                itemDiscount: (newCart[existingItemIndex].itemDiscount || 0) + discount,
            };
        } else {
            const newCartItem: CartItem = { 
                uniqueId: `${product.variant.id}-${batch.patch_code}-${Date.now()}`, 
                product: {...product, imageUrl }, 
                quantity, 
                itemDiscount: discount, 
                batch 
            };
            newCart = [...order.cart, newCartItem];
        }
        return { ...order, cart: newCart };
      })
    );
    setSelectedProduct(null);
  };
  
  const handleLoadOrder = async (invoice: Invoice) => {
    if (!invoice.items) return;
    
    // Helper function to find PosProduct
    const findPosProduct = (variantId: string | undefined): PosProduct | undefined => {
        if (!variantId) return undefined;
        return posProducts.find(p => p.variant.id === variantId);
    }
    
    const cartItemsPromises = invoice.items.map(async (item): Promise<CartItem | null> => {
        const product = findPosProduct(item.product_variant_id);
        if (!product) return null;

        if (!currentLocation || !company_id) return null;
        // The batch for a previously held item is not directly available, so we create a placeholder.
        // The key is to know this item came from a held order to track quantity changes.
        const placeholderBatch: StockInfo = {
            product_id: item.product_id.toString(),
            product_variant_id: item.product_variant_id || item.product_id.toString(),
            patch_code: 'HELD', // Use a placeholder batch code
            expire_date: 'N/A',
            total_in: '0',
            total_out: '0',
            stock_balance: '9999', // Assume enough stock to load, validation is on adding more
        };
        
        return {
            uniqueId: `${product.variant.id}-HELD-${item.id}`,
            product: product,
            quantity: parseFloat(String(item.quantity)),
            itemDiscount: parseFloat(String(item.item_discount)),
            batch: placeholderBatch,
            originalItemId: item.id,
            originalQuantity: parseFloat(String(item.quantity)),
        };
    });

    const loadedCartItems = (await Promise.all(cartItemsPromises)).filter((item): item is CartItem => item !== null);
    
    const customer = customers.find(c => c.customer_id === invoice.customer_code);
    if (!customer) {
        toast({variant: 'destructive', title: 'Customer not found', description: 'The customer for this held order could not be found.'});
        return;
    }

    const newActiveOrder: ActiveOrder = {
      id: `order-${Date.now()}`,
      name: `Loaded ${invoice.invoice_number}`,
      cart: loadedCartItems,
      discount: parseFloat(invoice.discount_amount) - loadedCartItems.reduce((acc, item) => acc + (item.itemDiscount || 0), 0),
      serviceCharge: parseFloat(invoice.service_charge),
      customer: customer,
      orderType: (invoice.remark?.split(' ')[0] as any) || 'Retail', // Infer type from remark
      originalInvoiceNumber: invoice.invoice_number,
    };
    
    setActiveOrders(prev => [...prev, newActiveOrder]);
    setCurrentOrderId(newActiveOrder.id);
    setHeldOrderDetailsDialogOpen(false);
  };

  const updateQuantity = (variantId: string, batchCode: string, newQuantity: number) => {
    if (!currentOrderId) return;
    setActiveOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id !== currentOrderId) return order;
        let newCart;
        if (newQuantity <= 0) {
          newCart = order.cart.filter((item) => !(item.product.variant.id === variantId && item.batch.patch_code === batchCode));
        } else {
          newCart = order.cart.map((item) =>
            item.product.variant.id === variantId && item.batch.patch_code === batchCode ? { ...item, quantity: newQuantity } : item
          );
        }
        return { ...order, cart: newCart };
      })
    );
  };

  const removeFromCart = (uniqueId?: string) => {
     if (!currentOrderId || !uniqueId) return;
     setActiveOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id !== currentOrderId) return order;
        const newCart = order.cart.filter((item) => item.uniqueId !== uniqueId);
        return {...order, cart: newCart };
      })
    );
  };

  const onClearCart = (orderId: string) => {
    if (orderId === currentOrderId) setCurrentOrderId(null);
    setActiveOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const setDiscount = (newDiscount: number) => {
    if (!currentOrderId) return;
     setActiveOrders((prevOrders) => prevOrders.map((order) => order.id === currentOrderId ? { ...order, discount: newDiscount } : order));
  }

  const setServiceCharge = (newServiceCharge: number) => {
    if (!currentOrderId) return;
    setActiveOrders((prevOrders) => prevOrders.map((order) => order.id === currentOrderId ? { ...order, serviceCharge: newServiceCharge } : order));
  };
  
  const onUpdateDetails = (orderId: string, newDetails: Partial<Pick<ActiveOrder, 'orderType' | 'tableName' | 'steward'>>) => {
      setActiveOrders(prevOrders => prevOrders.map(order => {
          if (order.id === orderId) {
              const updatedOrder = { ...order, ...newDetails };
              if (newDetails.tableName) updatedOrder.name = newDetails.tableName;
              else if (newDetails.orderType) updatedOrder.name = newDetails.orderType;
              return updatedOrder;
          }
          return order;
      }));
  };
  
  const updateCustomer = (orderId: string, customer: User) => {
    setActiveOrders(prevOrders => prevOrders.map(order => order.id === orderId ? { ...order, customer } : order));
  };

  const filteredProducts = useMemo(() => {
    let productsToFilter = posProducts;
    if (activeFilter.type === 'brand' && activeFilter.value !== 'All') productsToFilter = posProducts.filter(p => p.brand_id === activeFilter.value);
    else if (activeFilter.type === 'collection') {
        const productIdsInCollection = collectionProducts[activeFilter.value];
        if (productIdsInCollection) productsToFilter = posProducts.filter(p => productIdsInCollection.includes(p.id));
        else if (activeFilter.value !== 'All') return [];
    } else if (activeFilter.type === 'category' && activeFilter.value !== 'All') productsToFilter = posProducts.filter(p => p.category === activeFilter.value);
    return productsToFilter.filter(product => product.variantName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, activeFilter, posProducts, collectionProducts]);
  
  const totalItems = useMemo(() => currentOrder ? currentOrder.cart.reduce((total, item) => total + item.quantity, 0) : 0, [currentOrder]);
  const orderTotals = useMemo((): OrderInfo => {
     if (!currentOrder) return { subtotal: 0, serviceCharge: 0, discount: 0, itemDiscounts: 0, total: 0 };
     const subtotal = currentOrder.cart.reduce((acc, item) => acc + (item.product.price as number) * item.quantity, 0);
     const itemDiscounts = currentOrder.cart.reduce((acc, item) => acc + (item.itemDiscount || 0), 0);
     const total = subtotal - itemDiscounts + currentOrder.serviceCharge - currentOrder.discount;
     return { subtotal, serviceCharge: currentOrder.serviceCharge, discount: currentOrder.discount, itemDiscounts, total };
  }, [currentOrder]);
  
  const orderPanelComponent = currentOrder && currentCashier ? (
     <OrderPanel
        key={currentOrder.id} order={currentOrder} orderTotals={orderTotals}
        cashierName={currentCashier.name} currentLocation={currentLocation}
        onUpdateQuantity={updateQuantity} onRemoveItem={removeFromCart} onClearCart={onClearCart}
        onHoldAndKitchen={handleHoldAndKitchen}
        isDrawer={isDrawerOpen} onClose={() => setDrawerOpen(false)}
        setDiscount={setDiscount} setServiceCharge={setServiceCharge} onUpdateDetails={onUpdateDetails}
        availableTables={tables} availableStewards={stewards}
        customers={customers} onUpdateCustomer={updateCustomer}
     />
  ) : null;
  
  const categories = ['All', ...new Set(posProducts.map((p) => p.category))];

  if (isLocationLoading) return <div className="flex h-screen w-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  if (!currentLocation) return <LocationSelectionDialog open={!currentLocation} locations={availableLocations.filter(loc => loc.pos_status === '1')} onSelectLocation={(loc) => setCurrentLocation(loc)} />;
  if (!currentCashier) return <div className="flex h-screen w-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-4">Loading cashier details...</p></div>

  return (
    <>
      <AddToCartDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} />
      <NewOrderDialog isOpen={isNewOrderDialogOpen} onOpenChange={setNewOrderDialogOpen} createNewOrder={createNewOrder} activeOrders={activeOrders} />
      <HeldOrderDetailsDialog 
        isOpen={isHeldOrderDetailsDialogOpen} 
        onOpenChange={setHeldOrderDetailsDialogOpen} 
        customers={customers} 
        onLoadOrder={handleLoadOrder} 
      />
      <PendingInvoicesDialog isOpen={isPendingInvoicesDialogOpen} onOpenChange={setPendingInvoicesDialogOpen} customers={customers} />
      <ReturnDialog 
          isOpen={isReturnDialogOpen} 
          onOpenChange={setReturnDialogOpen} 
          customers={customers}
          returnType={returnType}
          setReturnType={setReturnType}
          selectedCustomer={selectedReturnCustomer}
          setSelectedCustomer={setSelectedReturnCustomer}
          pastInvoices={pastInvoices}
          isLoadingPastInvoices={isLoadingPastInvoices}
          handleInvoiceSelect={handleInvoiceSelect}
          returnReason={returnReason}
          setReturnReason={setReturnReason}
          returnItems={returnItems}
          setReturnItems={setReturnItems}
          isSubmittingReturn={isSubmittingReturn}
          handleProcessReturn={handleProcessReturn}
      />
      <RefundDialog isOpen={isRefundDialogOpen} onOpenChange={setRefundDialogOpen} customers={customers} />
      <TodaySalesDialog isOpen={isTodaySalesDialogOpen} onOpenChange={setTodaySalesDialogOpen} />

      <div className="flex h-screen w-screen flex-col">
        <PosHeader
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            cashier={currentCashier}
        />
        <div className="flex-1 flex overflow-hidden relative">
             {!currentOrder && (
                <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center text-center p-8">
                    <div className="bg-background p-8 rounded-lg shadow-2xl">
                        <NotebookPen className="h-16 w-16 text-muted-foreground mx-auto" />
                        <h3 className="mt-4 text-2xl font-semibold">No Active Order</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">Select a held order from the list, or create a new order to begin adding items to the cart.</p>
                        <div className="flex gap-4 mt-6">
                            <Button onClick={() => setHeldOrderDetailsDialogOpen(true)} variant="outline" className="flex-1">
                                <NotebookPen className="mr-2 h-4 w-4" /> View Held Orders
                            </Button>
                            <Button onClick={() => setNewOrderDialogOpen(true)} className="flex-1">
                                <Plus className="mr-2 h-4 w-4" /> Create New Order
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex-1 flex flex-col">
                <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                         <Button variant="outline" size="sm" onClick={() => setTodaySalesDialogOpen(true)}><LineChart className="mr-0 sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">Sales</span></Button>
                         <Button variant="outline" size="sm" onClick={() => setPendingInvoicesDialogOpen(true)}><Receipt className="mr-0 sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">Pending</span></Button>
                        <Button variant="outline" size="sm" onClick={() => setReturnDialogOpen(true)}><Undo2 className="mr-0 sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">Return</span></Button>
                        <Button variant="outline" size="sm" onClick={() => setRefundDialogOpen(true)}><Banknote className="mr-0 sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">Refund</span></Button>
                    </div>
                    <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setHeldOrderDetailsDialogOpen(true)}><NotebookPen className="mr-2 h-4 w-4" />Held Orders</Button>
                    <Button onClick={() => setNewOrderDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> New Order</Button>
                    </div>
                </div>
                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 p-4 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-[calc(100vh-250px)]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                    ) : (
                        <ProductGrid products={filteredProducts} onProductSelect={(p) => setSelectedProduct(p)} />
                    )}
                    </div>
                    
                    <aside className="hidden md:block w-48 border-l border-border overflow-y-auto">
                        <div className="h-full p-2">
                            <h3 className="text-xs font-semibold uppercase text-muted-foreground px-2 mb-2">Categories</h3>
                            <div className="flex flex-col gap-1">
                                {categories.map(cat => <Button key={cat} variant={activeFilter.type === 'category' && activeFilter.value === cat ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handleFilterChange('category', cat)}>{cat}</Button>)}
                            </div>
                            <h3 className="text-xs font-semibold uppercase text-muted-foreground px-2 my-2 pt-2 border-t">Collections</h3>
                            <div className="flex flex-col gap-1">
                                <Button variant={activeFilter.type === 'collection' && activeFilter.value === 'All' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handleFilterChange('collection', 'All')}>All Collections</Button>
                                {collections.map(col => <Button key={col.id} variant={activeFilter.type === 'collection' && activeFilter.value === col.id ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handleFilterChange('collection', col.id)}>{col.title}</Button>)}
                            </div>
                            <h3 className="text-xs font-semibold uppercase text-muted-foreground px-2 my-2 pt-2 border-t">Brands</h3>
                            <div className="flex flex-col gap-1">
                                <Button variant={activeFilter.type === 'brand' && activeFilter.value === 'All' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handleFilterChange('brand', 'All')}>All Brands</Button>
                                {brands.map(brand => <Button key={brand.id} variant={activeFilter.type === 'brand' && activeFilter.value === brand.id ? 'secondary' : 'ghost'} className="justify-start" onClick={() => handleFilterChange('brand', brand.id)}>{brand.name}</Button>)}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
            <aside className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 bg-card border-t lg:border-t-0 lg:border-l border-border flex-col hidden lg:flex">
                {orderPanelComponent}
            </aside>
            <div className="lg:hidden">
                {currentOrder && currentOrder.cart.length > 0 && (
                <div className="fixed bottom-4 left-4 right-4 z-20">
                    <Drawer open={isDrawerOpen} onOpenChange={setDrawerOpen}>
                        <DrawerTrigger asChild>
                            <Button className="w-full h-16 text-lg shadow-lg">
                                <div className="flex items-center justify-between w-full">
                                    <div className='flex items-center gap-2'><ShoppingCart className="mr-2 h-6 w-6" /><span>View {currentOrder.name}</span><Badge variant="secondary" className="text-base">{totalItems}</Badge></div>
                                    <span className='font-bold'>{currencySymbol}{orderTotals.total.toFixed(2)}</span>
                                </div>
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent className='h-[90vh]'><DrawerTitle className="sr-only">Order Details</DrawerTitle>{orderPanelComponent}</DrawerContent>
                    </Drawer>
                </div>
                )}
            </div>
        </div>
      </div>
    </>
  );
}

    

    
