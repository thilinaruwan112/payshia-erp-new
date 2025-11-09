'use client';

import React from 'react';
import type { ActiveOrder, Customer, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { UserPlus, Star } from 'lucide-react';
import { CustomerFormDialog } from '../customer-form-dialog';

interface CustomerPanelProps {
  order: ActiveOrder;
  customers: User[];
  onUpdateCustomer: (orderId: string, customer: Customer) => void;
  onCustomerCreated: (newCustomer: User) => void;
}

export function CustomerPanel({ order, customers, onUpdateCustomer, onCustomerCreated }: CustomerPanelProps) {
  const { customer, id: orderId } = order;

  return (
    <div className='p-4 border-b border-border'>
        <div className='flex items-center gap-3'>
            <div className="flex-1">
                <Select
                  value={customer?.customer_id || ''}
                  onValueChange={(customerId) => {
                    const newCustomer = customers.find(
                      (c) => c.customer_id === customerId
                    );
                    if (newCustomer) onUpdateCustomer(orderId, newCustomer as Customer);
                  }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                        {customers.map(c => (
                            <SelectItem key={c.customer_id} value={c.customer_id}>{c.first_name} {c.last_name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <CustomerFormDialog onCustomerCreated={onCustomerCreated}>
                 <Button variant="outline" size="icon">
                    <UserPlus className="h-5 w-5" />
                </Button>
            </CustomerFormDialog>
        </div>
         <div className='flex items-center justify-between mt-2 text-sm'>
            <p className="text-muted-foreground">Loyalty Points</p>
             <div className='flex items-center gap-1.5 text-yellow-500'>
                <Star className='h-4 w-4' />
                <span className='font-bold'>{customer?.loyaltyPoints || 0}</span>
            </div>
        </div>
      </div>
  );
}
