

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
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
import type { Location, Product } from "@/lib/types";
import { CalendarIcon, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const transferFormSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  fromLocationId: z.string().min(1, "Source location is required."),
  toLocationId: z.string().min(1, "Destination location is required."),
  items: z.array(
    z.object({
      sku: z.string().min(1, "Product is required."),
      quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
    })
  ).min(1, "At least one item is required."),
}).refine(data => data.fromLocationId !== data.toLocationId, {
    message: "Source and destination locations cannot be the same.",
    path: ["toLocationId"],
});


type TransferFormValues = z.infer<typeof transferFormSchema>;

interface TransferFormProps {
    locations: Location[];
    products: Product[];
}

export function TransferForm({ locations, products }: TransferFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  const allSkus = products.flatMap(p => p.variants.map(v => ({
      label: `${p.name} (${v.sku})`,
      value: v.sku,
  })));
  
  const defaultValues: Partial<TransferFormValues> = {
    date: new Date(),
    fromLocationId: "",
    toLocationId: "",
    items: [
        { sku: '', quantity: 1 },
    ],
  };

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const watchedItems = form.watch("items");

  const transferTotalValue = watchedItems.reduce((total, item) => {
    const product = products.find(p => p.variants.some(v => v.sku === item.sku));
    const costPrice = product?.costPrice || 0;
    const quantity = Number(item.quantity) || 0;
    return total + (costPrice * quantity);
  }, 0);


  function onSubmit(data: TransferFormValues) {
    console.log(data);
    toast({
      title: "Stock Transfer Created",
      description: `The transfer has been initiated.`,
    });
    router.push('/transfers');
  }

  const handleCreateTransferClick = async () => {
    const isValid = await form.trigger();
    if (isValid) {
        setIsConfirmOpen(true);
    }
  };
  
  const fromLocation = locations.find(l => l.id === form.getValues().fromLocationId);
  const toLocation = locations.find(l => l.id === form.getValues().toLocationId);

  return (
    <>
      <Form {...form}>
        <form onSubmit={(e) => { e.preventDefault(); handleCreateTransferClick(); }} className="space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                   <h1 className="text-3xl font-bold tracking-tight text-nowrap">New Stock Transfer</h1>
                   <p className="text-muted-foreground">Move stock between your locations.</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button variant="outline" type="button" onClick={() => router.back()} className="w-full">Cancel</Button>
                  <Button type="submit" className="w-full">Create Transfer</Button>
              </div>
          </div>

          <Card>
              <CardHeader>
                  <CardTitle>Transfer Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Date</FormLabel>
                          <Popover>
                              <PopoverTrigger asChild>
                              <FormControl>
                                  <Button
                                  variant={"outline"}
                                  className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                  )}
                                  >
                                  {field.value ? (
                                      format(field.value, "PPP")
                                  ) : (
                                      <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                              </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                              />
                              </PopoverContent>
                          </Popover>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                   <FormField
                      control={form.control}
                      name="fromLocationId"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>From (Source)</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                      <SelectTrigger>
                                          <SelectValue placeholder="Select source location" />
                                      </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                      {locations.map(loc => (
                                          <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                   <FormField
                      control={form.control}
                      name="toLocationId"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>To (Destination)</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                      <SelectTrigger>
                                          <SelectValue placeholder="Select destination location" />
                                      </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                      {locations.map(loc => (
                                          <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
              </CardContent>
          </Card>

          <Card>
              <CardHeader>
                  <CardTitle>Items to Transfer</CardTitle>
                  <CardDescription>Add the products and quantities you want to move.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead className="w-[40%]">Product</TableHead>
                              <TableHead>Cost Price</TableHead>
                              <TableHead>Selling Price</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead className="text-right">Total Value</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                           {fields.map((field, index) => {
                              const selectedSku = watchedItems[index]?.sku;
                              const product = products.find(p => p.variants.some(v => v.sku === selectedSku));
                              const costPrice = product?.costPrice || 0;
                              const sellingPrice = product?.price || 0;
                              const quantity = watchedItems[index]?.quantity || 0;
                              const totalValue = costPrice * quantity;

                              return (
                                 <TableRow key={field.id}>
                                      <TableCell>
                                          <FormField
                                              control={form.control}
                                              name={`items.${index}.sku`}
                                              render={({ field }) => (
                                                  <FormItem>
                                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                          <FormControl>
                                                              <SelectTrigger>
                                                                  <SelectValue placeholder="Select a product" />
                                                              </SelectTrigger>
                                                          </FormControl>
                                                          <SelectContent>
                                                              {allSkus.map(sku => (
                                                                  <SelectItem key={sku.value} value={sku.value}>{sku.label}</SelectItem>
                                                              ))}
                                                          </SelectContent>
                                                      </Select>
                                                      <FormMessage />
                                                  </FormItem>
                                              )}
                                          />
                                      </TableCell>
                                      <TableCell className="font-mono">${costPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                      <TableCell className="font-mono">${sellingPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                      <TableCell>
                                          <FormField
                                              control={form.control}
                                              name={`items.${index}.quantity`}
                                              render={({ field }) => (
                                                  <FormItem>
                                                      <FormControl>
                                                          <Input type="number" placeholder="1" {...field} />
                                                      </FormControl>
                                                      <FormMessage />
                                                  </FormItem>
                                              )}
                                          />
                                      </TableCell>
                                      <TableCell className="text-right font-mono">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                      <TableCell>
                                          {fields.length > 1 && (
                                              <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                              </Button>
                                          )}
                                      </TableCell>
                                 </TableRow>
                              )
                           })}
                      </TableBody>
                       <TableFooter>
                          <TableRow>
                              <TableCell colSpan={4} className="text-right font-bold">Total Transfer Value</TableCell>
                              <TableCell className="text-right font-bold font-mono">${transferTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                              <TableCell></TableCell>
                          </TableRow>
                      </TableFooter>
                  </Table>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ sku: '', quantity: 1 })} className="mt-4">
                      Add another item
                  </Button>
              </CardContent>
          </Card>
        </form>
      </Form>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Stock Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              Please review the details below before creating the transfer. This action cannot be undone.
              <div className="mt-4 space-y-2 text-sm text-muted-foreground bg-muted p-3 rounded-md border">
                <p><strong>From:</strong> {fromLocation?.name}</p>
                <p><strong>To:</strong> {toLocation?.name}</p>
                <p><strong>Items:</strong> {watchedItems.length}</p>
                <p><strong>Total Value:</strong> <span className="font-mono">${transferTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={form.handleSubmit(onSubmit)}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
