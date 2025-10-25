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
import { PayshiaPosLogo } from '../payshia-pos-logo';

interface TodaySalesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

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
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/invoices/filter/hold/by-company-status?company_id=${company_id}&invoice_status=1`
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
        description: "Could not fetch today's invoices.",
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
      <DialogContent className="max-w-md p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 border-b shrink-0">
          <PayshiaPosLogo />
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-6 pb-4 shrink-0">
            <h2 className="text-xl font-semibold">Today's Invoice List</h2>
          </div>

          <ScrollArea className="flex-1 px-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="bg-muted text-muted-foreground text-center p-4 rounded-md">
                No Invoices for Today
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {invoices.map(inv => (
                  <div 
                    key={inv.id} 
                    className="flex justify-between items-center bg-card p-4 rounded-lg border"
                  >
                    <div>
                      <p className="font-semibold text-base">{inv.invoice_number}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(inv.current_time), "hh:mm a")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-lg">
                        {currencySymbol} {parseFloat(inv.grand_total).toFixed(2)}
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="hover:bg-muted"
                        onClick={() => handleReprint(inv.invoice_number, inv.company_id)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="border-t p-6 shrink-0 bg-background">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total Sales</span>
            <span>{currencySymbol} {totalSales.toFixed(2)}</span>
          </div>
        </div>

        
      </DialogContent>
    </Dialog>
  );
}
