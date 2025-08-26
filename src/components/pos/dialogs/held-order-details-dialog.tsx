
'use client';

import React from 'react';
import type { Invoice, User } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface HeldOrderDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  heldOrder: Invoice | null;
  customers: User[];
  posProducts: any[];
  onLoadOrder: (invoice: Invoice) => void;
}

export function HeldOrderDetailsDialog({
  isOpen,
  onOpenChange,
  isLoading,
  heldOrder,
  customers,
  posProducts,
  onLoadOrder,
}: HeldOrderDetailsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Held Order Details</DialogTitle>
          <DialogDescription>
            Review the details of the held order before loading it.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : heldOrder ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Invoice #</p>
                <p className="font-semibold">{heldOrder.invoice_number}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-semibold">
                  {customers.find((c) => c.customer_id === heldOrder.customer_code)?.name}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-semibold">
                  {format(new Date(heldOrder.invoice_date), 'PPP')}
                </p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {heldOrder.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {posProducts.find((p) => p.id === String(item.product_id))?.name}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      LKR{' '}
                      {(
                        parseFloat(item.item_price as string) *
                        parseFloat(item.quantity as string)
                      ).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="text-right font-bold">
                    Grand Total
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    LKR {parseFloat(heldOrder.grand_total).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        ) : (
          <p>Could not load order details.</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => heldOrder && onLoadOrder(heldOrder)} disabled={!heldOrder}>
            Load This Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
