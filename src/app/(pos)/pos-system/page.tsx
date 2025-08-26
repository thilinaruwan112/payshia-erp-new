
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Product, User, ProductVariant, Collection, Brand, Invoice, ActiveOrder, CartItem, Table as TableType, Location, InvoiceItem, TransactionReturn, StockEntry } from '@/lib/types';
import { ProductGrid } from '@/components/pos/product-grid';
import { OrderPanel } from '@/components/pos/order-panel';
import { PosHeader } from '@/components/pos/pos-header';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ChefHat, Plus, NotebookPen, Loader2, Receipt, Undo2, Settings, History, ArrowLeft, FileText, UserPlus, RefreshCcw, Maximize, Menu, MapPin, Beer, Utensils, Pizza, UserCheck, Minus, CheckCircle, Trash2, Info, Banknote, X, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { AddToCartDialog } from '@/components/pos/add-to-cart-dialog';
import { useLocation } from '@/components/location-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

// Import Dialog Components
import { LocationSelectionDialog } from '@/components/pos/dialogs/location-selection-dialog';
import { NewOrderDialog } from '@/components/pos/dialogs/new-order-dialog';
import { HeldOrderDetailsDialog } from '@/components/pos/dialogs/held-order-details-dialog';
import { PendingInvoicesDialog } from '@/components/pos/dialogs/pending-invoices-dialog';
import { ReturnDialog, ReturnItem } from '@/components/pos/dialogs/return-dialog';
import { RefundDialog } from '@/components/pos/dialogs/refund-dialog';


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

export type StockInfo = {
    product_id: string;
    expire_date: string;
    patch_code: string;
    total_in: string;
    total_out: string;
    stock_balance: string;
}

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
  
  const [isHeldOrdersLoading, setIsHeldOrdersLoading] = useState(false);
  const [heldOrders, setHeldOrders] = useState<Invoice[]>([]);
  const [selectedHeldOrderDetails, setSelectedHeldOrderDetails] = useState<Invoice | null>(null);
  const [isHeldOrderDetailsOpen, setIsHeldOrderDetailsOpen] = useState(false);
  const [isHeldOrderDetailsLoading, setIsHeldOrderDetailsLoading] = useState(false);

  const [isPendingInvoicesDialogOpen, setPendingInvoicesDialogOpen] = useState(false);
  const [isReturnDialogOpen, setReturnDialogOpen] = useState(false);
  const [isRefundDialogOpen, setRefundDialogOpen] = useState(false);
  const [isReturnsLoading, setIsReturnsLoading] = useState(false);
  const [transactionReturns, setTransactionReturns] = useState<TransactionReturn[]>([]);
  const [selectedCustomerForAction, setSelectedCustomerForAction] = useState<string | null>(null);
  const [pastInvoices, setPastInvoices] = useState<Invoice[]>([]);
  const [isPastInvoicesLoading, setIsPastInvoicesLoading] = useState(false);
  const [selectedInvoiceForAction, setSelectedInvoiceForAction] = useState<Invoice | null>(null);
  const [selectedReturnForRefund, setSelectedReturnForRefund] = useState<TransactionReturn | null>(null);

  // Return dialog state
  const [returnReason, setReturnReason] = useState("");
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [currentReturnProduct, setCurrentReturnProduct] = useState<PosProduct | null>(null);
  const [currentReturnQty, setCurrentReturnQty] = useState(1);
  const [refundQuantities, setRefundQuantities] = useState<Record<string, number>>({});
  const [returnType, setReturnType] = useState<'invoice' | 'manual'>('invoice');


  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [balanceDetails, setBalanceDetails] = useState<BalanceDetails | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<PosProduct | null>(null);
  const walkInCustomer = { id: 'user-4', name: 'Walk-in Customer', role: 'Customer', avatar: 'https://placehold.co/100x100.png?text=WC', loyaltyPoints: 0, email: 'walkin@payshia.com', phone: 'N/A', address: 'N/A', customer_id: '4' };

  const [currentCashier, setCurrentCashier] = useState<User | null>(null);
  
  const { currentLocation, isLoading: isLocationLoading, setCurrentLocation, availableLocations, company_id } = useLocation();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    if (userId && userName) {
      setCurrentCashier({
        id: userId,
        customer_id: userId,
        name: userName,
        role: 'Cashier', // Assuming a default role
        avatar: `https://placehold.co/100x100.png?text=${userName.charAt(0)}`,
      });
    }
  }, []);
  

  useEffect(() => {
    async function fetchPosData() {
        if (!company_id) {
            setIsLoadingProducts(false);
            return;
        }
        setIsLoadingProducts(true);
        try {
            const [productsResponse, collectionsResponse, brandsResponse, customersResponse] = await Promise.all([
                fetch(`https://server-erp.payshia.com/products/with-variants/by-company?company_id=${company_id}`),
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
            
            const formattedCustomers = customersData.map(c => ({
                ...c,
                id: c.customer_id,
                name: `${c.customer_first_name} ${c.customer_last_name}`,
                role: 'Customer',
            }));
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
    
    if (currentLocation) {
        fetchPosData();
    }
    
  }, [toast, currentLocation, company_id]);
  
  useEffect(() => {
    async function fetchInvoicesForAction() {
      if (!selectedCustomerForAction || !company_id) {
        setPastInvoices([]);
        return;
      }
      setIsPastInvoicesLoading(true);
      try {
        const response = await fetch(`https://server-erp.payshia.com/full/invoices/by-customer?customer_code=${selectedCustomerForAction}&company_id=${company_id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch invoices');
        }
        const data: Invoice[] = await response.json();
        setPastInvoices(data || []);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not fetch invoices for this customer.',
        });
        setPastInvoices([]);
      } finally {
        setIsPastInvoicesLoading(false);
      }
    }
    
    if (isPendingInvoicesDialogOpen || (isReturnDialogOpen && returnType === 'invoice')) {
      fetchInvoicesForAction();
    }
  }, [selectedCustomerForAction, toast, isPendingInvoicesDialogOpen, isReturnDialogOpen, company_id, returnType]);
  
  useEffect(() => {
    async function fetchPosDialogData() {
        if (!company_id) return;
        setIsLoadingTables(true);
        setIsLoadingStewards(true);
        try {
            const [tablesResponse, stewardsResponse] = await Promise.all([
                fetch(`https://server-erp.payshia.com/master-tables/filter/by-company?company_id=${company_id}`),
                fetch(`https://server-erp.payshia.com/filter/users?user_status=3&company_id=${company_id}`)
            ]);
            
            if (!tablesResponse.ok) throw new Error('Failed to fetch tables');
            const tablesData: TableType[] = await tablesResponse.json();
            setTables(tablesData || []);

            if (!stewardsResponse.ok) throw new Error('Failed to fetch stewards');
            const stewardsResult = await stewardsResponse.json();
            const stewardsData = stewardsResult.data || [];
             const formattedStewards = (stewardsData || []).map((s: any) => ({
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
  }, [isNewOrderDialogOpen, toast, company_id]);
  
   useEffect(() => {
    async function fetchReturns() {
      if (!company_id) return;
      setIsReturnsLoading(true);
      try {
        const response = await fetch(`https://server-erp.payshia.com/transaction-returns/filter/by-company?company_id=${company_id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch returns');
        }
        const data: TransactionReturn[] = await response.json();
        setTransactionReturns(data || []);
      } catch (error) {
         toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not fetch recent returns.',
        });
        setTransactionReturns([]);
      } finally {
        setIsReturnsLoading(false);
      }
    }
    if (isRefundDialogOpen && !selectedReturnForRefund) {
        fetchReturns();
    }
  }, [isRefundDialogOpen, selectedReturnForRefund, toast, company_id]);

  const handleInvoiceSelectForAction = async (invoice: Invoice) => {
    if (!company_id) return;
    setSelectedInvoiceForAction(invoice);
    
    if (isReturnDialogOpen && returnType === 'invoice') {
        setIsPastInvoicesLoading(true);
        try {
            const response = await fetch(`https://server-erp.payshia.com/invoices/full/${invoice.invoice_number}`);
            if (!response.ok) throw new Error('Failed to fetch invoice items.');
            const fullInvoiceData: Invoice = await response.json();
            
            const itemsToReturn = (fullInvoiceData.items || []).map((item: InvoiceItem): ReturnItem => {
                const productDetails = posProducts.find(p => p.id === String(item.product_id));
                const variantDetails = productDetails?.variants?.find(v => v.id === String(item.product_variant_id));
                const variantName = [productDetails?.name, variantDetails?.color, variantDetails?.size].filter(Boolean).join(' - ');

                return {
                    id: String(item.product_variant_id),
                    name: item.productName || variantName || `Product ID: ${item.product_id}`,
                    unit: 'Nos',
                    rate: parseFloat(String(item.item_price)),
                    quantity: 0, // Initial return quantity is 0
                    amount: 0,
                    reason: '',
                    productId: String(item.product_id),
                    productVariantId: String(item.product_variant_id),
                }
            });
            setReturnItems(itemsToReturn);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load items for this invoice.' });
            setReturnItems([]);
        } finally {
            setIsPastInvoicesLoading(false);
        }
    }


    if(isPendingInvoicesDialogOpen) {
        setIsBalanceLoading(true);
        try {
            const receiptsResponse = await fetch(`https://server-erp.payshia.com/receipts/invoice/${invoice.invoice_number}`);
            let totalPaid = 0;
            if (receiptsResponse.ok) {
                const receiptsData = await receiptsResponse.json();
                totalPaid = (receiptsData || []).reduce((sum: number, receipt: any) => sum + parseFloat(receipt.amount), 0);
            }

            const grandTotal = parseFloat(invoice.grand_total);
            const balance = grandTotal - totalPaid;

            const balanceDetailPayload = {
                grand_total: invoice.grand_total,
                total_paid_amount: totalPaid.toFixed(2),
                balance: balance,
                company_id: invoice.company_id,
                customer_id: invoice.customer_code,
                ref_id: invoice.invoice_number,
            };
            setBalanceDetails(balanceDetailPayload);
            setPaymentAmount(balance > 0 ? balance.toFixed(2) : '0.00');
        } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not fetch invoice balance details.',
        });
        } finally {
            setIsBalanceLoading(false);
        }
    }
  };
  
  const handleReturnSelectForAction = async (returnData: TransactionReturn) => {
    if (!company_id) return;
    setIsReturnsLoading(true);
    try {
      const response = await fetch(`https://server-erp.payshia.com/transaction-returns/full/${returnData.id}?company_id=${company_id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch return details');
      }
      const data = await response.json();
      setSelectedReturnForRefund(data.data);
      // Initialize refund quantities
      const initialQuantities: Record<string, number> = {};
      (data.data.stock_entries || []).forEach((entry: StockEntry) => {
          initialQuantities[entry.id] = parseFloat(entry.quantity);
      });
      setRefundQuantities(initialQuantities);

    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch return details.' });
    } finally {
        setIsReturnsLoading(false);
    }
  }

  const handleCreateReceipt = async () => {
    if (!selectedInvoiceForAction || !currentLocation || !company_id || !currentCashier) {
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
        ref_id: selectedInvoiceForAction.invoice_number,
        location_id: parseInt(currentLocation.location_id, 10),
        customer_id: parseInt(selectedInvoiceForAction.customer_code, 10),
        today_invoice: selectedInvoiceForAction.invoice_number,
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
            description: `Payment of LKR ${paymentAmount} recorded successfully.`
        });
        setPendingInvoicesDialogOpen(false);
        setSelectedInvoiceForAction(null);
        setPaymentAmount('');
        setSelectedCustomerForAction(null);

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
      customer: walkInCustomer,
      orderType,
      tableName,
      steward,
    };
    setActiveOrders((prev) => [...prev, newOrder]);
    setCurrentOrderId(newOrder.id);
    setNewOrderDialogOpen(false);
  };
  
  const createInvoicePayload = (status: '1' | '2', cashierName: string, paymentMethod = 'N/A', tenderedAmount = 0) => {
    if (!currentOrder || !currentLocation || !company_id) return null;

    const totalDiscount = orderTotals.discount + orderTotals.itemDiscounts;
    const costValue = currentOrder.cart.reduce((acc, item) => acc + ((item.product.costPrice as number) * item.quantity), 0);

    return {
        invoice_date: format(new Date(), 'yyyy-MM-dd'),
        inv_amount: orderTotals.subtotal,
        grand_total: orderTotals.total,
        discount_amount: totalDiscount,
        discount_percentage: orderTotals.subtotal > 0 ? (totalDiscount / orderTotals.subtotal) * 100 : 0,
        customer_code: currentOrder.customer.customer_id,
        service_charge: orderTotals.serviceCharge,
        tendered_amount: tenderedAmount,
        close_type: paymentMethod,
        invoice_status: status,
        payment_status: "Pending",
        current_time: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        location_id: parseInt(currentLocation.location_id, 10),
        table_id: 0,
        order_ready_status: 1,
        created_by: cashierName,
        is_active: 1,
        steward_id: currentOrder.steward?.id || "N/A",
        cost_value: costValue,
        remark: `${currentOrder.orderType} order`,
        ref_hold: status === '1' ? (currentOrder.originalInvoiceNumber || "direct") : null,
        company_id: company_id,
        chanel: "POS",
        items: currentOrder.cart.map(item => ({
            user_id: 1, // Default user_id as per example
            product_id: parseInt(item.product.id, 10),
            item_price: item.product.price,
            item_discount: item.itemDiscount || 0,
            quantity: item.quantity,
            customer_id: parseInt(currentOrder.customer.customer_id, 10),
            table_id: 0,
            cost_price: item.product.costPrice || 0,
            is_active: 1,
            hold_status: 0,
            printed_status: 1,
            product_variant_id: parseInt(item.product.variant.id, 10),
            company_id: company_id,
        })),
    };
  };

  const handleSendToKitchen = async () => {
    if (!currentOrder || !currentCashier || !company_id) return;
    
    const payload = createInvoicePayload('2', currentCashier.name);
    if (!payload) return;
    
    try {
      const response = await fetch('https://server-erp.payshia.com/pos-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to send to kitchen.');
      }
      
      const updatedOrder = { ...currentOrder, originalInvoiceNumber: result.invoice_number };
      setActiveOrders(prev => prev.map(o => o.id === currentOrder.id ? updatedOrder : o));
      
      toast({
        title: 'KOT Sent!',
        description: `Order sent to the kitchen.`,
        icon: <ChefHat className="h-6 w-6 text-green-500" />,
      });
      
      const encodedData = btoa(JSON.stringify(result));
      window.open(`/pos/kot/${company_id}/${result.id}?data=${encodedData}`, '_blank');


      onClearCart(currentOrderId!);
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
       toast({
        variant: 'destructive',
        title: 'Error Sending KOT',
        description: errorMessage,
      });
    }
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

  const addToCart = async (product: PosProduct, quantity: number, discount: number, batch: StockInfo) => {
    if (!currentOrderId) {
      return;
    }
  
    const tempId = `${product.variant.id}-${batch.patch_code}-${Date.now()}`;
    const newCartItem: CartItem = { product, quantity, itemDiscount: discount, batch, tempId };
  
    setActiveOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id !== currentOrderId) return order;
        
        const existingItemIndex = order.cart.findIndex(
            (item) => item.product.variant.id === product.variant.id && item.batch.patch_code === batch.patch_code
        );

        let newCart;
        if (existingItemIndex > -1) {
            newCart = [...order.cart];
            newCart[existingItemIndex] = {
                ...newCart[existingItemIndex],
                quantity: newCart[existingItemIndex].quantity + quantity,
                itemDiscount: (newCart[existingItemIndex].itemDiscount || 0) + discount
            };
        } else {
            newCart = [...order.cart, newCartItem];
        }

        return { ...order, cart: newCart };
      })
    );
    setSelectedProduct(null);
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
            item.product.variant.id === variantId && item.batch.patch_code === batchCode
              ? { ...item, quantity: newQuantity }
              : item
          );
        }
        return { ...order, cart: newCart };
      })
    );
  };

  const removeFromCart = (variantId: string, batchCode: string) => {
     if (!currentOrderId) return;
     setActiveOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id !== currentOrderId) return order;
        const newCart = order.cart.filter((item) => !(item.product.variant.id === variantId && item.batch.patch_code === batchCode));
        return {...order, cart: newCart };
      })
    );
  };
  
  const onHoldOrder = async () => {
    if (!currentOrder || !currentOrder.cart.length || !currentCashier) {
      toast({
        variant: 'default',
        title: 'Cannot Hold Empty Order',
        description: 'Add items to the cart before holding.',
      });
      return;
    }
    const cashierName = currentCashier.name;
    const payload = createInvoicePayload('2', cashierName);
     if (!payload) return;

    try {
      const response = await fetch('https://server-erp.payshia.com/pos-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to hold order.');
      }
      toast({
        title: 'Order Held',
        description: `${currentOrder.name} has been put on hold as Invoice #${result.invoice_number}.`,
      });
      
      onClearCart(currentOrderId!);
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
       toast({
        variant: 'destructive',
        title: 'Error Holding Order',
        description: errorMessage,
      });
    }
  };

  const clearCart = () => {
    if (!currentOrderId) return;
    setActiveOrders((prevOrders) =>
        prevOrders.filter((order) => order.id !== currentOrderId)
    );
    setCurrentOrderId(null);
    setDrawerOpen(false);
  };

  const onClearCart = (orderId: string) => {
    if (orderId === currentOrderId) {
        setCurrentOrderId(null);
    }
    setActiveOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const setDiscount = (newDiscount: number) => {
    if (!currentOrderId) return;
     setActiveOrders((prevOrders) =>
      prevOrders.map((order) => 
        order.id === currentOrderId ? { ...order, discount: newDiscount } : order
      )
    );
  }

  const setServiceCharge = (newServiceCharge: number) => {
    if (!currentOrderId) return;
    setActiveOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === currentOrderId ? { ...order, serviceCharge: newServiceCharge } : order
      )
    );
  };
  
  const onUpdateDetails = (orderId: string, newDetails: Partial<Pick<ActiveOrder, 'orderType' | 'tableName' | 'steward'>>) => {
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
  };

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
             return [];
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
      const total = subtotal - itemDiscounts + currentOrder.serviceCharge - currentOrder.discount;
      return { subtotal, serviceCharge: currentOrder.serviceCharge, discount: currentOrder.discount, itemDiscounts, total };
  }, [currentOrder]);
  
  const handleProcessReturn = async () => {
    if (!currentLocation || !selectedCustomerForAction || returnItems.length === 0 || !company_id || !currentCashier) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a customer, and add at least one item to return.",
      });
      return;
    }
    setIsSubmittingReturn(true);
    
    const totalReturnAmount = returnItems.reduce((acc, item) => acc + item.amount, 0);

    const payload = {
      customer_id: parseInt(selectedCustomerForAction, 10),
      location_id: parseInt(currentLocation.location_id, 10),
      created_at: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      updated_by: currentCashier.name,
      reason: returnReason || "POS Return",
      refund_id: `REF-${Date.now()}`,
      is_active: 1,
      ref_invoice: selectedInvoiceForAction?.invoice_number || "N/A",
      return_amount: totalReturnAmount,
      settled_invoice: "N/A", 
      company_id: company_id,
      stock_entries: returnItems.map(item => ({
        type: "IN",
        quantity: item.quantity,
        product_id: parseInt(item.productId, 10),
        location_id: currentLocation.location_id,
        ref_id: selectedInvoiceForAction?.invoice_number || `RET-${Date.now()}`,
        transaction_type: "return",
        product_variant_id: parseInt(item.productVariantId, 10),
        patch_code: "UNKNOWN",
        manufacture_date: format(new Date(), 'yyyy-MM-dd'),
        expire_date: format(new Date(), 'yyyy-MM-dd'),
      }))
    };
    
    try {
        const response = await fetch('https://server-erp.payshia.com/transaction-returns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to process return.");
        }
        
        toast({
            title: "Return Processed",
            description: "The return has been successfully processed."
        });
        setReturnDialogOpen(false);
        setSelectedCustomerForAction(null);
        setSelectedInvoiceForAction(null);
        setReturnItems([]);
        setReturnReason("");

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: "destructive",
            title: "Error Processing Return",
            description: errorMessage
        });
    } finally {
        setIsSubmittingReturn(false);
    }
  };

    const handleRefund = async () => {
        if (!selectedReturnForRefund || !currentLocation || !company_id || !currentCashier) {
            toast({ variant: "destructive", title: "Error", description: "No return selected or location missing." });
            return;
        }

        setIsSubmittingRefund(true);
        const itemsToRefund = (selectedReturnForRefund.stock_entries || []).filter(entry => refundQuantities[entry.id] > 0);
        
        if (itemsToRefund.length === 0) {
            toast({ variant: "destructive", title: "No Items to Refund", description: "Please enter a quantity for at least one item."});
            setIsSubmittingRefund(false);
            return;
        }

        const refundPromises = itemsToRefund.map(entry => {
            const refundQty = refundQuantities[entry.id];
            const productPrice = entry.product ? parseFloat(entry.product.price as string) : 0;

            const payload = {
                rtn_number: selectedReturnForRefund.rtn_number,
                refund_amount: productPrice * refundQty,
                refund_datetime: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
                is_active: 1,
                update_by: currentCashier.name,
                customer_id: parseInt(selectedReturnForRefund.customer_id, 10),
                rtn_location: parseInt(selectedReturnForRefund.location_id, 10),
                current_location: parseInt(currentLocation.location_id, 10),
                company_id: company_id,
                product_id: parseInt(entry.product_id, 10),
                product_variant_id: parseInt(entry.product_variant_id, 10),
                refund_qty: refundQty,
            };
            return fetch('https://server-erp.payshia.com/transaction-refunds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        });

        try {
            const responses = await Promise.all(refundPromises);
            for (const response of responses) {
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'One or more refund requests failed.');
                }
            }
            toast({
                title: "Refund Processed Successfully",
                description: `Refund for ${selectedReturnForRefund.rtn_number} has been completed.`,
            });
            setRefundDialogOpen(false);
            setSelectedReturnForRefund(null);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            toast({
                variant: "destructive",
                title: "Refund Failed",
                description: errorMessage
            });
        } finally {
            setIsSubmittingRefund(false);
        }
    };
    
    const handleReturnTypeChange = (newType: 'invoice' | 'manual') => {
        setReturnType(newType);
        if (newType === 'manual') {
            setReturnItems([]);
            setSelectedInvoiceForAction(null);
        }
    };
    
    useEffect(() => {
        async function fetchHeldOrders() {
            if (!isDrawerOpen || !company_id) return;
            setIsHeldOrdersLoading(true);
            try {
                const response = await fetch(`https://server-erp.payshia.com/invoices/filter/hold/by-company-status?company_id=${company_id}&invoice_status=2`);
                if (!response.ok) {
                    throw new Error('Failed to fetch held orders');
                }
                const data: Invoice[] = await response.json();
                setHeldOrders(data || []);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch held orders.' });
            } finally {
                setIsHeldOrdersLoading(false);
            }
        }
        fetchHeldOrders();
    }, [isDrawerOpen, toast, company_id]);
    
    const handleSelectHeldOrder = async (invoice: Invoice) => {
        if (!company_id) {
             toast({ variant: 'destructive', title: 'Error', description: 'Company ID is missing.' });
             return;
        }
        setIsHeldOrderDetailsLoading(true);
        setIsHeldOrderDetailsOpen(true);
        try {
            const response = await fetch(`https://server-erp.payshia.com/pos-invoices/${invoice.id}?company_id=${company_id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch held order details');
            }
            const data: Invoice = await response.json();
            setSelectedHeldOrderDetails(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load order details.' });
            setIsHeldOrderDetailsOpen(false);
        } finally {
            setIsHeldOrderDetailsLoading(false);
        }
    };
    
     const loadHeldOrder = (invoice: Invoice | null) => {
        if (!invoice || !invoice.items) return;

        const customerForOrder = customers.find(c => c.customer_id === invoice.customer_code) || walkInCustomer;
        
        const cartItems: CartItem[] = (invoice.items || []).map(item => {
            const productDetails = posProducts.find(p => p.id === String(item.product_id));
            if (!productDetails) return null;

            const variantDetails = (productDetails.variants && productDetails.variants.length > 0)
                ? productDetails.variants.find(v => v.id === String(item.product_variant_id))
                : productDetails.variant; 

            if (!variantDetails) return null;
            
            const variantName = [productDetails.name, variantDetails.color, variantDetails.size].filter(Boolean).join(' - ');

            return {
                product: {
                    ...productDetails,
                    price: parseFloat(String(item.item_price)), 
                    variant: variantDetails,
                    variantName: variantName,
                },
                quantity: parseFloat(String(item.quantity)),
                itemDiscount: parseFloat(String(item.item_discount)),
                batch: { patch_code: 'HELD', expire_date: '' } as StockInfo, 
            };
        }).filter((item): item is CartItem => item !== null);
        
        if (cartItems.length !== invoice.items.length) {
            toast({
                variant: 'destructive',
                title: 'Product Mismatch',
                description: 'Some products in the held order could not be found and were not loaded.',
            });
        }
        
        const itemDiscounts = cartItems.reduce((acc, item) => acc + (item.itemDiscount || 0), 0);
        
        const heldOrder: ActiveOrder = {
            id: invoice.id,
            name: invoice.remark || `Order ${invoice.invoice_number}`,
            cart: cartItems,
            discount: parseFloat(invoice.discount_amount) - itemDiscounts,
            serviceCharge: parseFloat(invoice.service_charge),
            customer: customerForOrder,
            orderType: 'Take Away', 
            steward: stewards.find(s => s.id === invoice.steward_id),
            originalInvoiceNumber: invoice.invoice_number,
        };
        
        setActiveOrders(prev => [...prev.filter(o => o.id !== invoice.id), heldOrder]);
        setCurrentOrderId(heldOrder.id);
        setIsHeldOrderDetailsOpen(false);
        setDrawerOpen(false);
    }

  const orderPanelComponent = currentOrder && currentCashier ? (
     <OrderPanel
        key={currentOrder.id}
        order={currentOrder}
        orderTotals={orderTotals}
        cashierName={currentCashier.name}
        currentLocation={currentLocation}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={onClearCart}
        onHoldOrder={onHoldOrder}
        onSendToKitchen={handleSendToKitchen}
        isDrawer={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        setDiscount={setDiscount}
        setServiceCharge={setServiceCharge}
        onUpdateDetails={onUpdateDetails}
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
        {isHeldOrdersLoading ? <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> :
         heldOrders.length > 0 ? heldOrders.map(order => (
            <Button key={order.id} variant="outline" className='w-full justify-between' onClick={() => handleSelectHeldOrder(order)}>
                <div>
                    <span className="font-semibold">{order.invoice_number}</span>
                    <span className="text-xs text-muted-foreground ml-2">{customers.find(c => c.customer_id === order.customer_code)?.name}</span>
                </div>
                <Badge>{order.items?.length || 0}</Badge>
            </Button>
        )) : <p className='text-muted-foreground text-sm'>No orders are currently on hold.</p>
       }
    </div>
  );
  
  const categories = ['All', ...new Set(posProducts.map((p) => p.category))];

   if (isLocationLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentLocation) {
    const posLocations = availableLocations.filter(loc => loc.pos_status === '1');
    return (
      <LocationSelectionDialog
        open={!currentLocation}
        locations={posLocations}
        onSelectLocation={(loc) => setCurrentLocation(loc)}
      />
    );
  }

  if (!currentCashier) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Loading cashier details...</p>
      </div>
    )
  }

  return (
    <>
      <AddToCartDialog
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />
      <NewOrderDialog
        isOpen={isNewOrderDialogOpen}
        onOpenChange={setNewOrderDialogOpen}
        tables={tables}
        stewards={stewards}
        isLoadingTables={isLoadingTables}
        isLoadingStewards={isLoadingStewards}
        activeOrders={activeOrders}
        createNewOrder={createNewOrder}
      />
      <HeldOrderDetailsDialog
        isOpen={isHeldOrderDetailsOpen}
        onOpenChange={setIsHeldOrderDetailsOpen}
        isLoading={isHeldOrderDetailsLoading}
        heldOrder={selectedHeldOrderDetails}
        customers={customers}
        posProducts={posProducts}
        onLoadOrder={loadHeldOrder}
      />
       <PendingInvoicesDialog
        isOpen={isPendingInvoicesDialogOpen}
        onOpenChange={setPendingInvoicesDialogOpen}
        customers={customers}
        selectedCustomer={selectedCustomerForAction}
        setSelectedCustomer={setSelectedCustomerForAction}
        pastInvoices={pastInvoices}
        isLoadingPastInvoices={isPastInvoicesLoading}
        selectedInvoice={selectedInvoiceForAction}
        handleInvoiceSelect={handleInvoiceSelectForAction}
        balanceDetails={balanceDetails}
        isLoadingBalance={isBalanceLoading}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        isSubmittingPayment={isSubmittingPayment}
        handleCreateReceipt={handleCreateReceipt}
      />
       <ReturnDialog
        isOpen={isReturnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        returnType={returnType}
        setReturnType={handleReturnTypeChange}
        customers={customers}
        selectedCustomer={selectedCustomerForAction}
        setSelectedCustomer={setSelectedCustomerForAction}
        pastInvoices={pastInvoices}
        isLoadingPastInvoices={isPastInvoicesLoading}
        handleInvoiceSelect={handleInvoiceSelectForAction}
        returnReason={returnReason}
        setReturnReason={setReturnReason}
        returnItems={returnItems}
        setReturnItems={setReturnItems}
        isSubmittingReturn={isSubmittingReturn}
        handleProcessReturn={handleProcessReturn}
      />
      <RefundDialog
        isOpen={isRefundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        isLoading={isReturnsLoading}
        customers={customers}
        transactionReturns={transactionReturns}
        selectedReturn={selectedReturnForRefund}
        setSelectedReturn={setSelectedReturnForRefund}
        handleReturnSelect={handleReturnSelectForAction}
        refundQuantities={refundQuantities}
        setRefundQuantities={setRefundQuantities}
        isSubmitting={isSubmittingRefund}
        handleRefund={handleRefund}
      />

       <div className="flex h-screen w-screen flex-col">
        <PosHeader
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            cashier={currentCashier}
        />
        <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col">
                <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                         <Button variant="outline" size="sm" onClick={() => setPendingInvoicesDialogOpen(true)}>
                            <Receipt className="mr-2 h-4 w-4" />
                            Pending Invoices
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setReturnDialogOpen(true)}>
                            <Undo2 className="mr-2 h-4 w-4" />
                            Return
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setRefundDialogOpen(true)}>
                            <Banknote className="mr-2 h-4 w-4" />
                            Refund
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                    <Drawer open={isDrawerOpen} onOpenChange={setDrawerOpen}>
                        <DrawerTrigger asChild>
                            <Button variant="outline">
                                <NotebookPen className="mr-2 h-4 w-4" />
                                Held Orders ({heldOrders.length})
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                            <DrawerTitle className="sr-only">Held Orders</DrawerTitle>
                            {heldOrdersList}
                        </DrawerContent>
                    </Drawer>
                    <Button onClick={() => setNewOrderDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> New Order
                    </Button>
                    </div>
                </div>
                <div className="flex-1 flex overflow-hidden">
                    <ScrollArea className="flex-1 p-4">
                    {isLoadingProducts ? (
                        <div className="flex items-center justify-center h-[calc(100vh-250px)]">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    ) : (
                        <ProductGrid products={filteredProducts} onProductSelect={handleProductSelect} />
                    )}
                    </ScrollArea>
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
                                    <div className='flex items-center gap-2'>
                                        <ShoppingCart className="h-6 w-6" />
                                        <span>View {currentOrder.name}</span>
                                        <Badge variant="secondary" className="text-base">{totalItems}</Badge>
                                    </div>
                                    <span className='font-bold'>LKR {orderTotals.total.toFixed(2)}</span>
                                </div>
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent className='h-[90vh]'>
                            <DrawerTitle className="sr-only">Order Details</DrawerTitle>
                            {orderPanelComponent}
                        </DrawerContent>
                    </Drawer>
                </div>
                )}
            </div>
        </div>
      </div>
    </>
  );
}
