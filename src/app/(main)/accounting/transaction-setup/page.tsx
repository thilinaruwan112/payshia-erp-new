
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

type TransactionEntry = {
  name: string;
  description: string;
  debitKey: string | null;
  debitLabel: string;
  creditKey: string | null;
  creditLabel: string;
};

type TransactionSection = {
  section: string;
  entries: TransactionEntry[];
};


const transactionMappings: TransactionSection[] = [
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
        section: "Stock Adjustment",
        entries: [
            {
                name: "Increase",
                description: "When stock is increased via adjustment.",
                debitKey: 'stock_increase_debit_account',
                debitLabel: 'Inventory Asset',
                creditKey: 'stock_increase_credit_account',
                creditLabel: 'Stock Adjustment Account',
            },
            {
                name: "Decrease",
                description: "When stock is decreased via adjustment/wastage.",
                debitKey: 'stock_decrease_debit_account',
                debitLabel: 'Stock Adjustment Account',
                creditKey: 'stock_decrease_credit_account',
                creditLabel: 'Inventory Asset',
            },
        ]
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

interface ApiSetting {
  id: string;
  type: string;
  credit_account_id: string;
  debit_account_id: string;
  status: string;
  company_id: string;
  sub_type: string;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
}


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
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/transaction-setup?company_id=${company_id}`)
                ]);
                
                if (!accountsRes.ok) throw new Error('Failed to fetch chart of accounts');
                const accountsData = await accountsRes.json();
                setAccounts(accountsData.data || []);
                
                if (settingsRes.ok) {
                    const settingsData: {data: ApiSetting[]} = await settingsRes.json();
                    const apiSettings = settingsData.data || [];
                    
                    const initialSettings: Settings = {};

                    transactionMappings.forEach(section => {
                        section.entries.forEach(entry => {
                            // Find debit entry
                            if(entry.debitKey){
                                const debitSetting = apiSettings.find(s => s.type === section.section && s.sub_type === entry.name && s.debit_account_id !== '0');
                                if (debitSetting) {
                                    initialSettings[entry.debitKey] = debitSetting.debit_account_id;
                                }
                            }
                            // Find credit entry
                            if(entry.creditKey){
                                const creditSetting = apiSettings.find(s => s.type === section.section && s.sub_type === entry.name && s.credit_account_id !== '0');
                                if (creditSetting) {
                                    initialSettings[entry.creditKey] = creditSetting.credit_account_id;
                                }
                            }
                        });
                    });
                    
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

    const handleSaveEntry = async (entryName: string, keys: (string | null)[], section: string) => {
        if (!company_id) return;
        setSavingStates(prev => ({...prev, [entryName]: true}));
        
        const [debitKey, creditKey] = keys;
        const debitAccountId = debitKey ? settings[debitKey] : null;
        const creditAccountId = creditKey ? settings[creditKey] : null;
        
        const payload = {
            type: section,
            sub_type: entryName,
            debit_account_id: debitAccountId ? parseInt(debitAccountId, 10) : 0,
            credit_account_id: creditAccountId ? parseInt(creditAccountId, 10) : 0,
            status: "active",
            company_id: company_id,
            created_by: "admin"
        };
        
        try {
            const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/transaction-setup`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to save settings for ${entryName}.`);
            }
             toast({ title: 'Success', description: `${entryName} settings saved successfully.` });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : `An unknown error occurred.`;
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
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
                        <TableHead className="w-[15%]">Type</TableHead>
                        <TableHead className="w-[20%]">Transaction</TableHead>
                        <TableHead>Debit Account</TableHead>
                        <TableHead>Credit Account</TableHead>
                        <TableHead className="w-[120px]">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({length: 8}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                            </TableRow>
                        ))
                    ) : (
                        transactionMappings.flatMap((section, sectionIndex) => 
                            section.entries.map((entry, entryIndex) => (
                                <TableRow key={entry.name}>
                                    {entryIndex === 0 && (
                                        <TableCell rowSpan={section.entries.length} className="font-bold text-primary align-top pt-6">{section.section}</TableCell>
                                    )}
                                    <TableCell className="font-medium">{entry.name}<p className="text-xs text-muted-foreground font-normal">{entry.description}</p></TableCell>
                                    <TableCell>
                                        {entry.debitKey ? (
                                            <Combobox 
                                                options={accountOptions}
                                                value={settings[entry.debitKey] || ''}
                                                onChange={(value) => handleSettingChange(entry.debitKey!, value)}
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
                                                onChange={(value) => handleSettingChange(entry.creditKey!, value)}
                                                placeholder={`Select a ${entry.creditLabel}...`}
                                            />
                                        ) : (
                                            <Input value={entry.creditLabel} disabled />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button onClick={() => handleSaveEntry(entry.name, [entry.debitKey, entry.creditKey], section.section)} disabled={savingStates[entry.name]} size="sm">
                                            {savingStates[entry.name] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Save
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
