
'use client';

import React from 'react';
import type { TransactionReturn, User, StockEntry } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, RefreshCcw, X } from 'lucide-react';
import { format } from 'date-fns';

interface RefundDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  customers: User[];
  transactionReturns: TransactionReturn[];
  selectedReturn: TransactionReturn | null;
  setSelectedReturn: (ret: TransactionReturn | null) => void;
  handleReturnSelect: (ret: TransactionReturn) => void;
  refundQuantities: Record<string, number>;
  setRefundQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  isSubmitting: boolean;
  handleRefund: () => void;
}

export function RefundDialog({
  isOpen,
  onOpenChange,
  isLoading,
  customers,
  transactionReturns,
  selectedReturn,
  setSelectedReturn,
  handleReturnSelect,
  refundQuantities,
  setRefundQuantities,
  isSubmitting,
  handleRefund,
}: RefundDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-4">
            {selectedReturn && (
              <Button variant="ghost" onClick={() => setSelectedReturn(null)}>
                <ArrowLeft className="h-5 w-5 mr-2" /> Back
              </Button>
            )}
            <img src="https://i.imgur.com/kS4S17L.png" alt="Payshia POS" className="h-8" />
            <div className="text-left">
              <DialogTitle className="text-2xl">
                {selectedReturn ? 'Refund Confirmation' : 'Select Return to Make Refund'}
              </DialogTitle>
              {!selectedReturn && (
                <DialogDescription>Note: A La Carte Items cannot be Returned of Refunded!</DialogDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <RefreshCcw className="h-5 w-5" />
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        {selectedReturn ? (
          <div className="grid grid-cols-2 gap-8 p-6 flex-1 overflow-y-auto">
            <div>
              <Badge>
                {customers.find((c) => c.customer_id === selectedReturn.customer_id)?.name || 'Walk-in'}
              </Badge>
              <p className="text-2xl font-bold mt-1">{selectedReturn.rtn_number}</p>
              <p className="text-4xl font-bold text-green-600">
                LKR {parseFloat(selectedReturn.return_amount).toFixed(2)}
              </p>
              <Badge variant="secondary" className="mt-1 text-sm font-normal">
                {format(new Date(selectedReturn.created_at), 'yyyy-MM-dd HH:mm')}
              </Badge>
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-24">Return Qty</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedReturn.stock_entries?.map((item: StockEntry) => {
                    const maxQty = parseFloat(item.quantity);
                    const itemPrice = item.product ? parseFloat(item.product.price as string) : 0;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.product ? item.product.name : 'Product not found'}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={refundQuantities[item.id] || ''}
                            onChange={(e) => {
                              const newQty = Math.min(parseFloat(e.target.value) || 0, maxQty);
                              setRefundQuantities((prev) => ({ ...prev, [item.id]: newQty }));
                            }}
                            max={maxQty}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          LKR {(itemPrice * (refundQuantities[item.id] || 0)).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  }) || (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No item details available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="bg-muted/50 p-6 rounded-lg flex flex-col justify-center">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center">Enter PIN</h3>
                <Input
                  type="password"
                  placeholder="****"
                  className="h-12 text-center text-2xl tracking-widest"
                />
                <Button onClick={handleRefund} disabled={isSubmitting} className="w-full h-12 text-lg">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Refund
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 -mx-6 px-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 py-4">
                {transactionReturns.map((ret) => {
                  const customer = customers.find((c) => c.customer_id === ret.customer_id);
                  return (
                    <Card
                      key={ret.id}
                      className="cursor-pointer hover:border-primary p-2"
                      onClick={() => handleReturnSelect(ret)}
                    >
                      <CardHeader className="p-2">
                        <Badge className="w-fit mb-1 text-xs">{customer?.name || 'Walk-in'}</Badge>
                        <CardTitle className="text-sm">{ret.rtn_number}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-2">
                        <p className="text-xl font-bold">LKR {parseFloat(ret.return_amount).toFixed(2)}</p>
                        <Badge variant="secondary" className="mt-1 text-xs font-normal">
                          {format(new Date(ret.created_at), 'yyyy-MM-dd HH:mm')}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
