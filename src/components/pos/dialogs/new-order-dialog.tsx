
'use client';

import React, { useState, useEffect } from 'react';
import type { ActiveOrder, User, Table as TableType, Invoice } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';

const OrderTypeSelection = ({ onSelectOrderType, onSelectTable, tables, isLoadingTables, activeOrders, heldOrders }: { 
    onSelectOrderType: (type: ActiveOrder['orderType']) => void; 
    onSelectTable: (tableName: string) => void;
    tables: TableType[];
    isLoadingTables: boolean;
    activeOrders: ActiveOrder[];
    heldOrders: Invoice[];
}) => {
    const { toast } = useToast();
    const isTableInUse = (tableId: string) => {
        return heldOrders.some(order => order.table_id === tableId);
    };

    const handleTableClick = (table: TableType) => {
        if (isTableInUse(table.id)) {
            toast({
                variant: "default",
                title: "Table In Use",
                description: `Table ${table.table_name} is currently occupied with a held order.`,
            });
        } else {
            onSelectTable(table.table_name);
        }
    }

    return (
        <div className="py-4">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card className="p-8 text-center text-2xl font-semibold cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => onSelectOrderType('Take Away')}>Take Away</Card>
                 <Card className="p-8 text-center text-2xl font-semibold cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => onSelectOrderType('Retail')}>Retail</Card>
                 <Card className="p-8 text-center text-2xl font-semibold cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => onSelectOrderType('Delivery')}>Delivery</Card>
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-4">Set Table</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                    {isLoadingTables ? Array.from({length: 8}).map((_, i) => <Card key={i} className="p-4 h-24 animate-pulse bg-muted"></Card>) : (
                        tables.map(table => {
                            const inUse = isTableInUse(table.id);
                            return (
                            <Card key={table.id} className={cn("p-4 transition-colors", inUse ? "bg-muted/50 cursor-not-allowed" : "cursor-pointer hover:border-primary")} onClick={() => handleTableClick(table)}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge>Dine-In</Badge>
                                    <Badge variant={!inUse ? 'default' : 'destructive'} className={cn(!inUse && 'bg-green-500')}>
                                        {!inUse ? 'Available' : 'In Use'}
                                    </Badge>
                                </div>
                                <p className="text-lg font-bold">{table.table_name}</p>
                            </Card>
                        )})
                    )}
                </div>
            </div>
        </div>
    )
}

const StewardSelection = ({ onSelectSteward, onBack, stewards, isLoading }: { onSelectSteward: (steward: User) => void; onBack: () => void; stewards: User[], isLoading: boolean; }) => (
    <div className="py-4">
         <Button variant="ghost" onClick={onBack} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Order Type</Button>
        <h2 className="text-2xl font-bold mb-4">Select Steward</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {isLoading ? Array.from({length: 4}).map((_, i) => <Card key={i} className="p-4 h-40 animate-pulse bg-muted"></Card>) : (
                stewards.map(steward => (
                    <Card key={steward.id} className="p-4 text-center cursor-pointer hover:border-primary" onClick={() => onSelectSteward(steward)}>
                        <Avatar className="h-20 w-20 mx-auto"><AvatarImage src={steward.avatar} alt={steward.name} data-ai-hint="profile picture" /><AvatarFallback>{steward.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                        <p className="mt-2 font-semibold">{steward.name}</p><p className="text-xs text-muted-foreground">{steward.role}</p>
                    </Card>
                ))
            )}
        </div>
    </div>
);

interface NewOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activeOrders?: ActiveOrder[];
  createNewOrder: (type: ActiveOrder['orderType'], steward?: User, tableName?: string) => void;
}

export function NewOrderDialog({ isOpen, onOpenChange, activeOrders = [], createNewOrder }: NewOrderDialogProps) {
  const [step, setStep] = useState<'type' | 'steward'>('type');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tables, setTables] = useState<TableType[]>([]);
  const [stewards, setStewards] = useState<User[]>([]);
  const [heldOrders, setHeldOrders] = useState<Invoice[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingStewards, setIsLoadingStewards] = useState(false);
  const { company_id } = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPosDialogData() {
        if (!company_id || !isOpen) return;
        setIsLoadingTables(true);
        setIsLoadingStewards(true);
        try {
            const [tablesResponse, stewardsResponse, heldOrdersResponse] = await Promise.all([
                fetch(`https://server-erp.payshia.com/master-tables/filter/by-company?company_id=${company_id}`),
                fetch(`https://server-erp.payshia.com/filter/users?user_status=3&company_id=${company_id}`),
                fetch(`https://server-erp.payshia.com/invoices/filter/hold/by-company-status?company_id=${company_id}&invoice_status=2`),
            ]);
            if (!tablesResponse.ok) throw new Error('Failed to fetch tables');
            setTables((await tablesResponse.json()) || []);
            if (!stewardsResponse.ok) throw new Error('Failed to fetch stewards');
            const stewardsResult = await stewardsResponse.json();
            const stewardsData = stewardsResult.data || [];
            setStewards((stewardsData || []).map((s: any) => ({ id: s.id, name: `${s.first_name} ${s.last_name}`, role: s.acc_type, avatar: s.img_path, customer_id: s.id })));
             if (!heldOrdersResponse.ok) throw new Error('Failed to fetch held orders');
            const heldOrdersData = await heldOrdersResponse.json();
            setHeldOrders(heldOrdersData || []);
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch POS data.' });
        } finally {
            setIsLoadingTables(false);
            setIsLoadingStewards(false);
        }
    };
    fetchPosDialogData();
  }, [isOpen, toast, company_id]);

  const handleSelectTable = (tableName: string) => { setSelectedTable(tableName); setStep('steward'); };
  const handleBack = () => { setStep('type'); setSelectedTable(null); };
  const handleSelectSteward = (steward: User) => { if (selectedTable) createNewOrder('Dine-In', steward, selectedTable); }

  useEffect(() => { if (!isOpen) setTimeout(() => setStep('type'), 200); }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Order</DialogTitle>
          <DialogDescription>Select an order type or choose a table for dine-in.</DialogDescription>
        </DialogHeader>
        {step === 'type' ? (
          <OrderTypeSelection 
            onSelectOrderType={(type) => createNewOrder(type)} 
            onSelectTable={handleSelectTable} 
            tables={tables} 
            isLoadingTables={isLoadingTables} 
            activeOrders={activeOrders} 
            heldOrders={heldOrders}
          />
        ) : (
          <StewardSelection onBack={handleBack} onSelectSteward={handleSelectSteward} stewards={stewards} isLoading={isLoadingStewards} />
        )}
      </DialogContent>
    </Dialog>
  );
}
