
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, Receipt, TrendingUp, TrendingDown, Package, ShoppingCart } from 'lucide-react';
import { orders, chartOfAccounts } from '@/lib/data';
import { useMemo } from 'react';
import type { Account } from '@/lib/types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function AccountingDashboardPage() {
  const financialSummary = useMemo(() => {
    const totalRevenue = orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((acc, order) => acc + order.total, 0);

    const totalExpenses = chartOfAccounts
      .filter((acc) => acc.type === 'Expense')
      .reduce((acc, expense) => acc + expense.balance, 0);
      
    const netIncome = totalRevenue - totalExpenses;

    const accountsPayable = chartOfAccounts.find(acc => acc.name === 'Accounts Payable')?.balance || 0;
    const accountsReceivable = chartOfAccounts.find(acc => acc.name === 'Accounts Receivable')?.balance || 0;

    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      accountsPayable,
      accountsReceivable,
    };
  }, []);
  
  const chartData = [
    { name: 'Financials', Revenue: financialSummary.totalRevenue, Expenses: financialSummary.totalExpenses, 'Net Income': financialSummary.netIncome },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Accounting Dashboard</h1>
        <p className="text-muted-foreground">
          Your financial overview at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialSummary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">From all sales channels</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialSummary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Based on chart of accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialSummary.netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Revenue minus expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accounts Payable</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialSummary.accountsPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Money owed to suppliers</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
          <CardDescription>
            A visual breakdown of revenue, expenses, and net income.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                    cursor={{fill: 'hsl(var(--muted))'}}
                />
                <Legend />
                <Bar dataKey="Revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Net Income" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
