
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { PurchaseOrder, Supplier } from "@/lib/types";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React from "react";

const grnItemBatchSchema = z.object({
    batchNumber: z.string().min(1, "Batch number is required."),
    mfgDate: z.date().optional(),
    expDate: z.date().optional(),
    receivedQty: z.coerce.number().min(1, "Quantity must be at least 1."),
});

const grnItemSchema = z.object({
  sku: z.string().min(1, "Product is required."),
  poQuantity: z.number(),
  batches: z.array(grnItemBatchSchema).min(1, "At least one batch is required."),
});

const grnFormSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  supplierId: z.string().min(1, "Supplier is required."),
  poId: z.string().min(1, "Purchase order is required."),
  items: z.array(grnItemSchema),
}).refine(data => {
    return data.items.every(item => {
        const totalReceived = item.batches.reduce((sum, batch) => sum + batch.receivedQty, 0);
        return totalReceived <= item.poQuantity;
    });
}, {
    message: "Total received quantity cannot exceed the purchase order quantity for an item.",
    path: ["items"],
});

type GrnFormValues = z.infer<typeof grnFormSchema>;

interface GrnFormProps {
    suppliers: Supplier[];
    purchaseOrders: PurchaseOrder[];
}

export function GrnForm({ suppliers, purchaseOrders }: GrnFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const defaultValues: Partial<GrnFormValues> = {
    date: new Date(),
    items: [],
  };

  const form = useForm<GrnFormValues>({
    resolver: zodResolver(grnFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const supplierId = form.watch('supplierId');
  
  const handlePoChange = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (po && po.items) {
      const newItems = po.items.map(item => ({
        sku: item.sku,
        poQuantity: item.quantity,
        batches: [{
          batchNumber: '',
          receivedQty: item.quantity,
        }]
      }));
      replace(newItems);
    } else {
      replace([]);
    }
  }

  function onSubmit(data: GrnFormValues) {
    console.log(data);
    toast({
      title: "GRN Created",
      description: `The GRN has been successfully created.`,
    });
    router.push('/purchasing/grn');
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <h1 className="text-3xl font-bold tracking-tight text-nowrap">New Goods Received Note</h1>
                 <p className="text-muted-foreground">Record incoming stock from a supplier against a PO.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full">Cancel</Button>
                <Button type="submit" className="w-full">Save GRN</Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>GRN Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Receiving Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Supplier</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a supplier" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {suppliers.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="poId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Purchase Order</FormLabel>
                             <Select onValueChange={(value) => {
                                field.onChange(value);
                                handlePoChange(value);
                             }} defaultValue={field.value} disabled={!supplierId}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a PO" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {purchaseOrders.filter(po => po.supplierId === supplierId).map(po => (
                                        <SelectItem key={po.id} value={po.id}>{po.id}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>

        {fields.map((item, itemIndex) => (
            <Card key={item.id}>
                 <CardHeader>
                    <CardTitle className="text-lg">{item.sku}</CardTitle>
                    <CardDescription>
                        Ordered Quantity: <span className="font-bold">{item.poQuantity}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BatchDetailsFieldArray itemIndex={itemIndex} control={form.control} />
                </CardContent>
            </Card>
        ))}
      </form>
    </Form>
  );
}

function BatchDetailsFieldArray({ itemIndex, control }: { itemIndex: number, control: any }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `items.${itemIndex}.batches`
    });

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Batch Number</TableHead>
                        <TableHead>MFD</TableHead>
                        <TableHead>EXP</TableHead>
                        <TableHead>Received Qty</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {fields.map((batch, batchIndex) => (
                        <TableRow key={batch.id}>
                            <TableCell>
                                 <FormField
                                    control={control}
                                    name={`items.${itemIndex}.batches.${batchIndex}.batchNumber`}
                                    render={({ field }) => (
                                        <FormItem><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )}
                                />
                            </TableCell>
                            <TableCell>
                                <FormField
                                    control={control}
                                    name={`items.${itemIndex}.batches.${batchIndex}.mfgDate`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                variant={"outline"}
                                                className={cn("w-[150px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                >
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TableCell>
                             <TableCell>
                                <FormField
                                    control={control}
                                    name={`items.${itemIndex}.batches.${batchIndex}.expDate`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                variant={"outline"}
                                                className={cn("w-[150px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                >
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TableCell>
                            <TableCell>
                                <FormField
                                    control={control}
                                    name={`items.${itemIndex}.batches.${batchIndex}.receivedQty`}
                                    render={({ field }) => (
                                        <FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}
                                />
                            </TableCell>
                            <TableCell>
                                {fields.length > 1 && (
                                    <Button variant="ghost" size="icon" onClick={() => remove(batchIndex)}>
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ batchNumber: '', receivedQty: 1 })}
                className="mt-4"
            >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Batch
            </Button>
        </div>
    )
}

