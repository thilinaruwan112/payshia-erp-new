
'use client';

import React from 'react';
import type { Invoice, User } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface BalanceDetails {
    grand_total: string;
    total_paid_amount: string;
    balance: number;
    company_id: string;
    customer_id: string;
    ref_id: string;
}

interface PendingInvoicesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customers: User[];
  selectedCustomer: string | null;
  setSelectedCustomer: (id: string | null) => void;
  pastInvoices: Invoice[];
  isLoadingPastInvoices: boolean;
  selectedInvoice: Invoice | null;
  handleInvoiceSelect: (invoice: Invoice) => void;
  balanceDetails: BalanceDetails | null;
  isLoadingBalance: boolean;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  paymentAmount: string;
  setPaymentAmount: (amount: string) => void;
  isSubmittingPayment: boolean;
  handleCreateReceipt: () => void;
}

export function PendingInvoicesDialog({
  isOpen,
  onOpenChange,
  customers,
  selectedCustomer,
  setSelectedCustomer,
  pastInvoices,
  isLoadingPastInvoices,
  selectedInvoice,
  handleInvoiceSelect,
  balanceDetails,
  isLoadingBalance,
  paymentMethod,
  setPaymentMethod,
  paymentAmount,
  setPaymentAmount,
  isSubmittingPayment,
  handleCreateReceipt,
}: PendingInvoicesDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Pending Invoices</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select onValueChange={setSelectedCustomer} value={selectedCustomer || ''}>
            <SelectTrigger>
              <SelectValue placeholder="Select a customer..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.customer_id} value={c.customer_id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isLoadingPastInvoices ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          ) : (
            <RadioGroup
              onValueChange={(invoiceNumber) =>
                handleInvoiceSelect(pastInvoices.find((i) => i.invoice_number === invoiceNumber)!)
              }
              value={selectedInvoice?.invoice_number}
            >
              {pastInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={invoice.invoice_number} id={invoice.id} />
                  <Label htmlFor={invoice.id} className="flex justify-between w-full">
                    <span>
                      {invoice.invoice_number} ({format(new Date(invoice.invoice_date), 'dd/MM/yy')})
                    </span>
                    <span>LKR {parseFloat(invoice.grand_total).toFixed(2)}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
          {selectedInvoice && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <Select onValueChange={setPaymentMethod} defaultValue={paymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Payment Method" />
                    </SelectTrigger>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateReceipt}
            disabled={isLoadingBalance || !selectedInvoice || isSubmittingPayment}
          >
            {isSubmittingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
