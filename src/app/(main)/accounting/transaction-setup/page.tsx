
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { Account, KeySetting } from '@/lib/types';
import { useLocation } from '@/components/location-provider';
import { fetcher } from '@/lib/api';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

type Settings = Record<string, string>;

export default function TransactionSetupPage() {
    const { company_id } = useLocation();
    const { toast } = useToast();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<Settings>({});

    useEffect(() => {
        if (!company_id) {
            setIsLoading(false);
            return;
        }
        async function fetchInitialData() {
            setIsLoading(true);
            try {
                const [accountsRes, settingsRes] = await Promise.all([
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/finance-accounts?company_id=${company_id}`),
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/key-settings/company?company_id=${company_id}`)
                ]);
                
                if (!accountsRes.ok) throw new Error('Failed to fetch chart of accounts');
                const accountsData = await accountsRes.json();
                setAccounts(accountsData.data || []);
                
                if (settingsRes.ok) {
                    const settingsData: KeySetting[] = await settingsRes.json();
                    const initialSettings = settingsData.reduce((acc: Settings, setting) => {
                        acc[setting.key] = setting.value;
                        return acc;
                    }, {});
                    setSettings(initialSettings);
                }

            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch accounts or settings.' });
            } finally {
                setIsLoading(false);
            }
        }
        fetchInitialData();
    }, [company_id, toast]);

    const handleSettingChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveChanges = async () => {
        if (!company_id) return;
        setIsSaving(true);
        try {
            for (const [key, value] of Object.entries(settings)) {
                const payload = {
                    company_id,
                    location_id: 0, // 0 for company-wide settings
                    key,
                    value,
                    created_by: 'admin',
                    updated_by: 'admin',
                };
                await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/key-settings`, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
            }
            toast({ title: 'Success', description: 'Transaction settings saved successfully.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save settings.' });
        } finally {
            setIsSaving(false);
        }
    };


    const accountOptions = accounts.map(acc => ({
        value: String(acc.account_id),
        label: `${acc.account_id} - ${acc.account_name}`
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Transaction Setup</h1>
                <p className="text-muted-foreground">
                    Map default accounts for automated journal entries.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sales & Invoices</CardTitle>
                    <CardDescription>
                        Configure accounts related to sales invoices. This entry is created when an invoice is finalized.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <Label>Accounts Receivable (Debit)</Label>
                             <p className="text-xs text-muted-foreground">What customers owe you.</p>
                             {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} value={settings['sales_receivable_account'] || ''} onChange={(value) => handleSettingChange('sales_receivable_account', value)} placeholder="Select a receivable account..." />}
                        </div>
                        <div className="space-y-2">
                             <Label>Sales Revenue (Credit)</Label>
                             <p className="text-xs text-muted-foreground">Your income from sales.</p>
                             {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} value={settings['sales_revenue_account'] || ''} onChange={(value) => handleSettingChange('sales_revenue_account', value)} placeholder="Select a revenue account..." />}
                        </div>
                         <div className="space-y-2">
                             <Label>Cost of Goods Sold (Debit)</Label>
                              <p className="text-xs text-muted-foreground">The cost of the inventory sold.</p>
                             {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} value={settings['sales_cogs_account'] || ''} onChange={(value) => handleSettingChange('sales_cogs_account', value)} placeholder="Select a COGS expense account..." />}
                        </div>
                         <div className="space-y-2">
                             <Label>Inventory Asset (Credit)</Label>
                              <p className="text-xs text-muted-foreground">The value of stock leaving inventory.</p>
                             {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} value={settings['sales_inventory_account'] || ''} onChange={(value) => handleSettingChange('sales_inventory_account', value)} placeholder="Select an inventory asset account..." />}
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Purchasing & Goods Received (GRN)</CardTitle>
                    <CardDescription>
                       Configure accounts related to receiving goods from suppliers. This entry is created when a GRN is saved.
                    </CardDescription>
                </CardHeader>
                 <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <Label>Inventory Asset (Debit)</Label>
                             <p className="text-xs text-muted-foreground">The value of stock entering inventory.</p>
                             {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} value={settings['purchase_inventory_account'] || ''} onChange={(value) => handleSettingChange('purchase_inventory_account', value)} placeholder="Select an inventory asset account..." />}
                        </div>
                        <div className="space-y-2">
                             <Label>Accounts Payable (Credit)</Label>
                             <p className="text-xs text-muted-foreground">What you owe to your suppliers.</p>
                             {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} value={settings['purchase_payable_account'] || ''} onChange={(value) => handleSettingChange('purchase_payable_account', value)} placeholder="Select a payable account..." />}
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Payments</CardTitle>
                    <CardDescription>
                       Configure accounts for customer receipts and supplier payments.
                    </CardDescription>
                </CardHeader>
                 <CardContent className="space-y-8">
                     <div>
                        <h4 className="font-semibold mb-2">Customer Payment (Receipt)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Cash / Bank (Debit)</Label>
                                <p className="text-xs text-muted-foreground">The asset account receiving the funds.</p>
                                {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} value={settings['payment_cash_account'] || ''} onChange={(value) => handleSettingChange('payment_cash_account', value)} placeholder="Select a cash/bank account..." />}
                            </div>
                            <div className="space-y-2">
                                <Label>Accounts Receivable (Credit)</Label>
                                <p className="text-xs text-muted-foreground">Reduces the amount customers owe.</p>
                                {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} value={settings['payment_receivable_account'] || ''} onChange={(value) => handleSettingChange('payment_receivable_account', value)} placeholder="Select a receivable account..." />}
                            </div>
                        </div>
                    </div>
                     <Separator />
                     <div>
                        <h4 className="font-semibold mb-2">Supplier Payment</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Accounts Payable (Debit)</Label>
                                 <p className="text-xs text-muted-foreground">Reduces the amount you owe suppliers.</p>
                                {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} value={settings['supplier_payment_payable_account'] || ''} onChange={(value) => handleSettingChange('supplier_payment_payable_account', value)} placeholder="Select a payable account..." />}
                            </div>
                            <div className="space-y-2">
                                <Label>Cash / Bank (Credit)</Label>
                                 <p className="text-xs text-muted-foreground">The asset account paying the funds.</p>
                                {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} value={settings['supplier_payment_cash_account'] || ''} onChange={(value) => handleSettingChange('supplier_payment_cash_account', value)} placeholder="Select a cash/bank account..." />}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Expenses</CardTitle>
                    <CardDescription>
                       Configure accounts for expense claims.
                    </CardDescription>
                </CardHeader>
                 <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <Label>Expense Payable (Credit)</Label>
                             <p className="text-xs text-muted-foreground">Default account for unpaid expenses.</p>
                             {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} value={settings['expense_payable_account'] || ''} onChange={(value) => handleSettingChange('expense_payable_account', value)} placeholder="Select a payable account..." />}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Fixed Assets</CardTitle>
                    <CardDescription>
                       Configure accounts for purchasing and depreciating fixed assets.
                    </CardDescription>
                </CardHeader>
                 <CardContent className="space-y-8">
                     <div>
                        <h4 className="font-semibold mb-2">Asset Purchase</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Fixed Asset Account (Debit)</Label>
                                <p className="text-xs text-muted-foreground">The asset account to be increased.</p>
                                {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} value={settings['asset_purchase_asset_account'] || ''} onChange={(value) => handleSettingChange('asset_purchase_asset_account', value)} placeholder="Select a fixed asset account..." />}
                            </div>
                            <div className="space-y-2">
                                <Label>Accounts Payable / Cash (Credit)</Label>
                                <p className="text-xs text-muted-foreground">The account used for payment.</p>
                                {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} value={settings['asset_purchase_payment_account'] || ''} onChange={(value) => handleSettingChange('asset_purchase_payment_account', value)} placeholder="Select a payable/cash account..." />}
                            </div>
                        </div>
                    </div>
                     <Separator />
                     <div>
                        <h4 className="font-semibold mb-2">Depreciation</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Depreciation Expense (Debit)</Label>
                                 <p className="text-xs text-muted-foreground">The expense account for depreciation.</p>
                                {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} value={settings['asset_depreciation_expense_account'] || ''} onChange={(value) => handleSettingChange('asset_depreciation_expense_account', value)} placeholder="Select a depreciation expense..." />}
                            </div>
                            <div className="space-y-2">
                                <Label>Accumulated Depreciation (Credit)</Label>
                                 <p className="text-xs text-muted-foreground">The contra-asset account.</p>
                                {isLoading ? <Skeleton className="h-10" /> : <Combobox options={accountOptions} value={settings['asset_accumulated_depreciation_account'] || ''} onChange={(value) => handleSettingChange('asset_accumulated_depreciation_account', value)} placeholder="Select an accumulated dep. account..." />}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>


             <Card>
                 <CardContent className="pt-6">
                    <Button onClick={handleSaveChanges} disabled={isSaving || isLoading}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
