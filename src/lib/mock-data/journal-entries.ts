
import type { JournalEntry } from '@/lib/types';

export const journalEntries: JournalEntry[] = [
    {
        id: 'JE-001',
        date: '2023-11-28',
        narration: 'To record monthly rent payment',
        totalDebit: 6000.00,
        totalCredit: 6000.00,
        lines: [
            { accountCode: 6100, accountName: 'Rent Expense', debit: 6000.00, credit: 0 },
            { accountCode: 1010, accountName: 'Cash and Bank', debit: 0, credit: 6000.00 },
        ]
    },
    {
        id: 'JE-002',
        date: '2023-11-15',
        narration: 'To record receipt of goods from PO-001',
        totalDebit: 5250.00,
        totalCredit: 5250.00,
        lines: [
            { accountCode: 1400, accountName: 'Inventory', debit: 5250.00, credit: 0 },
            { accountCode: 2010, accountName: 'Accounts Payable', debit: 0, credit: 5250.00 },
        ]
    },
     {
        id: 'JE-003',
        date: '2023-11-25',
        narration: 'Payment to Global Textiles Inc. for PO-001',
        totalDebit: 5250.00,
        totalCredit: 5250.00,
        lines: [
            { accountCode: 2010, accountName: 'Accounts Payable', debit: 5250.00, credit: 0 },
            { accountCode: 1010, accountName: 'Cash and Bank', debit: 0, credit: 5250.00 },
        ]
    },
    {
        id: 'JE-004',
        date: '2023-11-30',
        narration: 'Owner investment into the business',
        totalDebit: 25000.00,
        totalCredit: 25000.00,
        lines: [
            { accountCode: 1010, accountName: 'Cash and Bank', debit: 25000.00, credit: 0 },
            { accountCode: 3000, accountName: 'Owner\'s Equity', debit: 0, credit: 25000.00 },
        ]
    }
];
