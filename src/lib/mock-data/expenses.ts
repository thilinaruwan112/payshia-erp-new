
import type { Expense } from '@/lib/types';

export const expenses: Expense[] = [
    {
        id: 'exp-001',
        date: '2023-11-28',
        payee: 'City Properties',
        amount: 2000.00,
        expenseAccountId: 6100,
        expenseAccountName: 'Rent Expense',
        paymentAccountId: 1010,
        paymentAccountName: 'Cash and Bank'
    },
    {
        id: 'exp-002',
        date: '2023-11-20',
        payee: 'Office Supplies Inc.',
        amount: 150.75,
        expenseAccountId: 6400,
        expenseAccountName: 'Office Supplies',
        paymentAccountId: 1010,
        paymentAccountName: 'Cash and Bank'
    },
    {
        id: 'exp-003',
        date: '2023-11-30',
        payee: 'City Power & Light',
        amount: 325.50,
        expenseAccountId: 6300,
        expenseAccountName: 'Utilities Expense',
        paymentAccountId: 1010,
        paymentAccountName: 'Cash and Bank'
    },
];
