

'use client';

import React from 'react';
import type { Invoice, User, PosProduct } from '@/lib/types';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { ProductPickerDialog } from '@/components/product-picker-dialog';
import { fetcher } from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';

export type ReturnItem = {
    id: string;
    name: string;
    unit: string;
    rate: number;
    quantity: number;
    originalQuantity: number;
    amount: number;
    reason: string;
    productId: string;
    productVariantId: string;
};

interface ReturnDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  returnType: 'invoice' | 'manual';
  setReturnType: (type: 'invoice' | 'manual') => void;
  customers: User[];
  selectedCustomer: string | null;
  setSelectedCustomer: (id: string | null) => void;
  pastInvoices: Invoice[];
  isLoadingPastInvoices: boolean;
  handleInvoiceSelect: (invoice: Invoice) => void;
  returnReason: string;
  setReturnReason: (reason: string) => void;
  returnItems: ReturnItem[];
  setReturnItems: React.Dispatch<React.SetStateAction<ReturnItem[]>>;
  isSubmittingReturn: boolean;
  handleProcessReturn: () => void;
}

export function ReturnDialog({
  isOpen,
  onOpenChange,
  returnType,
  setReturnType,
  customers,
  selectedCustomer,
  setSelectedCustomer,
  pastInvoices,
  isLoadingPastInvoices,
  handleInvoiceSelect,
  returnReason,
  setReturnReason,
  returnItems,
  setReturnItems,
  isSubmittingReturn,
  handleProcessReturn,
}: ReturnDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Process a Return</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={returnType} onValueChange={(v) => setReturnType(v as 'invoice' | 'manual')} className="flex gap-4">
            <div>
              <RadioGroupItem value="invoice" id="r-invoice" />
              <Label htmlFor="r-invoice" className="ml-2">Return with Invoice</Label>
            </div>
            <div>
              <RadioGroupItem value="manual" id="r-manual" />
              <Label htmlFor="r-manual" className="ml-2">Manual Return</Label>
            </div>
          </RadioGroup>

          {!selectedCustomer ? (
            <Select onValueChange={setSelectedCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="Select a customer..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <>
              <div className="flex justify-between items-center bg-muted p-2 rounded-md">
                <p>
                  Customer: <span className="font-semibold">{customers.find((c) => c.id === selectedCustomer)?.name}</span>
                </p>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                  Change
                </Button>
              </div>

              {returnType === 'invoice' ? (
                <Select
                  onValueChange={(invNumber) => handleInvoiceSelect(pastInvoices.find((i) => i.invoice_number === invNumber)!)}
                  disabled={isLoadingPastInvoices}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Invoice to Return From" />
                  </SelectTrigger>
                  <SelectContent>
                    {pastInvoices.map((inv) => (
                      <SelectItem key={inv.id} value={inv.invoice_number}>
                        {inv.invoice_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <ProductPickerDialog
                  onProductsSelected={(products) => {
                    const newItems = products.map((p) => ({
                      id: p.variant.id,
                      name: p.variantName,
                      unit: p.stock_unit || 'Nos',
                      rate: p.price as number,
                      quantity: 1,
                      originalQuantity: 999, // For manual returns, no original limit
                      amount: p.price as number,
                      reason: '',
                      productId: p.id,
                      productVariantId: p.variant.id,
                    }));
                    setReturnItems(newItems);
                  }}
                >
                  <Button variant="outline">Add Products to Return</Button>
                </ProductPickerDialog>
              )}

              <Textarea
                placeholder="General Reason for Return (Optional)"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
              />
              <ScrollArea className="h-64 border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Return Qty</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingPastInvoices ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        </TableCell>
                      </TableRow>
                    ) : returnItems.length > 0 ? (
                      returnItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQty = parseInt(e.target.value) || 0;
                                setReturnItems((prev) =>
                                  prev.map((p, i) =>
                                    i === index
                                      ? { ...p, quantity: Math.min(newQty, item.originalQuantity), amount: Math.min(newQty, item.originalQuantity) * p.rate }
                                      : p
                                  )
                                )
                              }}
                              className="w-24"
                              max={item.originalQuantity}
                            />
                            <p className="text-xs text-muted-foreground">Max: {item.originalQuantity}</p>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.reason}
                              onChange={(e) =>
                                setReturnItems((prev) =>
                                  prev.map((p, i) => (i === index ? { ...p, reason: e.target.value } : p))
                                )
                              }
                              placeholder="Item-specific reason"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Select an invoice or add products manually.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleProcessReturn} disabled={returnItems.filter(item => item.quantity > 0).length === 0 || isSubmittingReturn}>
            {isSubmittingReturn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Process Return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
