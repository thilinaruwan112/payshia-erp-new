
'use client';

import React, { useState, useEffect } from 'react';
import type { Invoice, User } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/components/location-provider';
import { useCurrency } from '@/components/currency-provider';
import { fetcher } from '@/lib/api';

interface BalanceDetails {
    grand_total: string;
    total_paid_amount: string;
    balance: number;
}

interface PendingInvoicesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customers: User[];
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

export function PendingInvoicesDialog({ isOpen, onOpenChange, customers }: PendingInvoicesDialogProps) {
  const { toast } = useToast();
  const { company_id, currentLocation } = useLocation();
  const { currencySymbol } = useCurrency();
  const [currentCashier, setCurrentCashier] = React.useState<User | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [pastInvoices, setPastInvoices] = useState<Invoice[]>([]);
  const [isLoadingPastInvoices, setIsLoadingPastInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [balanceDetails, setBalanceDetails] = useState<BalanceDetails | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  
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
    async function fetchInvoicesForAction() {
      if (!selectedCustomer || !company_id) {
        setPastInvoices([]);
        return;
      }
      setIsLoadingPastInvoices(true);
      try {
        const response = await fetcher(`https://server-erp.payshia.com/invoices/filter/pending?company_id=${company_id}&customer_code=${selectedCustomer}`);
        if (!response.ok) throw new Error('Failed to fetch invoices');
        const data: Invoice[] = await response.json();
        setPastInvoices(data || []);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch invoices for this customer.' });
        setPastInvoices([]);
      } finally {
        setIsLoadingPastInvoices(false);
      }
    }
    if (isOpen) {
      fetchInvoicesForAction();
    }
  }, [selectedCustomer, toast, isOpen, company_id]);

  const handleInvoiceSelect = async (invoice: Invoice) => {
    if (!company_id || !selectedCustomer) return;
    setSelectedInvoice(invoice);
    setIsLoadingBalance(true);
    try {
      const balanceResponse = await fetcher(`https://server-erp.payshia.com/invoices/balance?company_id=${company_id}&customer_id=${selectedCustomer}&ref_id=${invoice.invoice_number}`);
      if (!balanceResponse.ok) {
        throw new Error('Failed to fetch invoice balance.');
      }
      const balanceData: BalanceDetails = await balanceResponse.json();

      setBalanceDetails(balanceData);
      setPaymentAmount(balanceData.balance > 0 ? balanceData.balance.toFixed(2) : '0.00');

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch invoice balance details.' });
      setBalanceDetails(null);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleCreateReceipt = async () => {
    if (!selectedInvoice || !currentLocation || !company_id || !currentCashier) {
      toast({ variant: 'destructive', title: 'Missing Information' });
      return;
    }
    setIsSubmittingPayment(true);
    const payload = {
        type: paymentMethod === 'Cash' ? '0' : paymentMethod === 'Card' ? '1' : '2',
        is_active: 1, date: format(new Date(), 'yyyy-MM-dd'),
        amount: parseFloat(paymentAmount), created_by: parseInt(currentCashier.customer_id, 10),
        ref_id: selectedInvoice.invoice_number, location_id: parseInt(currentLocation.location_id, 10),
        customer_id: parseInt(selectedInvoice.customer_code, 10), today_invoice: selectedInvoice.invoice_number,
        company_id: company_id,
    };
    try {
        const response = await fetcher('https://server-erp.payshia.com/receipts', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to create receipt.");
        }
        toast({ title: 'Receipt Created!', description: `Payment of ${currencySymbol}${paymentAmount} recorded successfully.` });
        onOpenChange(false);
        setSelectedInvoice(null);
        setPaymentAmount('');
        setSelectedCustomer(null);
    } catch (error) {
         const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
         toast({ variant: 'destructive', title: 'Error Creating Receipt', description: errorMessage });
    } finally {
        setIsSubmittingPayment(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Pending Invoices</DialogTitle>
          <DialogDescription>Settle outstanding balances for a customer.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Select onValueChange={setSelectedCustomer} value={selectedCustomer || ''}>
            <SelectTrigger><SelectValue placeholder="Select a customer..." /></SelectTrigger>
            <SelectContent>{customers.map((c) => <SelectItem key={c.customer_id} value={c.customer_id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          {isLoadingPastInvoices ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : pastInvoices.length > 0 ? (
            <RadioGroup onValueChange={(invoiceNumber) => handleInvoiceSelect(pastInvoices.find((i) => i.invoice_number === invoiceNumber)!)} value={selectedInvoice?.invoice_number}>
              {pastInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={invoice.invoice_number} id={invoice.id} />
                  <Label htmlFor={invoice.id} className="flex justify-between w-full">
                    <span>{invoice.invoice_number} ({format(new Date(invoice.invoice_date), 'dd/MM/yy')})</span>
                    <span>{currencySymbol}{parseFloat(invoice.grand_total).toFixed(2)}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : selectedCustomer && <p className="text-center text-muted-foreground text-sm">No pending invoices for this customer.</p>}

          {selectedInvoice && (
            <Card>
              <CardContent className="pt-4 space-y-4">
                {isLoadingBalance ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : balanceDetails && (
                  <div className="text-center bg-muted p-4 rounded-md">
                    <p className="text-muted-foreground">Balance Due</p>
                    <p className="text-3xl font-bold">{currencySymbol}{balanceDetails.balance.toFixed(2)}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor='payment-method'>Payment Method</Label>
                  <Select onValueChange={setPaymentMethod} defaultValue={paymentMethod}>
                    <SelectTrigger id='payment-method'><SelectValue placeholder="Payment Method" /></SelectTrigger>
                    <SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Card">Card</SelectItem></SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor='payment-amount'>Amount</Label>
                  <Input id='payment-amount' placeholder="Amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                 </div>
              </CardContent>
            </Card>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreateReceipt} disabled={isLoadingBalance || !selectedInvoice || isSubmittingPayment}>
            {isSubmittingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
