
import type { Account } from '@/lib/types';

export const chartOfAccounts: Account[] = [
    { code: 1010, name: 'Cash and Bank', type: 'Asset', subType: 'Current Asset', balance: 150230.50 },
    { code: 1200, name: 'Accounts Receivable', type: 'Asset', subType: 'Current Asset', balance: 35890.00 },
    { code: 1400, name: 'Inventory', type: 'Asset', subType: 'Current Asset', balance: 89500.00 },
    { code: 1500, name: 'Furniture and Equipment', type: 'Asset', subType: 'Fixed Asset', balance: 45000.00 },
    { code: 2010, name: 'Accounts Payable', type: 'Liability', subType: 'Current Liability', balance: 22450.75 },
    { code: 2100, name: 'Sales Tax Payable', type: 'Liability', subType: 'Current Liability', balance: 8750.00 },
    { code: 3000, name: 'Owner\'s Equity', type: 'Equity', subType: 'Equity', balance: 250000.00 },
    { code: 3300, name: 'Retained Earnings', type: 'Equity', subType: 'Equity', balance: 44420.25 },
    { code: 4000, name: 'Sales Revenue', type: 'Revenue', subType: 'Operating Revenue', balance: 185900.00 },
    { code: 5010, name: 'Cost of Goods Sold', type: 'Expense', subType: 'Operating Expense', balance: 98200.00 },
    { code: 6100, name: 'Rent Expense', type: 'Expense', subType: 'General Expense', balance: 24000.00 },
    { code: 6200, name: 'Salaries and Wages', type: 'Expense', subType: 'General Expense', balance: 48000.00 },
    { code: 6300, name: 'Utilities Expense', type: 'Expense', subType: 'General Expense', balance: 5500.00 },
    { code: 6400, name: 'Office Supplies', type: 'Expense', subType: 'General Expense', balance: 2300.00 },
];
