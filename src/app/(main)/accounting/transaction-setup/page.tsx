
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Account, KeySetting } from '@/lib/types';
import { useLocation } from '@/components/location-provider';
import { fetcher } from '@/lib/api';
import { Combobox } from '@/components/ui/combobox';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

type Settings = Record<string, string>;

const transactionMappings = [
    {
        section: "Sales",
        entries: [
            {
                name: "Revenue Recognition",
                description: "When an invoice is finalized.",
                debitKey: "sales_receivable_account",
                debitLabel: "Accounts Receivable",
                creditKey: "sales_revenue_account",
                creditLabel: "Sales Revenue",
            },
            {
                name: "Cost of Goods Sold",
                description: "Cost of the inventory sold.",
                debitKey: "sales_cogs_account",
                debitLabel: "Cost of Goods Sold",
                creditKey: "sales_inventory_account",
                creditLabel: "Inventory Asset",
            },
        ],
    },
    {
        section: "Purchasing & GRN",
        entries: [
            {
                name: "Goods Received",
                description: "When receiving goods from suppliers via GRN.",
                debitKey: "purchase_inventory_account",
                debitLabel: "Inventory Asset",
                creditKey: "purchase_payable_account",
                creditLabel: "Accounts Payable",
            },
        ],
    },
    {
        section: "Payments",
        entries: [
            {
                name: "Customer Receipt",
                description: "When a customer payment is recorded.",
                debitKey: "payment_cash_account",
                debitLabel: "Cash / Bank",
                creditKey: "payment_receivable_account",
                creditLabel: "Accounts Receivable",
            },
            {
                name: "Supplier Payment",
                description: "When a payment is made to a supplier.",
                debitKey: "supplier_payment_payable_account",
                debitLabel: "Accounts Payable",
                creditKey: "supplier_payment_cash_account",
                creditLabel: "Cash / Bank",
            },
        ],
    },
    {
        section: "Expenses",
        entries: [
             {
                name: "Expense Claim",
                description: "Default for unpaid expense claims.",
                debitKey: null,
                debitLabel: "Specific Expense (from form)",
                creditKey: "expense_payable_account",
                creditLabel: "Expense Payable",
            },
        ]
    },
    {
        section: "Fixed Assets",
        entries: [
            {
                name: "Asset Purchase",
                description: "When a fixed asset is purchased.",
                debitKey: 'asset_purchase_asset_account',
                debitLabel: 'Fixed Asset Account',
                creditKey: 'asset_purchase_payment_account',
                creditLabel: 'A/P or Cash',
            },
            {
                name: "Asset Depreciation",
                description: "When depreciation is recorded.",
                debitKey: 'asset_depreciation_expense_account',
                debitLabel: 'Depreciation Expense',
                creditKey: 'asset_accumulated_depreciation_account',
                creditLabel: 'Accumulated Depreciation',
            }
        ]
    }
];

export default function TransactionSetupPage() {
    const { company_id } = useLocation();
    const { toast } = useToast();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
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

    const handleSaveEntry = async (entryName: string, keys: (string | null)[]) => {
        if (!company_id) return;
        setSavingStates(prev => ({...prev, [entryName]: true}));
        
        try {
            for (const key of keys) {
                if (key && settings[key]) {
                    const payload = {
                        company_id,
                        location_id: 0, // 0 for company-wide settings
                        key,
                        value: settings[key],
                        created_by: 'admin',
                        updated_by: 'admin',
                    };
                    await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/key-settings`, {
                        method: 'POST',
                        body: JSON.stringify(payload),
                    });
                }
            }
            toast({ title: 'Success', description: `${entryName} settings saved successfully.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: `Could not save ${entryName} settings.` });
        } finally {
            setSavingStates(prev => ({...prev, [entryName]: false}));
        }
    };


    const accountOptions = accounts.map(acc => ({
        value: String(acc.account_id),
        label: `${acc.account_id} - ${acc.account_name}`
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transaction Setup</h1>
                    <p className="text-muted-foreground">
                        Map default accounts for automated journal entries.
                    </p>
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-1/4">Transaction</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-1/4">Debit Account</TableHead>
                        <TableHead className="w-1/4">Credit Account</TableHead>
                        <TableHead className="w-[120px]">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({length: 8}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                            </TableRow>
                        ))
                    ) : (
                        transactionMappings.map(section => (
                            <React.Fragment key={section.section}>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableCell colSpan={5} className="font-bold text-primary">{section.section}</TableCell>
                                </TableRow>
                                {section.entries.map(entry => (
                                    <TableRow key={entry.name}>
                                        <TableCell className="font-medium align-top pt-6">{entry.name}</TableCell>
                                        <TableCell className="text-muted-foreground align-top pt-6">{entry.description}</TableCell>
                                        <TableCell>
                                            {entry.debitKey ? (
                                                <Combobox 
                                                    options={accountOptions}
                                                    value={settings[entry.debitKey] || ''}
                                                    onChange={(value) => handleSettingChange(entry.debitKey, value)}
                                                    placeholder={`Select a ${entry.debitLabel}...`}
                                                />
                                            ) : (
                                                <Input value={entry.debitLabel} disabled />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {entry.creditKey ? (
                                                <Combobox 
                                                    options={accountOptions}
                                                    value={settings[entry.creditKey] || ''}
                                                    onChange={(value) => handleSettingChange(entry.creditKey, value)}
                                                    placeholder={`Select a ${entry.creditLabel}...`}
                                                />
                                            ) : (
                                                    <Input value={entry.creditLabel} disabled />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button onClick={() => handleSaveEntry(entry.name, [entry.debitKey, entry.creditKey])} disabled={savingStates[entry.name]} size="sm">
                                                {savingStates[entry.name] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                Save
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </React.Fragment>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
