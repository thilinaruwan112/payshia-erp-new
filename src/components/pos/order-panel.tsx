
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { CartItem, ActiveOrder, StockInfo } from '@/app/(pos)/pos-system/page';
import type { User, Table as TableType, Location, Invoice, Customer, PaymentMethod } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MinusCircle,
  PlusCircle,
  X,
  CreditCard,
  TicketPercent,
  Trash2,
  Notebook,
  Settings,
  Receipt,
  Delete,
  Printer,
  CheckCircle,
  ArrowRight,
  User as UserIcon,
  Send,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Switch } from '../ui/switch';
import { format } from 'date-fns';
import { useLocation } from '../location-provider';
import { Badge } from '../ui/badge';
import { useCurrency } from '../currency-provider';
import { fetcher } from '@/lib/api';
import { openCenteredPopup } from '@/lib/utils';
import { PayshiaPosLogo } from './payshia-pos-logo';
import { CustomerPanel } from './customer-panel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';

export interface OrderInfo {
  subtotal: number;
  serviceCharge: number;
  tdl: number;
  sscl: number;
  vat: number;
  discount: number; // Order-level discount
  itemDiscounts: number; // Sum of all item-level discounts
  total: number;
};

interface OrderPanelProps {
  order: ActiveOrder;
  orderTotals: OrderInfo;
  cashierName: string;
  currentLocation: Location | null;
  paymentMethods: PaymentMethod[];
  onUpdateQuantity: (variantId: string, batchCode: string, newQuantity: number) => void;
  onRemoveItem: (uniqueId: string) => void;
  onClearCart: (invoiceId: string) => void;
  onHoldAndKitchen: () => void;
  isDrawer?: boolean;
  onClose?: () => void;
  setDiscount: (discount: number) => void;
  isServiceChargeActive: boolean;
  setIsServiceChargeActive: (isActive: boolean) => void;
  onUpdateDetails: (orderId: string, newDetails: Partial<Pick<ActiveOrder, 'orderType' | 'tableName' | 'steward'>>) => void;
  availableTables: TableType[];
  availableStewards: User[];
  customers: User[];
  onUpdateCustomer: (orderId: string, customer: User) => void;
  onCustomerCreated: (newCustomer: User) => void;
  showInclusivePriceOnly?: boolean;
}

type Receipt = {
    id: string;
    rec_number: string;
    type: string;
    is_active: string;
    date: string;
    amount: string;
    created_by: string;
    ref_id: string;
    location_id: string;
    customer_id: string;
    today_invoice: string;
    company_id: string;
    now_time: string;
};

type SuccessData = {
    invoiceNumber: string;
    invoiceAmount: number;
    tenderAmount: number;
    changeAmount: number;
    customerName: string;
    companyId: string;
}

const SuccessDialog = ({
  successData,
  onClose,
}: {
  successData: SuccessData | null;
  onClose: () => void;
}) => {
  const { currencySymbol } = useCurrency();
  if (!successData) return null;

  const handleReprint = () => {
    openCenteredPopup(`/pos/final-invoice/${successData.invoiceNumber}?company_id=${successData.companyId}`, 'Final Invoice', 400, 800);
  };

  return (
    <Dialog open={!!successData} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0" hideCloseButton>
        <div className="grid md:grid-cols-2">
          {/* Left side */}
          <div className="p-8 flex flex-col">
            <div className="mx-auto mb-6">
                <CheckCircle className="h-20 w-20 text-green-500" />
            </div>
            
            <div className="text-center">
                 <p className="text-muted-foreground text-sm sm:text-base">Change Amount</p>
                 <p className="font-bold font-mono text-5xl sm:text-7xl">{currencySymbol}{successData.changeAmount.toFixed(2)}</p>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">INV # / INT #</p>
                <p className="font-bold">{successData.invoiceNumber}</p>
              </div>
               <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-bold">{successData.customerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tender Amount</p>
                <p className="font-bold font-mono">{currencySymbol} {successData.tenderAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Invoice Amount</p>
                <p className="font-bold font-mono">{currencySymbol} {successData.invoiceAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="bg-muted/30 p-8 flex flex-col justify-center items-center text-center">
            <div className="space-y-4 w-full max-w-xs">
              <Button variant="secondary" className="w-full h-14 text-lg" onClick={handleReprint}>
                  <Printer className="mr-2 h-5 w-5" />
                  Reprint Invoice
              </Button>
              <Button size="lg" className="w-full h-16 text-lg" onClick={onClose}>
                  Next Customer <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
             <p className="text-xl font-bold pt-8 mt-auto">Thank You!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};



const PaymentDialog = ({
  orderTotals,
  onSuccessfulPayment,
  paymentMethods,
}: {
  orderTotals: OrderInfo;
  onSuccessfulPayment: (paymentMethod: string, tenderedAmount: number, isCredit: boolean) => void;
  paymentMethods: PaymentMethod[];
}) => {
  const { currencySymbol } = useCurrency();
  const [amountTendered, setAmountTendered] = React.useState('');
  const [selectedMethodId, setSelectedMethodId] = React.useState<string | null>(paymentMethods.length > 0 ? paymentMethods[0].id : null);
  const change = Number(amountTendered) - orderTotals.total;

  const handleConfirm = () => {
    if (selectedMethodId) {
      onSuccessfulPayment(selectedMethodId, Number(amountTendered) || orderTotals.total, false);
    }
  };

  const handleCloseAsCredit = () => {
    onSuccessfulPayment(selectedMethodId || (paymentMethods[0]?.id || ''), 0, true);
  };

  React.useEffect(() => {
    setAmountTendered(orderTotals.total.toFixed(2));
  }, [orderTotals.total]);

  const handleNumpadClick = (value: string) => {
    if (value === 'C') {
      setAmountTendered('');
    } else if (value === '<-') {
      setAmountTendered((prev) => prev.slice(0, -1));
    } else {
      setAmountTendered((prev) => prev + value);
    }
  };

  const getNextDenomination = (amount: number) => {
      if (amount <= 100) return 100;
      if (amount <= 500) return 500;
      if (amount <= 1000) return 1000;
      if (amount <= 5000) return 5000;
      const roundedUp = Math.ceil(amount / 1000) * 1000;
      return roundedUp > amount ? roundedUp : roundedUp + 1000;
  }
  const quickCashAmount = getNextDenomination(orderTotals.total);

  return (
    <DialogContent className="max-w-4xl p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <div className="bg-muted rounded-xl p-6 text-center">
                <p className="text-lg text-muted-foreground">Total Due</p>
                <p className="font-bold font-mono text-5xl md:text-6xl">{currencySymbol}{orderTotals.total.toFixed(2)}</p>
            </div>
             <div className="grid grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                    <Button
                    key={method.id}
                    variant={selectedMethodId === method.id ? 'default' : 'outline'}
                    className="h-24 text-xl"
                    onClick={() => setSelectedMethodId(method.id)}
                    >
                    {method.method}
                    </Button>
                ))}
            </div>
             <div className="grid grid-cols-2 gap-4">
                <Button variant="secondary" className="h-20 text-lg" onClick={() => setAmountTendered(orderTotals.total.toFixed(2))}>
                    Exact Amount
                </Button>
                <Button variant="secondary" className="h-20 text-lg" onClick={() => setAmountTendered(String(quickCashAmount))}>
                    {currencySymbol}{quickCashAmount}
                </Button>
            </div>
             {Number(amountTendered) > 0 && (
                <div className="text-center font-medium text-lg pt-2">
                    <p className="text-muted-foreground">Change Due</p>
                    <p className="text-3xl font-bold font-mono">{currencySymbol}{change > 0 ? change.toFixed(2) : '0.00'}</p>
                </div>
            )}
        </div>
        <div className="space-y-4">
             <div>
                <Label htmlFor="amount-tendered" className="text-lg">Amount Tendered</Label>
                <Input
                    id="amount-tendered"
                    type="number"
                    placeholder="0.00"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="h-24 text-5xl text-right font-mono mt-2"
                />
            </div>
            <div className="grid grid-cols-3 gap-2">
                {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(val => (
                    <Button key={val} variant="outline" className="h-20 text-3xl" onClick={() => handleNumpadClick(val)}>{val}</Button>
                ))}
                <Button variant="outline" className="h-20 text-3xl" onClick={() => handleNumpadClick('.')}>.</Button>
                <Button variant="outline" className="h-20 text-3xl" onClick={() => handleNumpadClick('0')}>0</Button>
                <Button variant="outline" className="h-20 text-3xl" onClick={() => handleNumpadClick('<-')}><Delete /></Button>
            </div>
        </div>
      </div>
       <DialogFooter className="mt-6 sm:justify-between">
         <DialogClose asChild>
            <Button variant="outline" size="lg" className="h-16 text-lg">Cancel</Button>
         </DialogClose>
        <div className="flex gap-2">
            <Button
                size="lg"
                variant="secondary"
                className="h-16 text-lg"
                 onClick={handleCloseAsCredit}
            >
                Close as Credit
            </Button>
            <Button
                size="lg"
                onClick={handleConfirm}
                disabled={!selectedMethodId || !amountTendered || change < 0}
                className="h-16 text-lg"
            >
                Confirm Payment
            </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
};

const DiscountDialog = ({
  orderSubtotal,
  setDiscount,
  onClose,
}: {
  orderSubtotal: number;
  setDiscount: (d: number) => void;
  onClose: () => void;
}) => {
  const { currencySymbol } = useCurrency();
  const [discountValue, setDiscountValue] = React.useState('');
  const [isPercentage, setIsPercentage] = React.useState(false);

  const applyDiscount = () => {
    let finalDiscount = Number(discountValue);
    if (isPercentage) {
      finalDiscount = (orderSubtotal * finalDiscount) / 100;
    }
    setDiscount(finalDiscount);
    onClose();
  };

  const handleNumpadClick = (value: string) => {
    if (value === 'C') {
      setDiscountValue('');
    } else if (value === '<-') {
      setDiscountValue((prev) => prev.slice(0, -1));
    } else {
      setDiscountValue((prev) => prev + value);
    }
  };

  return (
    <DialogContent className="w-full sm:max-w-xs">
      <DialogHeader>
        <DialogTitle>Apply Order Discount</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <Label htmlFor="discount-value">
            {isPercentage ? 'Discount Percentage (%)' : `Discount Amount (${currencySymbol})`}
        </Label>
        <Input
          id="discount-value"
          type="number"
          placeholder="0.00"
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
          className="h-14 text-2xl text-right"
        />
        <div className="grid grid-cols-3 gap-2">
            {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(val => (
                <Button key={val} variant="outline" className="h-14 text-xl" onClick={() => handleNumpadClick(val)}>{val}</Button>
            ))}
            <Button variant="outline" className="h-14 text-xl" onClick={() => handleNumpadClick('.')}>.</Button>
            <Button variant="outline" className="h-14 text-xl" onClick={() => handleNumpadClick('0')}>0</Button>
            <Button variant="outline" className="h-14 text-xl" onClick={() => handleNumpadClick('<-')}><Delete /></Button>
        </div>
      </div>
      <DialogFooter className="grid grid-cols-1 gap-2 mt-4">
        <Button variant="ghost" className="w-full" onClick={() => setIsPercentage(!isPercentage)}>
          Switch to {isPercentage ? 'Fixed Amount' : 'Percentage'}
        </Button>
        <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={onClose} className="w-full">
            Cancel
            </Button>
            <Button onClick={applyDiscount} className="w-full">Apply Discount</Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
};

const EditOrderDialog = ({ order, onUpdateDetails, availableTables, availableStewards, onClose }: { 
    order: ActiveOrder;
    onUpdateDetails: (orderId: string, newDetails: Partial<Pick<ActiveOrder, 'orderType' | 'tableName' | 'steward'>>) => void;
    availableTables: TableType[];
    availableStewards: User[];
    onClose: () => void;
}) => {
    const [orderType, setOrderType] = React.useState(order.orderType);
    const [tableName, setTableName] = React.useState(order.tableName);
    const [steward, setSteward] = React.useState(order.steward);

    const handleSaveChanges = () => {
        onUpdateDetails(order.id, {
            orderType,
            tableName: orderType === 'Dine-In' ? tableName : undefined,
            steward: orderType === 'Dine-In' ? steward : undefined,
        });
        onClose();
    }
    
    const orderTypes: ActiveOrder['orderType'][] = ['Take Away', 'Delivery', 'Dine-In', 'Retail'];


    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Edit Order Details</DialogTitle>
                <DialogDescription>Change the order type, table, or assigned steward.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                 <div className="space-y-2">
                    <Label>Order Type</Label>
                    <div className="flex flex-wrap gap-2">
                      {orderTypes.map(type => (
                        <Button
                          key={type}
                          variant={orderType === type ? "default" : "outline"}
                          onClick={() => setOrderType(type)}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                </div>
                {orderType === 'Dine-In' && (
                    <>
                     <div className="space-y-2">
                        <Label>Table</Label>
                        <Select onValueChange={setTableName} value={tableName}>
                            <SelectTrigger><SelectValue placeholder="Select a table" /></SelectTrigger>
                            <SelectContent>
                                {availableTables.map(table => (
                                    <SelectItem key={table.id} value={table.table_name}>{table.table_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Steward</Label>
                         <Select onValueChange={(id) => setSteward(availableStewards.find(s => s.id === id))} value={steward?.id}>
                            <SelectTrigger><SelectValue placeholder="Select a steward" /></SelectTrigger>
                            <SelectContent>
                                {availableStewards.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.user_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                      </div>
                    </>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSaveChanges}>Save Changes</Button>
            </DialogFooter>
        </DialogContent>
    )
}

export function OrderPanel({
  order,
  orderTotals,
  cashierName,
  currentLocation,
  paymentMethods,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onHoldAndKitchen,
  isDrawer,
  onClose,
  setDiscount,
  isServiceChargeActive,
  setIsServiceChargeActive,
  onUpdateDetails,
  availableTables,
  availableStewards,
  customers,
  onUpdateCustomer,
  onCustomerCreated,
}: OrderPanelProps) {
  const { toast } = useToast();
  const { company_id } = useLocation();
  const { currencySymbol } = useCurrency();
  const [isPaymentOpen, setPaymentOpen] = React.useState(false);
  const [isDiscountOpen, setDiscountOpen] = React.useState(false);
  const [isEditOrderOpen, setEditOrderOpen] = React.useState(false);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const { cart, customer, name: orderName, discount, serviceCharge, id: orderId, steward, orderType, tableName } = order;

  const handleSuccessfulPayment = async (paymentMethodId: string, tenderedAmount: number, isCredit: boolean) => {
    
    if (!currentLocation || !company_id || !customer) {
        toast({
            variant: "destructive",
            title: "Location, Company, or Customer not selected",
            description: "Please select all required fields."
        });
        return;
    }
    
    toast({
      title: 'Payment Processing...',
      description: `Processing ${currencySymbol}${orderTotals.total.toFixed(2)}.`,
    });


    const totalDiscount = orderTotals.discount + orderTotals.itemDiscounts;
    const costValue = cart.reduce((acc, item) => acc + ((item.product.cost_price as number || 0) * item.quantity), 0);
    const refHoldValue = order.originalInvoiceNumber ? order.originalInvoiceNumber : "direct";
    
    let tableIdValue: number;
    switch (order.orderType) {
        case 'Take Away':
            tableIdValue = 0;
            break;
        case 'Retail':
            tableIdValue = -1;
            break;
        case 'Delivery':
            tableIdValue = -2;
            break;
        case 'Dine-In':
            const table = availableTables.find(t => t.table_name === tableName);
            tableIdValue = table ? parseInt(table.id, 10) : 0;
            break;
        default:
            tableIdValue = 0;
    }


    const payload = {
        invoice_date: format(new Date(), 'yyyy-MM-dd'),
        inv_amount: orderTotals.subtotal,
        grand_total: orderTotals.total,
        discount_amount: totalDiscount,
        discount_percentage: orderTotals.subtotal > 0 ? ((totalDiscount / orderTotals.subtotal) * 100) : 0,
        customer_code: customer.customer_id,
        service_charge: currentLocation.service_charge_status === 'Enabled' ? orderTotals.serviceCharge : 0,
        tendered_amount: tenderedAmount,
        close_type: paymentMethodId,
        invoice_status: isCredit ? '1' : '1',
        payment_status: tenderedAmount > 0 ? (tenderedAmount >= orderTotals.total ? "Paid" : "Partial") : "Pending",
        current_time: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        location_id: parseInt(currentLocation.location_id, 10),
        table_id: tableIdValue,
        order_ready_status: 1,
        created_by: cashierName,
        is_active: 1,
        steward_id: steward?.id || "N/A",
        cost_value: costValue,
        remark: `${orderType} order`,
        ref_hold: refHoldValue,
        company_id: company_id,
        chanel: "POS",
        items: cart.map(item => ({
            user_id: parseInt(steward?.id || '1', 10), // Default user_id as per example
            product_id: parseInt(item.product.id, 10),
            item_price: item.product.price,
            item_discount: item.itemDiscount,
            quantity: item.quantity,
            customer_id: parseInt(customer.customer_id, 10),
            table_id: tableIdValue,
            cost_price: item.product.costPrice || 0,
            is_active: 1,
            hold_status: 0,
            printed_status: 1,
            product_variant_id: parseInt(item.product.variant.id, 10),
            expire_date: item.batch.expire_date,
            company_id: company_id,
        })),
        vat_amount: currentLocation.vat_status === 'Enabled' ? orderTotals.vat : 0,
        sscl_tax: currentLocation.sscl_status === 'Enabled' ? orderTotals.sscl : 0,
        tdl: currentLocation.tdl_status === 'Enabled' ? orderTotals.tdl : 0,
    };

    try {

        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pos-invoices`, {

            method: 'POST',
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to create invoice.');
        }
        
        toast({
            title: 'Payment Successful!',
            description: `Invoice #${result.invoice_number} created.`
        });
        
        openCenteredPopup(`/pos/final-invoice/${result.invoice_number}?company_id=${company_id}`, 'Final Invoice', 400, 800);
        
        setPaymentOpen(false);
        setSuccessData({
            invoiceNumber: result.invoice_number,
            invoiceAmount: orderTotals.total,
            tenderAmount: tenderedAmount,
            changeAmount: tenderedAmount - orderTotals.total,
            customerName: `${customer.customer_first_name} ${customer.customer_last_name}`,
            companyId: String(company_id),
        });
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: "destructive",
            title: "Payment Failed",
            description: errorMessage,
        });
    }
  };
  
  const handleGuestReceipt = () => {
    if (!order.originalInvoiceNumber) {
      toast({
        variant: 'destructive',
        title: 'Not a Held Order',
        description: 'Guest receipts can only be printed for orders that have been held (sent to the kitchen).',
      });
      return;
    }
    openCenteredPopup(`/pos/guest-receipt/${order.originalInvoiceNumber}?company_id=${company_id}`, 'Guest Receipt', 400, 800);
  };
  
  const handleCloseSuccess = () => {
    onClearCart(orderId);
    setSuccessData(null);
  };
  
  const isStewardScreen = typeof window !== 'undefined' && window.location.pathname.includes('steward-dashboard');
  const discountPercentage = orderTotals.subtotal > 0 ? (discount / (orderTotals.subtotal - orderTotals.itemDiscounts)) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-card">
      <SuccessDialog successData={successData} onClose={handleCloseSuccess} />
      <Dialog open={isEditOrderOpen} onOpenChange={setEditOrderOpen}>
        <header className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-xl font-bold">{orderName}</h2>
            <div className="flex items-center">
                 <DialogTrigger asChild>
                    <Button variant="ghost" size="icon"><Settings className="h-5 w-5" /></Button>
                 </DialogTrigger>
                {isDrawer && (
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                )}
            </div>
        </header>
        <EditOrderDialog order={order} onUpdateDetails={onUpdateDetails} availableTables={availableTables} availableStewards={availableStewards} onClose={() => setEditOrderOpen(false)} />
      </Dialog>
      
      {steward && (
           <div className='p-2 px-4 border-b border-border bg-muted/30'>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserIcon className="h-4 w-4" />
                    <span>Steward: <span className="font-semibold text-foreground">{steward.user_name}</span></span>
                </div>
            </div>
      )}

      <CustomerPanel 
        order={order}
        customers={customers}
        onUpdateCustomer={onUpdateCustomer}
        onCustomerCreated={onCustomerCreated}
      />


      <div className="flex-1 min-h-0">
        {cart.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
            <p>Your cart is empty. Select a product to get started.</p>
          </div>
        ) : (
          <ScrollArea className="h-full max-h-[calc(100vh-570px)]">
            <div className="divide-y divide-border">
              {cart.map((item) => (
                <div key={item.uniqueId} className="p-4 flex gap-4">
                  <div className="flex-1 flex flex-col">
                    <span className="font-semibold">{item.product.variantName}</span>
                    <span className="text-muted-foreground text-sm">
                      {currencySymbol}{(item.product.price as number).toFixed(2)}
                    </span>
                    <Badge variant="outline" className="w-fit text-xs mt-1">
                        Batch: {item.batch.patch_code}
                    </Badge>
                    {item.itemDiscount && item.itemDiscount > 0 ? (
                        <span className="text-xs text-green-600">
                          Discount: -{currencySymbol}{(item.discountPerItem * item.quantity).toFixed(2)}
                        </span>
                      ) : null}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold">
                      {currencySymbol}{((item.product.price as number) * item.quantity).toFixed(2)}
                    </span>
                     <div className="flex items-center gap-2 mt-auto">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:bg-muted"
                            onClick={() => onUpdateQuantity(item.product.variant.id, item.batch.patch_code, item.quantity - 1)}
                        >
                            <MinusCircle className="h-4 w-4" />
                        </Button>
                        <span className="font-bold w-6 text-center">{item.quantity}</span>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:bg-muted"
                            onClick={() => onUpdateQuantity(item.product.variant.id, item.batch.patch_code, item.quantity + 1)}
                        >
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <footer className="p-4 border-t border-border mt-auto space-y-3 shrink-0">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{currencySymbol}{orderTotals.subtotal.toFixed(2)}</span>
        </div>
         <div className="flex justify-between text-sm text-destructive">
          <span>Item Discounts</span>
          <span>-{currencySymbol}{orderTotals.itemDiscounts.toFixed(2)}</span>
        </div>
        
        {currentLocation?.service_charge_status === 'Enabled' && orderType === 'Dine-In' && (
             <div className="flex justify-between text-sm items-center">
                <Label htmlFor="service-charge-toggle" className="flex items-center gap-2 cursor-pointer">
                    <Switch
                        id="service-charge-toggle"
                        checked={isServiceChargeActive}
                        onCheckedChange={setIsServiceChargeActive}
                    />
                    Service Charge (10%)
                </Label>
                <span>{currencySymbol}{orderTotals.serviceCharge.toFixed(2)}</span>
            </div>
        )}
        {currentLocation?.tdl_status === 'Enabled' && (
             <div className="flex justify-between text-sm">
                <span>TDL (1%)</span>
                <span>{currencySymbol}{orderTotals.tdl.toFixed(2)}</span>
            </div>
        )}
         {currentLocation?.sscl_status === 'Enabled' && (
             <div className="flex justify-between text-sm">
                <span>SSCL (2.5%)</span>
                <span>{currencySymbol}{orderTotals.sscl.toFixed(2)}</span>
            </div>
        )}
         {currentLocation?.vat_status === 'Enabled' && (
             <div className="flex justify-between text-sm">
                <span>VAT (18%)</span>
                <span>{currencySymbol}{orderTotals.vat.toFixed(2)}</span>
            </div>
        )}

         <div className="flex justify-between text-sm text-destructive">
          <span>Order Discount</span>
          <span>-{currencySymbol}{discount.toFixed(2)} ({discountPercentage.toFixed(1)}%)</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>{currencySymbol}{orderTotals.total.toFixed(2)}</span>
        </div>
        
        {isStewardScreen ? (
             <Button variant="default" onClick={onHoldAndKitchen} disabled={cart.length === 0} className="w-full h-16 text-lg">
                <Send className="mr-2 h-5 w-5" /> Send to POS
            </Button>
        ) : (
            <>
                <div className="grid grid-cols-2 gap-2 pt-2">
                    <Dialog open={isDiscountOpen} onOpenChange={setDiscountOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="h-12">
                        <TicketPercent className="mr-2 h-4 w-4" /> Order Discount
                        </Button>
                    </DialogTrigger>
                    <DiscountDialog setDiscount={setDiscount} orderSubtotal={orderTotals.subtotal} onClose={() => setDiscountOpen(false)} />
                    </Dialog>
                    <Button variant="outline" onClick={onHoldAndKitchen} disabled={cart.length === 0} className="h-12">
                        <Notebook className="mr-2 h-4 w-4" /> Hold
                    </Button>
                    <Button variant="secondary" onClick={handleGuestReceipt} disabled={!order.originalInvoiceNumber} className="h-12">
                        <Receipt className="mr-2 h-4 w-4" /> Guest Receipt
                    </Button>
                    <Button variant="destructive" onClick={() => onClearCart(orderId)} disabled={cart.length === 0} className="h-12">
                        <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
                    </Button>
                </div>
                <Dialog open={isPaymentOpen} onOpenChange={setPaymentOpen}>
                    <DialogTrigger asChild>
                        <Button
                        className="w-full h-16 text-lg bg-green-600 hover:bg-green-700 text-white"
                        disabled={cart.length === 0}
                        >
                        <CreditCard className="mr-2 h-5 w-5" /> Proceed to Payment
                        </Button>
                    </DialogTrigger>
                    <PaymentDialog
                        orderTotals={orderTotals}
                        onSuccessfulPayment={handleSuccessfulPayment}
                        paymentMethods={paymentMethods}
                    />
                </Dialog>
            </>
        )}
      </footer>
    </div>
  );
}
