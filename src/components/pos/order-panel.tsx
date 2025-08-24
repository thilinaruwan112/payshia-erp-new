

'use client';

import React from 'react';
import type { CartItem, OrderInfo, ActiveOrder, StockInfo } from '@/app/(pos)/pos-system/page';
import type { User, Table as TableType, Location } from '@/lib/types';
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

interface OrderPanelProps {
  order: ActiveOrder;
  orderTotals: OrderInfo;
  cashierName: string;
  currentLocation: Location | null;
  onUpdateQuantity: (variantId: string, batchCode: string, newQuantity: number) => void;
  onRemoveItem: (variantId: string, batchCode: string) => void;
  onClearCart: (invoiceId: string) => void;
  onHoldOrder: () => void;
  onSendToKitchen: () => void;
  isDrawer?: boolean;
  onClose?: () => void;
  setDiscount: (discount: number) => void;
  setServiceCharge: (serviceCharge: number) => void;
  onUpdateDetails: (orderId: string, newDetails: Partial<Pick<ActiveOrder, 'orderType' | 'tableName' | 'steward'>>) => void;
  availableTables: TableType[];
  availableStewards: User[];
  customers: User[];
  onUpdateCustomer: (orderId: string, customer: User) => void;
}

const PaymentDialog = ({
  orderTotals,
  onSuccessfulPayment,
}: {
  orderTotals: OrderInfo;
  onSuccessfulPayment: (paymentMethod: string, tenderedAmount: number) => void;
}) => {
  const [amountTendered, setAmountTendered] = React.useState('');
  const change = Number(amountTendered) - orderTotals.total;

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Complete Payment</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">Total Due</p>
          <p className="text-4xl font-bold">${orderTotals.total.toFixed(2)}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-20 text-lg"
            onClick={() => onSuccessfulPayment('Cash', orderTotals.total)}
          >
            Cash
          </Button>
          <Button
            variant="outline"
            className="h-20 text-lg"
            onClick={() => onSuccessfulPayment('Card', orderTotals.total)}
          >
            <CreditCard className="mr-2" /> Card
          </Button>
        </div>
        <div>
          <Label htmlFor="amount-tendered">Amount Tendered</Label>
          <Input
            id="amount-tendered"
            type="number"
            placeholder="0.00"
            value={amountTendered}
            onChange={(e) => setAmountTendered(e.target.value)}
          />
        </div>
        {Number(amountTendered) > 0 && (
          <div className="text-center font-medium">
            <p>Change: ${change > 0 ? change.toFixed(2) : '0.00'}</p>
          </div>
        )}
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button
          onClick={() => onSuccessfulPayment('Cash', Number(amountTendered))}
          disabled={!amountTendered || change < 0}
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
        <Label htmlFor="discount-value">Discount Amount ($)</Label>
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

const ServiceChargeDialog = ({
  currentValue,
  setServiceCharge,
  onClose,
}: {
  currentValue: number;
  setServiceCharge: (d: number) => void;
  onClose: () => void;
}) => {
  const [chargeValue, setChargeValue] = React.useState(currentValue.toString());

  const applyCharge = () => {
    setServiceCharge(Number(chargeValue));
    onClose();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Apply Service Charge</DialogTitle>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="charge-value">Service Charge Amount ($)</Label>
        <Input
          id="charge-value"
          type="number"
          placeholder="e.g. 10.00"
          value={chargeValue}
          onChange={(e) => setChargeValue(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={applyCharge}>Apply</Button>
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
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onHoldOrder: holdOrderCallback,
  onSendToKitchen,
  isDrawer,
  onClose,
  setDiscount,
  setServiceCharge,
  onUpdateDetails,
  availableTables,
  availableStewards,
  customers,
  onUpdateCustomer,
}: OrderPanelProps) {
  const { toast } = useToast();
  const { company_id } = useLocation();
  const [isPaymentOpen, setPaymentOpen] = React.useState(false);
  const [isDiscountOpen, setDiscountOpen] = React.useState(false);
  const [isServiceChargeOpen, setServiceChargeOpen] = React.useState(false);
  const [isEditOrderOpen, setEditOrderOpen] = React.useState(false);

  const { cart, customer, name: orderName, discount, serviceCharge, id: orderId, steward, orderType } = order;

  const createInvoicePayload = (status: '1' | '2', paymentMethod = 'N/A', tenderedAmount = 0) => {
    if (!currentLocation || !company_id) {
        toast({
            variant: "destructive",
            title: "Location or Company not selected",
            description: "Please select a location and ensure company is set."
        });
        return null;
    }
    const totalDiscount = orderTotals.discount + orderTotals.itemDiscounts;
    const costValue = cart.reduce((acc, item) => acc + ((item.product.costPrice as number) * item.quantity), 0);
    const refHoldValue = order.originalInvoiceNumber ? order.originalInvoiceNumber : "direct";

    return {
        invoice_date: format(new Date(), 'yyyy-MM-dd'),
        inv_amount: orderTotals.subtotal,
        grand_total: orderTotals.total,
        discount_amount: totalDiscount,
        discount_percentage: orderTotals.subtotal > 0 ? (totalDiscount / orderTotals.subtotal) * 100 : 0,
        customer_code: customer.customer_id,
        service_charge: orderTotals.serviceCharge,
        tendered_amount: tenderedAmount,
        close_type: paymentMethod,
        invoice_status: status,
        payment_status: status === '1' ? "Paid" : "Pending",
        current_time: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        location_id: parseInt(currentLocation.location_id, 10),
        table_id: 0,
        order_ready_status: 1,
        created_by: cashierName,
        is_active: 1,
        steward_id: steward?.id || "N/A",
        cost_value: costValue,
        remark: `${orderType} order`,
        ref_hold: status === '1' ? refHoldValue : null,
        company_id: company_id,
        chanel: "POS",
        items: cart.map(item => ({
            user_id: 1, // Default user_id as per example
            product_id: parseInt(item.product.id, 10),
            item_price: item.product.price,
            item_discount: item.itemDiscount || 0,
            quantity: item.quantity,
            customer_id: parseInt(customer.customer_id, 10),
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

  const handleSuccessfulPayment = async (paymentMethod: string, tenderedAmount: number) => {
    toast({
      title: 'Payment Processing...',
      description: `Processing $${orderTotals.total.toFixed(2)} via ${paymentMethod}.`,
    });

    const payload = createInvoicePayload('1', paymentMethod, tenderedAmount);
    if (!payload) return;

    try {
        const response = await fetch('https://server-erp.payshia.com/pos-invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        
        window.open(`/pos/invoice/${result.invoice_id}`, '_blank');
        
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

  const onHoldOrder = async () => {
    if (!order || cart.length === 0) {
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
        description: `${order.name} has been put on hold as Invoice #${result.invoice_number}.`,
      });
      onClearCart(orderId);
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
       toast({
        variant: 'destructive',
        title: 'Error Holding Order',
        description: errorMessage,
      });
    }
  };
  
  const handleCustomerCreated = (newCustomer: User) => {
    onUpdateCustomer(orderId, newCustomer);
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <header className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-xl font-bold">{orderName}</h2>
        <div className="flex items-center gap-1">
            <Dialog open={isEditOrderOpen} onOpenChange={setEditOrderOpen}>
                <DialogTrigger asChild>
                     <Button variant="ghost" size="icon">
                        <Settings className="h-5 w-5" />
                    </Button>
                </DialogTrigger>
                <EditOrderDialog 
                    order={order}
                    onUpdateDetails={onUpdateDetails}
                    availableTables={availableTables}
                    availableStewards={availableStewards}
                    onClose={() => setEditOrderOpen(false)}
                />
            </Dialog>
             {isDrawer && (
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5" />
                </Button>
            )}
        </div>
      </header>
      
      {steward && (
           <div className='p-2 px-4 border-b border-border bg-muted/30'>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserCheck className="h-4 w-4" />
                    <span>Steward: <span className="font-semibold text-foreground">{steward.name}</span></span>
                </div>
            </div>
      )}

      <div className='p-4 border-b border-border'>
        <div className='flex items-center gap-3'>
            <div className="flex-1">
                <Select value={customer.customer_id} onValueChange={(customerId) => {
                    const newCustomer = customers.find(c => c.customer_id === customerId);
                    if (newCustomer) onUpdateCustomer(orderId, newCustomer);
                }}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                        {customers.map(c => (
                            <SelectItem key={c.customer_id} value={c.customer_id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <CustomerFormDialog onCustomerCreated={handleCustomerCreated}>
                 <Button variant="outline" size="icon">
                    <UserPlus className="h-5 w-5" />
                </Button>
            </CustomerFormDialog>
        </div>
         <div className='flex items-center justify-between mt-2 text-sm'>
            <p className="text-muted-foreground">Loyalty Points</p>
             <div className='flex items-center gap-1.5 text-yellow-500'>
                <Star className='h-4 w-4' />
                <span className='font-bold'>{customer.loyaltyPoints || 0}</span>
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
                <div key={`${item.product.variant.id}-${item.batch.patch_code}`} className="p-4 flex gap-4">
                  <Image
                    src={`https://placehold.co/64x64.png`}
                    alt={item.product.name}
                    width={64}
                    height={64}
                    className="rounded-md object-cover"
                    data-ai-hint="product photo"
                  />
                  <div className="flex-1 flex flex-col">
                    <span className="font-semibold">{item.product.variantName}</span>
                    <span className="text-muted-foreground text-sm">
                      ${(item.product.price as number).toFixed(2)}
                    </span>
                    <Badge variant="outline" className="w-fit text-xs mt-1">
                        Batch: {item.batch.patch_code}
                    </Badge>
                    {item.itemDiscount && item.itemDiscount > 0 ? (
                        <span className="text-xs text-green-600">
                          Discount: -${item.itemDiscount.toFixed(2)}
                        </span>
                      ) : null}
                    <div className="flex items-center gap-2 mt-auto">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() =>
                          onUpdateQuantity(item.product.variant.id, item.batch.patch_code, item.quantity - 1)
                        }
                      >
                        <MinusCircle className="h-5 w-5" />
                      </Button>
                      <span className="w-8 text-center text-lg font-bold">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() =>
                          onUpdateQuantity(item.product.variant.id, item.batch.patch_code, item.quantity + 1)
                        }
                      >
                        <PlusCircle className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold">
                      ${((item.product.price as number) * item.quantity).toFixed(2)}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 mt-auto text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveItem(item.product.variant.id, item.batch.patch_code)}
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
          <span>${orderTotals.subtotal.toFixed(2)}</span>
        </div>
         <div className="flex justify-between text-sm text-green-600">
          <span>Item Discounts</span>
          <span>-${orderTotals.itemDiscounts.toFixed(2)}</span>
        </div>
        <Dialog open={isServiceChargeOpen} onOpenChange={setServiceChargeOpen}>
          <DialogTrigger asChild>
            <div className="flex justify-between items-center text-sm cursor-pointer hover:text-primary">
              <span className="flex items-center gap-2">
                <PlusSquare className="h-4 w-4" /> Service Charge
              </span>
              <span>${orderTotals.serviceCharge.toFixed(2)}</span>
            </div>
          </DialogTrigger>
          <ServiceChargeDialog
            currentValue={serviceCharge}
            setServiceCharge={setServiceCharge}
            onClose={() => setServiceChargeOpen(false)}
          />
        </Dialog>
         <div className="flex justify-between text-sm text-green-600">
          <span>Order Discount</span>
          <span>-${discount.toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>${orderTotals.total.toFixed(2)}</span>
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
             <Button variant="outline" onClick={onHoldOrder} disabled={cart.length === 0} className="h-12">
                <Notebook className="mr-2 h-4 w-4" /> Hold
            </Button>
             <Button variant="secondary" onClick={onSendToKitchen} disabled={cart.length === 0} className="h-12">
              <ChefHat className="mr-2 h-4 w-4" /> Send to Kitchen
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
            <CreditCard className="mr-2 h-5 w-5" /> Proceed
            </Button>
        </DialogTrigger>
        <PaymentDialog
            orderTotals={orderTotals}
            onSuccessfulPayment={handleSuccessfulPayment}
        />
        </Dialog>
      </footer>
    </div>
  );
}
