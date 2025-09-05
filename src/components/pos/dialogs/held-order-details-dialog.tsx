
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLocation } from '@/components/location-provider';

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
  const { company_id } = useLocation();

  React.useEffect(() => {
    async function fetchHeldOrders() {
      if (!isOpen || !company_id) return;
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://server-erp.payshia.com/invoices/filter/hold/by-company-status?company_id=${company_id}&invoice_status=2`
        );
        if (!response.ok) throw new Error('Failed to fetch held orders');
        const data: Invoice[] = await response.json();
        setHeldOrders(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHeldOrders();
  }, [isOpen, company_id]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl flex flex-col h-[80vh]">
        <DialogHeader>
          <DialogTitle>Held Orders</DialogTitle>
          <DialogDescription>
            Select a held order to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 relative -mx-6 px-6">
          <ScrollArea className="absolute inset-0 h-full w-full">
            <div className="px-1 py-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : heldOrders.length > 0 ? (
                <>
                  {/* Desktop Table View */}
                  <Table className="hidden md:table">
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
                          <TableCell>
                            {customers.find((c) => c.customer_id === order.customer_code)?.name ||
                              'Walk-in'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(order.invoice_date), 'dd/MM/yy')}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ${parseFloat(order.grand_total).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" onClick={() => onLoadOrder(order)}>
                              Load
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {/* Mobile Card View */}
                  <div className="space-y-4 md:hidden p-1">
                    {heldOrders.map((order) => (
                        <Card key={order.id}>
                          <CardHeader>
                            <CardTitle className="text-base">{order.invoice_number}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Customer</span>
                                <span>{customers.find((c) => c.customer_id === order.customer_code)?.name || 'Walk-in'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Date</span>
                                <span>{format(new Date(order.invoice_date), 'dd/MM/yy')}</span>
                              </div>
                              <Separator />
                              <div className="flex justify-between font-bold">
                                <span>Amount</span>
                                <span className="font-mono">${parseFloat(order.grand_total).toFixed(2)}</span>
                              </div>
                          </CardContent>
                          <CardFooter>
                            <Button className="w-full" size="sm" onClick={() => onLoadOrder(order)}>
                                Load Order
                              </Button>
                          </CardFooter>
                        </Card>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground pt-10">
                  No orders are currently on hold.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
