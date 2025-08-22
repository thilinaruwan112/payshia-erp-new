

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Product, User, ProductVariant, Collection, Brand, Invoice, ActiveOrder, CartItem, Table as TableType, Location, InvoiceItem } from '@/lib/types';
import { ProductGrid } from '@/components/pos/product-grid';
import { OrderPanel } from '@/components/pos/order-panel';
import { PosHeader } from '@/components/pos/pos-header';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ChefHat, Plus, NotebookPen, Loader2, Receipt, Undo2, Settings, History, ArrowLeft, FileText, UserPlus, RefreshCcw, Maximize, Menu, MapPin, Beer, Utensils, Pizza, UserCheck, Minus, CheckCircle, Trash2, Info, Banknote, X, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AddToCartDialog } from '@/components/pos/add-to-cart-dialog';
import { useLocation } from '@/components/location-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomerFormDialog } from '@/components/customer-form-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ProductPickerDialog } from '@/components/product-picker-dialog';


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

type StockEntry = {
    id: string;
    type: "IN" | "OUT";
    quantity: string;
    patch_code: string;
    manufacture_date: string;
    expire_date: string;
    product_id: string;
    reference: string;
    location_id: string;
    created_by: string;
    created_at: string;
    is_active: string;
    ref_id: string;
    company_id: string;
    transaction_type: string;
    product_variant_id: string;
    product?: Product;
    product_variant?: ProductVariant;
}

type TransactionReturn = {
  id: string;
  rtn_number: string;
  customer_id: string;
  location_id: string;
  created_at: string;
  updated_by: string;
  reason: string;
  refund_id: string;
  is_active: string;
  ref_invoice: string;
  return_amount: string;
  settled_invoice: string;
  company_id: string;
  stock_entries?: StockEntry[];
};


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
                                <AvatarImage src={steward.avatar} alt={steward.name} data-ai-hint="profile picture" />
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

type ReturnItem = {
    id: string; // This will be the variant ID
    name: string;
    unit: string;
    rate: number;
    quantity: number;
    amount: number;
    reason: string;
    // Data needed for submission
    productId: string;
    productVariantId: string;
};


const LocationSelectionDialog = ({ open, locations, onSelectLocation }: { open: boolean, locations: Location[], onSelectLocation: (location: Location) => void }) => {
    return (
        <Dialog open={open}>
            <DialogContent className="sm:max-w-2xl" hideCloseButton>
                <DialogHeader>
                    <DialogTitle className="text-2xl">Select Your POS Location</DialogTitle>
                    <DialogDescription>
                        Choose the location you are currently operating from to begin sales.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <ScrollArea className="h-96">
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                            {locations.map(loc => (
                                <Card key={loc.location_id} className="hover:border-primary hover:shadow-lg transition-all cursor-pointer" onClick={() => onSelectLocation(loc)}>
                                    <CardHeader>
                                        <Building className="h-8 w-8 text-primary mb-2" />
                                        <CardTitle>{loc.location_name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground">
                                        <p>{loc.address_line1}</p>
                                        <p>{loc.city}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}


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


  const [selectedProduct, setSelectedProduct] = useState<PosProduct | null>(null);
  const defaultCashier = { id: 'user-3', name: 'Cashier Chloe', role: 'Sales Agent', avatar: 'https://placehold.co/100x100.png?text=CC', email: 'chloe@payshia.com', customer_id: '3' };
  const walkInCustomer = { id: 'user-4', name: 'Walk-in Customer', role: 'Customer', avatar: 'https://placehold.co/100x100.png?text=WC', loyaltyPoints: 0, email: 'walkin@payshia.com', phone: 'N/A', address: 'N/A', customer_id: '4' };

  const [currentCashier, setCurrentCashier] = useState<User>(defaultCashier);
  
  const { currentLocation, isLoading: isLocationLoading, setCurrentLocation, availableLocations, company_id } = useLocation();
  

  useEffect(() => {
    async function fetchPosData() {
        if (!company_id) {
            setIsLoadingProducts(false);
            return;
        }
        setIsLoadingProducts(true);
        try {
            const [productsResponse, collectionsResponse, brandsResponse, customersResponse] = await Promise.all([
                fetch(`https://server-erp.payshia.com/products/with-variants?company_id=${company_id}`),
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
            const stewardsData = await stewardsResponse.json();
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
    if (!selectedInvoiceForAction || !currentLocation || !company_id) {
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
            description: `Payment of $${paymentAmount} recorded successfully.`
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
    setSelectedProduct(null);
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

  const onHoldOrder = async () => {
    if (!currentOrder || currentOrder.cart.length === 0) {
      toast({
        variant: 'default',
        title: 'Cannot Hold Empty Order',
        description: 'Add items to the cart before holding.',
      });
      return;
    }
    const payload = createInvoicePayload('2');
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
      onClearCart(currentOrderId);
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
       toast({
        variant: 'destructive',
        title: 'Error Holding Order',
        description: errorMessage,
      });
    }
  };
  
   const createInvoicePayload = (status: '1' | '2', paymentMethod = 'N/A', tenderedAmount = 0) => {
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
        current_time: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        location_id: parseInt(currentLocation.location_id, 10),
        table_id: 0,
        order_ready_status: 1,
        created_by: currentCashier.name,
        is_active: 1,
        steward_id: currentOrder.steward?.id || "N/A",
        cost_value: costValue,
        remark: `${currentOrder.orderType} order`,
        ref_hold: status === '1' ? 'direct' : null,
        company_id: company_id,
        chanel: "POS",
        items: currentOrder.cart.map(item => ({
            user_id: parseInt(currentOrder.customer.customer_id, 10),
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
        })),
    };
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
  
  const handleAddReturnItem = () => {
    if (!currentReturnProduct) return;
    const newItem: ReturnItem = {
      id: currentReturnProduct.variant.id,
      name: currentReturnProduct.variantName,
      unit: currentReturnProduct.stock_unit || 'Nos',
      rate: currentReturnProduct.price as number,
      quantity: currentReturnQty,
      amount: (currentReturnProduct.price as number) * currentReturnQty,
      reason: returnReason,
      productId: currentReturnProduct.id,
      productVariantId: currentReturnProduct.variant.id,
    };
    setReturnItems(prev => [...prev, newItem]);
    setCurrentReturnProduct(null);
    setCurrentReturnQty(1);
    // Keep the general reason
  };
  
  const handleProcessReturn = async () => {
    if (!currentLocation || !selectedCustomerForAction || returnItems.length === 0 || !company_id) {
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
        if (!selectedReturnForRefund || !currentLocation || !company_id) {
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
        // When switching return type, clear any invoice-specific data
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
        setIsHeldOrderDetailsLoading(true);
        setIsHeldOrderDetailsOpen(true);
        try {
            const response = await fetch(`https://server-erp.payshia.com/pos-invoices/${invoice.id}`);
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
                : productDetails.variant; // Fallback to main product variant if no variants array

            if (!variantDetails) return null;
            
            const variantName = [productDetails.name, variantDetails.color, variantDetails.size].filter(Boolean).join(' - ');

            return {
                product: {
                    ...productDetails,
                    price: parseFloat(String(item.item_price)), // Use price from invoice
                    variant: variantDetails,
                    variantName: variantName,
                },
                quantity: parseFloat(String(item.quantity)),
                itemDiscount: parseFloat(String(item.item_discount)),
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
            orderType: 'Take Away', // Default, can be improved
            steward: stewards.find(s => s.id === invoice.steward_id),
            originalInvoiceNumber: invoice.invoice_number,
        };
        
        setActiveOrders(prev => [...prev.filter(o => o.id !== invoice.id), heldOrder]);
        setCurrentOrderId(heldOrder.id);
        setIsHeldOrderDetailsOpen(false);
        setDrawerOpen(false);
    }

  const orderPanelComponent = currentOrder ? (
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

  return (
    <>
      <AddToCartDialog
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />
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
                            <Receipt className="mr-2 h-4 w-4" />
                            Pending Invoices
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Pay Pending Invoices</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Select onValueChange={setSelectedCustomerForAction}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a customer..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map(c => (
                                        <SelectItem key={c.customer_id} value={c.customer_id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {isPastInvoicesLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : (
                                 <RadioGroup onValueChange={(invoiceNumber) => handleInvoiceSelectForAction(pastInvoices.find(i => i.invoice_number === invoiceNumber)!)}>
                                    {pastInvoices.map(invoice => (
                                        <div key={invoice.id} className="flex items-center space-x-2">
                                            <RadioGroupItem value={invoice.invoice_number} id={invoice.id} />
                                            <Label htmlFor={invoice.id} className="flex justify-between w-full">
                                                <span>{invoice.invoice_number} ({format(new Date(invoice.invoice_date), 'dd/MM/yy')})</span>
                                                <span>${parseFloat(invoice.grand_total).toFixed(2)}</span>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            )}
                             {selectedInvoiceForAction && (
                                <Card>
                                    <CardContent className="pt-4">
                                        <div className="space-y-2">
                                            <Select onValueChange={setPaymentMethod} defaultValue={paymentMethod}>
                                                <SelectTrigger><SelectValue placeholder="Payment Method" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Cash">Cash</SelectItem>
                                                    <SelectItem value="Card">Card</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Input 
                                                placeholder="Amount" 
                                                type="number" 
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setPendingInvoicesDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateReceipt} disabled={isBalanceLoading || !selectedInvoiceForAction || isSubmittingPayment}>
                                {isSubmittingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Record Payment
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                 <Dialog open={isReturnDialogOpen} onOpenChange={setReturnDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Undo2 className="mr-2 h-4 w-4" />
                            Return
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Process a Return</DialogTitle>
                        </DialogHeader>
                         <div className="space-y-4">
                            <RadioGroup value={returnType} onValueChange={handleReturnTypeChange} className="flex gap-4">
                                <div><RadioGroupItem value="invoice" id="r-invoice" /><Label htmlFor="r-invoice" className="ml-2">Return with Invoice</Label></div>
                                <div><RadioGroupItem value="manual" id="r-manual" /><Label htmlFor="r-manual" className="ml-2">Manual Return</Label></div>
                            </RadioGroup>
                            
                            {!selectedCustomerForAction ? (
                                <Select onValueChange={setSelectedCustomerForAction}>
                                    <SelectTrigger><SelectValue placeholder="Select a customer..."/></SelectTrigger>
                                    <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center bg-muted p-2 rounded-md">
                                        <p>Customer: <span className="font-semibold">{customers.find(c => c.id === selectedCustomerForAction)?.name}</span></p>
                                        <Button variant="ghost" size="sm" onClick={() => {
                                            setSelectedCustomerForAction(null);
                                            setSelectedInvoiceForAction(null);
                                            setReturnItems([]);
                                        }}>Change</Button>
                                    </div>
                                    
                                    {returnType === 'invoice' ? (
                                        <Select onValueChange={(invNumber) => handleInvoiceSelectForAction(pastInvoices.find(i => i.invoice_number === invNumber)!)} disabled={isPastInvoicesLoading}>
                                            <SelectTrigger><SelectValue placeholder="Select Invoice to Return From"/></SelectTrigger>
                                            <SelectContent>{pastInvoices.map(inv => <SelectItem key={inv.id} value={inv.invoice_number}>{inv.invoice_number}</SelectItem>)}</SelectContent>
                                        </Select>
                                    ) : (
                                        <ProductPickerDialog onProductsSelected={(products) => {
                                            const newItems = products.map(p => ({
                                                id: p.variant.id,
                                                name: p.variantName,
                                                unit: p.stock_unit || 'Nos',
                                                rate: p.price as number,
                                                quantity: 1,
                                                amount: p.price as number,
                                                reason: '',
                                                productId: p.id,
                                                productVariantId: p.variant.id,
                                            }));
                                            setReturnItems(newItems);
                                        }}>
                                            <Button variant="outline">Add Products to Return</Button>
                                        </ProductPickerDialog>
                                    )}

                                    <Input placeholder="General Reason for Return (Optional)" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} />

                                    <Table>
                                        <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Return Qty</TableHead><TableHead>Reason</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {isPastInvoicesLoading ? (
                                                <TableRow><TableCell colSpan={3} className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                                            ) : returnItems.length > 0 ? (
                                                returnItems.map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{item.name}</TableCell>
                                                        <TableCell><Input type="number" value={item.quantity} onChange={(e) => setReturnItems(prev => prev.map((p, i) => i === index ? { ...p, quantity: parseInt(e.target.value) || 0, amount: (parseInt(e.target.value) || 0) * p.rate } : p))} className="w-20" /></TableCell>
                                                        <TableCell><Input value={item.reason} onChange={(e) => setReturnItems(prev => prev.map((p, i) => i === index ? { ...p, reason: e.target.value } : p))} placeholder="Item-specific reason" /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Select an invoice or add products manually.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleProcessReturn} disabled={returnItems.length === 0 || isSubmittingReturn}>
                                {isSubmittingReturn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Process Return
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Dialog open={isRefundDialogOpen} onOpenChange={setRefundDialogOpen}>
                    <DialogTrigger asChild>
                         <Button variant="outline" size="sm">
                            <Banknote className="mr-2 h-4 w-4" />
                            Refund
                        </Button>
                    </DialogTrigger>
                     <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                        <DialogHeader className="flex-row items-center justify-between border-b pb-4">
                            <div className="flex items-center gap-4">
                                {selectedReturnForRefund && <Button variant="ghost" onClick={() => setSelectedReturnForRefund(null)}><ArrowLeft className="h-5 w-5 mr-2"/> Back</Button>}
                                <img src="https://i.imgur.com/kS4S17L.png" alt="Payshia POS" className="h-8"/>
                                <div className="text-left">
                                    <DialogTitle className="text-2xl">{selectedReturnForRefund ? 'Refund Confirmation' : 'Select Return to Make Refund'}</DialogTitle>
                                    {!selectedReturnForRefund && <DialogDescription>Note : A La Carte Items cannot be Returned of Refunded!</DialogDescription>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon"><RefreshCcw className="h-5 w-5" /></Button>
                                <DialogClose asChild><Button variant="ghost" size="icon"><X className="h-5 w-5" /></Button></DialogClose>
                            </div>
                        </DialogHeader>
                        {selectedReturnForRefund ? (
                            <div className="grid grid-cols-2 gap-8 p-6 flex-1 overflow-y-auto">
                                <div>
                                    <Badge>{customers.find(c => c.customer_id === selectedReturnForRefund.customer_id)?.name || 'Walk-in'}</Badge>
                                    <p className="text-2xl font-bold mt-1">{selectedReturnForRefund.rtn_number}</p>
                                    <p className="text-4xl font-bold text-green-600">${parseFloat(selectedReturnForRefund.return_amount).toFixed(2)}</p>
                                    <Badge variant="secondary" className="mt-1 text-sm font-normal">{format(new Date(selectedReturnForRefund.created_at), 'yyyy-MM-dd HH:mm')}</Badge>
                                    <Table className="mt-4">
                                        <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="w-24">Return Qty</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {selectedReturnForRefund.stock_entries?.map(item => {
                                                const maxQty = parseFloat(item.quantity);
                                                return (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.product ? item.product.name : 'Product not found'}</TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={refundQuantities[item.id] || ''}
                                                            onChange={(e) => {
                                                                const newQty = Math.min(parseFloat(e.target.value) || 0, maxQty);
                                                                setRefundQuantities(prev => ({...prev, [item.id]: newQty}));
                                                            }}
                                                            max={maxQty}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">${item.product ? (parseFloat(item.product.price as string) * (refundQuantities[item.id] || 0)).toFixed(2) : '0.00'}</TableCell>
                                                </TableRow>
                                            )}) || (
                                                 <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-muted-foreground">No item details available.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="bg-muted/50 p-6 rounded-lg flex flex-col justify-center">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-center">Enter PIN</h3>
                                        <Input type="password" placeholder="****" className="h-12 text-center text-2xl tracking-widest" />
                                        <Button onClick={handleRefund} disabled={isSubmittingRefund} className="w-full h-12 text-lg">
                                            {isSubmittingRefund && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Refund
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <ScrollArea className="flex-1 -mx-6 px-6">
                                {isReturnsLoading ? (
                                    <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 py-4">
                                        {transactionReturns.map(ret => {
                                            const customer = customers.find(c => c.customer_id === ret.customer_id)
                                            return (
                                                <Card key={ret.id} className="cursor-pointer hover:border-primary p-2" onClick={() => handleReturnSelectForAction(ret)}>
                                                    <CardHeader className="p-2">
                                                        <Badge className="w-fit mb-1 text-xs">{customer?.name || 'Walk-in'}</Badge>
                                                        <CardTitle className="text-sm">{ret.rtn_number}</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-2">
                                                        <p className="text-xl font-bold">${parseFloat(ret.return_amount).toFixed(2)}</p>
                                                        <Badge variant="secondary" className="mt-1 text-xs font-normal">{format(new Date(ret.created_at), 'yyyy-MM-dd HH:mm')}</Badge>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                )}
                            </ScrollArea>
                        )}
                    </DialogContent>
                </Dialog>
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
                                <span className='font-bold'>${orderTotals.total.toFixed(2)}</span>
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
      <Dialog open={isHeldOrderDetailsOpen} onOpenChange={setIsHeldOrderDetailsOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Held Order Details</DialogTitle>
                <DialogDescription>Review the details of the held order before loading it.</DialogDescription>
            </DialogHeader>
            {isHeldOrderDetailsLoading ? (
                 <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : selectedHeldOrderDetails ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div><p className="text-muted-foreground">Invoice #</p><p className="font-semibold">{selectedHeldOrderDetails.invoice_number}</p></div>
                        <div><p className="text-muted-foreground">Customer</p><p className="font-semibold">{customers.find(c => c.customer_id === selectedHeldOrderDetails.customer_code)?.name}</p></div>
                        <div><p className="text-muted-foreground">Date</p><p className="font-semibold">{format(new Date(selectedHeldOrderDetails.invoice_date), 'PPP')}</p></div>
                    </div>
                     <Table>
                        <TableHeader>
                            <TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Total</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedHeldOrderDetails.items?.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{posProducts.find(p => p.id === String(item.product_id))?.name}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell className="text-right">${(parseFloat(item.item_price as string) * parseFloat(item.quantity as string)).toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={2} className="text-right font-bold">Grand Total</TableCell>
                                <TableCell className="text-right font-bold">${parseFloat(selectedHeldOrderDetails.grand_total).toFixed(2)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            ) : <p>Could not load order details.</p>}
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsHeldOrderDetailsOpen(false)}>Cancel</Button>
                <Button onClick={() => loadHeldOrder(selectedHeldOrderDetails)} disabled={!selectedHeldOrderDetails}>Load This Order</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
