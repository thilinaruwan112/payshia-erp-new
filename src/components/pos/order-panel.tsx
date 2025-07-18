
'use client';

import React from 'react';
import type { CartItem, OrderInfo } from '@/app/(pos)/pos-system/page';
import type { User } from '@/lib/types';
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
} from '@/components/ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface OrderPanelProps {
  cart: CartItem[];
  orderTotals: OrderInfo;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onHoldOrder: () => void;
  onSendToKitchen: () => void;
  isDrawer?: boolean;
  onClose?: () => void;
  discount: number;
  setDiscount: (discount: number) => void;
  customer: User;
  orderName: string;
}

const PaymentDialog = ({
  orderTotals,
  onSuccessfulPayment,
}: {
  orderTotals: OrderInfo;
  onSuccessfulPayment: () => void;
}) => {
  const [amountTendered, setAmountTendered] = React.useState('');
  const change = Number(amountTendered) - orderTotals.total;

  const handlePayment = (paymentMethod: string) => {
    onSuccessfulPayment();
  };

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
            onClick={() => handlePayment('Cash')}
          >
            Cash
          </Button>
          <Button
            variant="outline"
            className="h-20 text-lg"
            onClick={() => handlePayment('Card')}
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
          onClick={() => handlePayment('Cash')}
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

export function OrderPanel({
  cart,
  orderTotals,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onHoldOrder,
  onSendToKitchen,
  isDrawer,
  onClose,
  discount,
  setDiscount,
  customer,
  orderName,
}: OrderPanelProps) {
  const { toast } = useToast();
  const [isPaymentOpen, setPaymentOpen] = React.useState(false);
  const [isDiscountOpen, setDiscountOpen] = React.useState(false);

  const handleSuccessfulPayment = () => {
    toast({
      title: 'Payment Successful',
      description: `Charged $${orderTotals.total.toFixed(2)}.`,
    });
    setPaymentOpen(false);
    onClearCart();
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <header className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-xl font-bold">{orderName}</h2>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
                <UserPlus className="h-5 w-5" />
            </Button>
             {isDrawer && (
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5" />
                </Button>
            )}
        </div>
      </header>

      <div className='p-4 border-b border-border'>
        <div className='flex items-center gap-3'>
            <Avatar className='h-12 w-12'>
                <AvatarImage src={customer.avatar} alt={customer.name} data-ai-hint="profile picture" />
                <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <p className='font-semibold'>{customer.name}</p>
                <p className='text-xs text-muted-foreground'>{customer.role}</p>
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
                <div key={item.product.id} className="p-4 flex gap-4">
                  <Image
                    src={`https://placehold.co/64x64.png`}
                    alt={item.product.name}
                    width={64}
                    height={64}
                    className="rounded-md object-cover"
                    data-ai-hint="product photo"
                  />
                  <div className="flex-1 flex flex-col">
                    <span className="font-semibold">{item.product.name}</span>
                    <span className="text-muted-foreground text-sm">
                      ${item.product.price.toFixed(2)}
                    </span>
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
                          onUpdateQuantity(item.product.id, item.quantity - 1)
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
                          onUpdateQuantity(item.product.id, item.quantity + 1)
                        }
                      >
                        <PlusCircle className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 mt-auto text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveItem(item.product.id)}
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
        <div className="flex justify-between text-sm">
          <span>Tax ({(0.08 * 100).toFixed(0)}%)</span>
          <span>${orderTotals.tax.toFixed(2)}</span>
        </div>
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
            <Button
              variant="outline"
              onClick={onSendToKitchen}
              className="col-span-2 h-12"
              disabled={cart.length === 0}
            >
              <ChefHat className="mr-2 h-4 w-4" /> Send KOT/BOT
            </Button>
        </div>
        <Dialog open={isPaymentOpen} onOpenChange={setPaymentOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full h-16 text-lg bg-green-600 hover:bg-green-700 text-white"
              disabled={cart.length === 0}
            >
              <CreditCard className="mr-2 h-5 w-5" /> Pay
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
