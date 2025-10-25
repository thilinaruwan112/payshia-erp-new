
'use client';

import React, { useState, useEffect } from 'react';
import type { TransactionReturn, User, StockEntry } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, RefreshCcw, X } from 'lucide-react';
import { format } from 'date-fns';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/components/currency-provider';
import { fetcher } from '@/lib/api';
import { PayshiaPosLogo } from '../payshia-pos-logo';

interface RefundDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customers: User[];
}

export function RefundDialog({ isOpen, onOpenChange, customers }: RefundDialogProps) {
  const { company_id, currentLocation } = useLocation();
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  const [currentCashier, setCurrentCashier] = React.useState<User | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [transactionReturns, setTransactionReturns] = useState<TransactionReturn[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<TransactionReturn | null>(null);
  const [refundQuantities, setRefundQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    if (userId && userName) {
      setCurrentCashier({
        id: userId,
        customer_id: userId,
        user_name: userName,
        role: 'Cashier',
      });
    }
  }, []);

  useEffect(() => {
    async function fetchReturns() {
      if (!company_id) return;
      setIsLoading(true);
      try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/transaction-returns/filter/by-company?company_id=${company_id}`);
        if (!response.ok) throw new Error('Failed to fetch returns');
        const data: TransactionReturn[] = await response.json();
        setTransactionReturns(data || []);
      } catch (error) {
         toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch recent returns.' });
        setTransactionReturns([]);
      } finally {
        setIsLoading(false);
      }
    }
    if (isOpen && !selectedReturn) {
        fetchReturns();
    }
  }, [isOpen, selectedReturn, toast, company_id]);

  const handleReturnSelect = async (returnData: TransactionReturn) => {
    if (!company_id) return;
    setIsLoading(true);
    try {
      const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/transaction-returns/full/${returnData.id}?company_id=${company_id}`);
      if (!response.ok) throw new Error('Failed to fetch return details');
      const data = await response.json();
      setSelectedReturn(data.data);
      const initialQuantities: Record<string, number> = {};
      (data.data.stock_entries || []).forEach((entry: StockEntry) => {
          initialQuantities[entry.id] = parseFloat(entry.quantity);
      });
      setRefundQuantities(initialQuantities);
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch return details.' });
    } finally {
      setIsLoading(false);
    }
  }

  const handleRefund = async () => {
    if (!selectedReturn || !currentLocation || !company_id || !currentCashier) {
      toast({ variant: "destructive", title: "Error", description: "No return selected or location missing." });
      return;
    }
    setIsSubmitting(true);
    const itemsToRefund = (selectedReturn.stock_entries || []).filter(entry => refundQuantities[entry.id] > 0);
    if (itemsToRefund.length === 0) {
      toast({ variant: "destructive", title: "No Items to Refund", description: "Please enter a quantity for at least one item." });
      setIsSubmitting(false);
      return;
    }
    const refundPromises = itemsToRefund.map(entry => {
      const refundQty = refundQuantities[entry.id];
      const productPrice = entry.product ? parseFloat(entry.product.price as string) : 0;
      const payload = {
        rtn_number: selectedReturn.rtn_number,
        refund_amount: productPrice * refundQty,
        refund_datetime: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        is_active: 1, update_by: currentCashier.user_name,
        customer_id: parseInt(selectedReturn.customer_id, 10),
        rtn_location: parseInt(selectedReturn.location_id, 10),
        current_location: parseInt(currentLocation.location_id, 10),
        company_id: company_id, product_id: parseInt(entry.product_id, 10),
        product_variant_id: parseInt(entry.product_variant_id, 10),
        refund_qty: refundQty,
      };
      return fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/transaction-refunds`, {
        method: 'POST', body: JSON.stringify(payload)
      });
    });
    try {
      const responses = await Promise.all(refundPromises);
      for (const response of responses) {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'One or more refund requests failed.');
        }
      }
      toast({ title: "Refund Processed Successfully", description: `Refund for ${selectedReturn.rtn_number} has been completed.` });
      onOpenChange(false);
      setSelectedReturn(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({ variant: "destructive", title: "Refund Failed", description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 flex flex-col h-[90vh]">
        <DialogHeader className="p-6 border-b shrink-0 flex-row items-center justify-between">
            <div className="flex items-center gap-4">
                {selectedReturn && <Button variant="ghost" onClick={() => setSelectedReturn(null)}><ArrowLeft className="h-5 w-5 mr-2" /> Back</Button>}
                <PayshiaPosLogo />
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={async () => { setSelectedReturn(null); await new Promise(res => setTimeout(res, 100)); fetchReturns(); }}><RefreshCcw className="h-5 w-5" /></Button>
                <DialogClose asChild><Button variant="ghost" size="icon"><X className="h-5 w-5" /></Button></DialogClose>
            </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-6 pb-4 shrink-0">
             <h2 className="text-xl font-semibold">{selectedReturn ? 'Refund Confirmation' : 'Select Return to Make Refund'}</h2>
          </div>
          {selectedReturn ? (
              <ScrollArea className="flex-1 px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                  <div>
                    <Badge>{customers.find((c) => c.customer_id === selectedReturn.customer_id)?.name || 'Walk-in'}</Badge>
                    <p className="text-2xl font-bold mt-1">{selectedReturn.rtn_number}</p>
                    <p className="text-4xl font-bold text-green-600">{currencySymbol}{parseFloat(selectedReturn.return_amount).toFixed(2)}</p>
                    <Badge variant="secondary" className="mt-1 text-sm font-normal">{format(new Date(selectedReturn.created_at), 'yyyy-MM-dd HH:mm')}</Badge>
                    <Table className="mt-4">
                      <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="w-24">Return Qty</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {selectedReturn.stock_entries?.map((item: StockEntry) => {
                          const maxQty = parseFloat(item.quantity);
                          const itemPrice = item.product ? parseFloat(item.product.price as string) : 0;
                          return (
                            <TableRow key={item.id}>
                              <TableCell>{item.product ? item.product.name : 'Product not found'}</TableCell>
                              <TableCell><Input type="number" value={refundQuantities[item.id] || ''} onChange={(e) => setRefundQuantities((prev) => ({ ...prev, [item.id]: Math.min(parseFloat(e.target.value) || 0, maxQty) }))} max={maxQty} /></TableCell>
                              <TableCell className="text-right">{currencySymbol}{(itemPrice * (refundQuantities[item.id] || 0)).toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        }) || <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No item details available.</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="bg-muted p-6 rounded-lg flex flex-col justify-center">
                    <div className="space-y-4"><h3 className="text-lg font-semibold text-center">Enter PIN</h3><Input type="password" placeholder="****" className="h-12 text-center text-2xl tracking-widest" />
                      <Button onClick={handleRefund} disabled={isSubmitting} className="w-full h-12 text-lg">{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Refund</Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            ) : (
                <ScrollArea className="flex-1 px-6">
                    {isLoading ? <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 py-4">
                        {transactionReturns.map((ret) => {
                        const customer = customers.find((c) => c.customer_id === ret.customer_id);
                        return (
                            <Card key={ret.id} className="cursor-pointer hover:border-primary p-2" onClick={() => handleReturnSelect(ret)}>
                            <CardHeader className="p-2"><Badge className="w-fit mb-1 text-xs">{customer?.name || 'Walk-in'}</Badge><CardTitle className="text-sm">{ret.rtn_number}</CardTitle></CardHeader>
                            <CardContent className="p-2">
                                <p className="text-xl font-bold">{currencySymbol}{parseFloat(ret.return_amount).toFixed(2)}</p>
                                <Badge variant="secondary" className="mt-1 text-xs font-normal">{format(new Date(ret.created_at), 'yyyy-MM-dd HH:mm')}</Badge>
                            </CardContent>
                            </Card>
                        );
                        })}
                    </div>
                    )}
                </ScrollArea>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
