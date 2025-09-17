

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Invoice } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCcw, X, Truck, Loader2, Printer } from 'lucide-react';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { format, isToday } from 'date-fns';
import { useCurrency } from '@/components/currency-provider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { fetcher } from '@/lib/api';

interface TodaySalesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const PayshiaPosLogo = () => (
  <div className="flex items-center gap-2">
    <Truck className="h-8 w-8 text-primary transform -scale-x-100" />
    <span className="text-3xl font-bold tracking-tight">
      PAYSHIA <span className="text-primary">POS</span>
    </span>
  </div>
);

export function TodaySalesDialog({
  isOpen,
  onOpenChange,
}: TodaySalesDialogProps) {
  const { company_id, currentLocation } = useLocation();
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const fetchInvoices = useCallback(async () => {
    if (!company_id || !currentLocation) return;
    setIsLoading(true);
    try {
      const response = await fetcher(
        `https://server-erp.payshia.com/invoices/filter/hold/by-company-status?company_id=${company_id}&invoice_status=1`
      );
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const allInvoices: Invoice[] = (await response.json()) || [];
      const todayInvoices = allInvoices.filter(
        (inv) => isToday(new Date(inv.invoice_date)) && inv.location_id === currentLocation.location_id
      );
      setInvoices(todayInvoices);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch today\'s invoices.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [company_id, currentLocation, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchInvoices();
    }
  }, [isOpen, fetchInvoices]);

  const handleReprint = (invoiceId: string, companyId: string) => {
    window.open(`/sales-print/invoices/${invoiceId}/print?company_id=${companyId}`, '_blank');
  };

  const totalSales = invoices.reduce((acc, inv) => acc + parseFloat(inv.grand_total), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="p-4 border-b flex-row items-center justify-between">
          <PayshiaPosLogo />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={fetchInvoices} disabled={isLoading}>
              <RefreshCcw className={cn("h-5 w-5", isLoading && "animate-spin")} />
            </Button>
            <DialogClose asChild>
                <Button variant="ghost" size="icon">
                    <X className="h-5 w-5" />
                </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Today Invoice List</h2>
            {isLoading ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : invoices.length === 0 ? (
                <div className="bg-primary text-primary-foreground text-center p-4 rounded-md">
                    No Invoices for Today
                </div>
            ) : (
                <ScrollArea className="h-64 border rounded-md">
                    <div className="p-2 space-y-2">
                        {invoices.map(inv => (
                             <div key={inv.id} className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
                                <div>
                                    <p className="font-semibold">{inv.invoice_number}</p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(inv.current_time), "hh:mm a")}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="font-bold text-lg text-right w-24">{currencySymbol}{parseFloat(inv.grand_total).toFixed(2)}</div>
                                  <Button size="icon" variant="ghost" onClick={() => handleReprint(inv.id, inv.company_id)}><Printer className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
             <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Sales</span>
                    <span>{currencySymbol}{totalSales.toFixed(2)}</span>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
