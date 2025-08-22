
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import type { Table as TableType } from "@/lib/types";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useLocation } from "./location-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";

const tableFormSchema = z.object({
  table_name: z.string().min(2, "Table name is required."),
  location_id: z.string().min(1, "Location is required."),
  is_active: z.boolean().default(true),
});

type TableFormValues = z.infer<typeof tableFormSchema>;

interface TableFormDialogProps {
  children: React.ReactNode;
  table?: TableType;
  onTableCreated: () => void;
}

export function TableFormDialog({ children, table, onTableCreated }: TableFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { company_id, availableLocations } = useLocation();

  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: {
        table_name: table?.table_name || '',
        location_id: table?.location_id || '',
        is_active: table ? table.is_active === '1' : true,
    },
    mode: "onChange",
  });

  async function onSubmit(data: TableFormValues) {
    setIsLoading(true);
    const url = table ? `https://server-erp.payshia.com/master-tables/${table.id}` : 'https://server-erp.payshia.com/master-tables';
    const method = table ? 'PUT' : 'POST';

    const payload = { 
        ...data,
        company_id: company_id,
        created_by: 'admin',
        is_active: data.is_active ? 1 : 0,
     };

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
      }

      toast({
        title: table ? "Table Updated" : "Table Created",
        description: `The table "${data.table_name}" has been saved.`,
      });
      onTableCreated();
      setIsOpen(false);
      form.reset();
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
       toast({
        variant: "destructive",
        title: "Failed to save table",
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{table ? 'Edit Table' : 'Create New Table'}</DialogTitle>
          <DialogDescription>
            {table ? 'Update the details for this table.' : 'Add a new table to one of your locations.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="table_name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Table Name / Number</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. Table 5" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="location_id"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a location" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {availableLocations.map(loc => (
                                <SelectItem key={loc.location_id} value={loc.location_id}>{loc.location_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                            Inactive tables will not appear in the POS.
                        </FormDescription>
                    </div>
                    <FormControl>
                        <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    </FormItem>
                )}
            />
            <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)} disabled={isLoading}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {table ? "Save Changes" : "Create Table"}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
