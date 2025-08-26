
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface HeldOrderDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customers: User[];
  onLoadOrder: (invoice: Invoice) => void;
}

export function HeldOrderDetailsDialog({
  isOpen,
  onOpenChange,
  customers,
  onLoadOrder,
}: HeldOrderDetailsDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [heldOrders, setHeldOrders] = React.useState<Invoice[]>([]);

  // This is a simplified fetch, a real app might need company_id
  React.useEffect(() => {
    async function fetchHeldOrders() {
        if (!isOpen) return;
        setIsLoading(true);
        try {
            const response = await fetch(`https://server-erp.payshia.com/invoices/filter/hold/by-company-status?company_id=1&invoice_status=2`);
            if (!response.ok) throw new Error('Failed to fetch held orders');
            const data: Invoice[] = await response.json();
            setHeldOrders(data || []);
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false);
        }
    }
    fetchHeldOrders();
  }, [isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Held Orders</DialogTitle>
          <DialogDescription>
            Select a held order to continue.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : heldOrders.length > 0 ? (
          <div className="space-y-4">
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {heldOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.invoice_number}</TableCell>
                    <TableCell>{customers.find(c => c.customer_id === order.customer_code)?.name || 'Walk-in'}</TableCell>
                    <TableCell>{format(new Date(order.invoice_date), 'dd/MM/yy')}</TableCell>
                    <TableCell className="text-right">${parseFloat(order.grand_total).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                        <Button size="sm" onClick={() => onLoadOrder(order)}>Load</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
             </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-10">No orders are currently on hold.</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
