
'use client';

import React, { useState } from 'react';
import type { CartItem, OrderInfo, ActiveOrder, StockInfo } from '@/app/(pos)/pos-system/page';
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
  UserPlus,
  Trash2,
  ChefHat,
  Notebook,
  PlusSquare,
  Star,
  UserCheck,
  Settings,
  Receipt,
  Delete,
} from 'lucide-react';
import Image from 'next/image';
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
} from '@/components/ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { CustomerFormDialog } from '../customer-form-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Switch } from '../ui/switch';
import { format } from 'date-fns';
import { useLocation } from '../location-provider';
import { Badge } from '../ui/badge';
import { useCurrency } from '../currency-provider';
import { fetcher } from '@/lib/api';
import { openCenteredPopup } from '@/lib/utils';

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
  customers: Customer[];
  onUpdateCustomer: (orderId: string, customer: Customer) => void;
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


const PaymentDialog = ({
  orderTotals,
  onSuccessfulPayment,
  paymentMethods,
}: {
  orderTotals: OrderInfo;
  onSuccessfulPayment: (paymentMethod: string, tenderedAmount: number) => void;
  paymentMethods: PaymentMethod[];
}) => {
  const { currencySymbol } = useCurrency();
  const [amountTendered, setAmountTendered] = React.useState('');
  const [selectedMethodId, setSelectedMethodId] = React.useState<string | null>(paymentMethods.length > 0 ? paymentMethods[0].id : null);
  const change = Number(amountTendered) - orderTotals.total;

  const handleConfirm = () => {
    if (selectedMethodId) {
      onSuccessfulPayment(selectedMethodId, Number(amountTendered) || orderTotals.total);
    }
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
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Complete Payment</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Due</p>
                <p className="text-4xl font-bold">{currencySymbol}{orderTotals.total.toFixed(2)}</p>
            </div>
             <div className="grid grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                    <Button
                    key={method.id}
                    variant={selectedMethodId === method.id ? 'default' : 'outline'}
                    className="h-20 text-lg"
                    onClick={() => setSelectedMethodId(method.id)}
                    >
                    {method.method}
                    </Button>
                ))}
            </div>
             <div className="grid grid-cols-2 gap-4">
                <Button variant="secondary" className="h-16" onClick={() => setAmountTendered(orderTotals.total.toFixed(2))}>
                    Exact Amount
                </Button>
                <Button variant="secondary" className="h-16" onClick={() => setAmountTendered(String(quickCashAmount))}>
                    {currencySymbol}{quickCashAmount}
                </Button>
            </div>
             {Number(amountTendered) > 0 && (
                <div className="text-center font-medium text-lg pt-2">
                    <p className="text-muted-foreground">Change Due</p>
                    <p className="text-2xl font-bold">{currencySymbol}{change > 0 ? change.toFixed(2) : '0.00'}</p>
                </div>
            )}
        </div>
        <div className="space-y-4">
             <div>
                <Label htmlFor="amount-tendered">Amount Tendered</Label>
                <Input
                    id="amount-tendered"
                    type="number"
                    placeholder="0.00"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="h-16 text-3xl text-right"
                />
            </div>
            <div className="grid grid-cols-3 gap-2">
                {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(val => (
                    <Button key={val} variant="outline" className="h-16 text-2xl" onClick={() => handleNumpadClick(val)}>{val}</Button>
                ))}
                <Button variant="outline" className="h-16 text-2xl" onClick={() => handleNumpadClick('.')}>.</Button>
                <Button variant="outline" className="h-16 text-2xl" onClick={() => handleNumpadClick('0')}>0</Button>
                <Button variant="outline" className="h-16 text-2xl" onClick={() => handleNumpadClick('<-')}><Delete /></Button>
            </div>
        </div>
      </div>
      <DialogFooter className="mt-4">
        <Button variant="outline" size="lg" onClick={() => {
            const dialog = document.querySelector('[role="dialog"]');
            if (dialog) {
                const closeButton = dialog.querySelector('button[aria-label="Close"]');
                if (closeButton instanceof HTMLElement) {
                    closeButton.click();
                }
            }
        }}>Cancel</Button>
        <Button
          size="lg"
          onClick={handleConfirm}
          disabled={!selectedMethodId || !amountTendered || change < 0}
          className="h-16 text-lg"
        >
          Confirm Payment
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

const DiscountDialog = ({
  setDiscount,
  onClose,
}: {
  setDiscount: (d: number) => void;
  onClose: () => void;
}) => {
  const { currencySymbol } = useCurrency();
  const [discountValue, setDiscountValue] = React.useState('');

  const applyDiscount = () => {
    setDiscount(Number(discountValue));
    onClose();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Apply Order Discount</DialogTitle>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="discount-value">Discount Amount ({currencySymbol})</Label>
        <Input
          id="discount-value"
          type="number"
          placeholder="e.g. 5.00"
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={applyDiscount}>Apply</Button>
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

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Order Details</DialogTitle>
                <DialogDescription>Change the order type, table, or assigned steward.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                 <div className="space-y-2">
                    <Label>Order Type</Label>
                    <RadioGroup value={orderType} onValueChange={(value) => setOrderType(value as ActiveOrder['orderType'])}>
                        <div className="flex items-center space-x-4">
                           <div className="flex items-center space-x-2"><RadioGroupItem value="Take Away" id="r-takeaway" /><Label htmlFor="r-takeaway">Take Away</Label></div>
                           <div className="flex items-center space-x-2"><RadioGroupItem value="Delivery" id="r-delivery" /><Label htmlFor="r-delivery">Delivery</Label></div>
                           <div className="flex items-center space-x-2"><RadioGroupItem value="Dine-In" id="r-dinein" /><Label htmlFor="r-dinein">Dine-In</Label></div>
                        </div>
                    </RadioGroup>
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
}: OrderPanelProps) {
  const { toast } = useToast();
  const { company_id } = useLocation();
  const { currencySymbol } = useCurrency();
  const [isPaymentOpen, setPaymentOpen] = React.useState(false);
  const [isDiscountOpen, setDiscountOpen] = React.useState(false);
  const [isEditOrderOpen, setEditOrderOpen] = React.useState(false);

  const { cart, customer, name: orderName, discount, serviceCharge, id: orderId, steward, orderType, tableName } = order;

  const handleSuccessfulPayment = async (paymentMethodId: string, tenderedAmount: number) => {
    toast({
      title: 'Payment Processing...',
      description: `Processing ${currencySymbol}${orderTotals.total.toFixed(2)}.`,
    });

    if (!currentLocation || !company_id || !customer) {
        toast({
            variant: "destructive",
            title: "Location, Company, or Customer not selected",
            description: "Please select all required fields."
        });
        return;
    }
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
        discount_percentage: orderTotals.subtotal > 0 ? (totalDiscount / orderTotals.subtotal) * 100 : 0,
        customer_code: customer.customer_id,
        service_charge: orderTotals.serviceCharge,
        tdl: orderTotals.tdl,
        sscl_tax: orderTotals.sscl,
        vat_amount: orderTotals.vat,
        tendered_amount: tenderedAmount,
        close_type: paymentMethodId,
        invoice_status: '1', // Paid
        payment_status: "Paid",
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
            item_discount: item.itemDiscount || 0,
            quantity: item.quantity,
            customer_id: parseInt(customer.customer_id, 10),
            table_id: tableIdValue,
            cost_price: item.product.cost_price || 0,
            is_active: 1,
            hold_status: 0,
            printed_status: 1,
            product_variant_id: parseInt(item.product.variant.id, 10),
            expire_date: item.batch.expire_date,
            company_id: company_id,
        }))
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
        onClearCart(orderId);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: "destructive",
            title: "Payment Failed",
            description: errorMessage,
        });
    }
  };
  
  const handleCustomerCreated = (newCustomer: User) => {
    onUpdateCustomer(orderId, newCustomer);
  }

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

  return (
    <div className="flex flex-col h-full bg-card">
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
                    <UserCheck className="h-4 w-4" />
                    <span>Steward: <span className="font-semibold text-foreground">{steward.user_name}</span></span>
                </div>
            </div>
      )}

      <div className='p-4 border-b border-border'>
        <div className='flex items-center gap-3'>
            <div className="flex-1">
                <Select
                  value={customer?.customer_id || ''}
                  onValueChange={(customerId) => {
                    const newCustomer = customers.find(
                      (c) => c.id === customerId
                    );
                    if (newCustomer) onUpdateCustomer(orderId, newCustomer);
                  }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                        {customers.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <CustomerFormDialog onCustomerCreated={(c) => onUpdateCustomer(orderId, c)}>
                 <Button variant="outline" size="icon">
                    <UserPlus className="h-5 w-5" />
                </Button>
            </CustomerFormDialog>
        </div>
         <div className='flex items-center justify-between mt-2 text-sm'>
            <p className="text-muted-foreground">Loyalty Points</p>
             <div className='flex items-center gap-1.5 text-yellow-500'>
                <Star className='h-4 w-4' />
                <span className='font-bold'>{customer?.loyaltyPoints || 0}</span>
            </div>
        </div>
      </div>

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
                  <Image
                    src={item.product.imageUrl || `https://placehold.co/64x64.png`}
                    alt={item.product.name}
                    width={64}
                    height={64}
                    className="rounded-md object-cover"
                    data-ai-hint="product photo"
                  />
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
                          Discount: -{currencySymbol}{item.itemDiscount.toFixed(2)}
                        </span>
                      ) : null}
                    <div className="mt-auto">
                        <span className="text-lg font-bold">{item.quantity}</span>
                        <span className="text-sm text-muted-foreground ml-1">
                            {item.product.stock_unit || 'Nos'}
                        </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold">
                      {currencySymbol}{((item.product.price as number) * item.quantity).toFixed(2)}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 mt-auto text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveItem(item.uniqueId!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
         <div className="flex justify-between text-sm text-green-600">
          <span>Item Discounts</span>
          <span>-{currencySymbol}{orderTotals.itemDiscounts.toFixed(2)}</span>
        </div>
        
        {isServiceChargeActive ? (
            <>
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
                <div className="pl-8 text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                        <span>TDL (1%)</span>
                        <span>{currencySymbol}{orderTotals.tdl.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>SSCL (2.5%)</span>
                        <span>{currencySymbol}{orderTotals.sscl.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>VAT (18%)</span>
                        <span>{currencySymbol}{orderTotals.vat.toFixed(2)}</span>
                    </div>
                </div>
            </>
        ) : (
             <div className="flex justify-between text-sm items-center">
                <Label htmlFor="service-charge-toggle" className="flex items-center gap-2 cursor-pointer">
                    <Switch
                        id="service-charge-toggle"
                        checked={isServiceChargeActive}
                        onCheckedChange={setIsServiceChargeActive}
                    />
                    Taxes &amp; Charges
                </Label>
                <span>{currencySymbol}{(orderTotals.serviceCharge + orderTotals.tdl + orderTotals.sscl + orderTotals.vat).toFixed(2)}</span>
            </div>
        )}

         <div className="flex justify-between text-sm text-green-600">
          <span>Order Discount</span>
          <span>-{currencySymbol}{discount.toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>{currencySymbol}{orderTotals.total.toFixed(2)}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 pt-2">
             <Dialog open={isDiscountOpen} onOpenChange={setDiscountOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-12">
                  <TicketPercent className="mr-2 h-4 w-4" /> Order Discount
                </Button>
              </DialogTrigger>
              <DiscountDialog setDiscount={setDiscount} onClose={() => setDiscountOpen(false)} />
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
      </footer>
    </div>
  );
}
