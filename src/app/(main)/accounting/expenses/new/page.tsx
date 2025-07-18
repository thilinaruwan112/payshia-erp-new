
import { ExpenseForm } from '@/components/expense-form';
import { chartOfAccounts, expenses, suppliers } from '@/lib/data';

export default function NewExpensePage() {
  const expenseAccounts = chartOfAccounts.filter(acc => acc.type === 'Expense');
  const paymentAccounts = chartOfAccounts.filter(acc => acc.type === 'Asset');
  
  const existingPayees = [...new Set([
      ...suppliers.map(s => s.name), 
      ...expenses.map(e => e.payee)
    ])];

  return <ExpenseForm 
            expenseAccounts={expenseAccounts} 
            paymentAccounts={paymentAccounts} 
            payees={existingPayees} 
          />;
}
