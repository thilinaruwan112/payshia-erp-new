'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getForecast } from '@/app/inventory/forecast/actions';
import { type ForecastInventoryOutput } from '@/ai/flows/inventory-forecasting';
import { Loader2, TrendingUp, PackageCheck, AlertTriangle } from 'lucide-react';

const formSchema = z.object({
  productName: z.string().min(1, 'Product name is required.'),
  pastSalesData: z.string().min(1, 'Past sales data is required.'),
  seasonalTrends: z.string().min(1, 'Seasonal trends are required.'),
});

export function ForecastingForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ForecastInventoryOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: '',
      pastSalesData: '',
      seasonalTrends: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    const response = await getForecast(values);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setResult(response.data);
    }
    setIsLoading(false);
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Inventory Forecasting</CardTitle>
          <CardDescription>
            Use AI to predict optimal reorder points based on sales velocity and seasonal trends.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Classic White T-Shirt" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pastSalesData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Past Sales Data</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Jan: 100 units, Feb: 120 units, Mar: 150 units"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="seasonalTrends"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seasonal Trends</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Sales double during summer months (June-August)."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Forecast...
                  </>
                ) : (
                  'Generate Forecast'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-center">
        {isLoading && (
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p>Analyzing data and generating forecast...</p>
          </div>
        )}
        {error && (
          <Card className="w-full bg-destructive/10 border-destructive/20">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                    <CardTitle className="text-destructive">Error</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}
        {result && (
          <Card className="w-full bg-accent/10 border-accent/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent/20 rounded-full">
                    <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Forecast Result</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-background rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><PackageCheck className="h-4 w-4" /> Reorder Point</h3>
                  <p className="text-2xl font-bold">{result.reorderPoint} units</p>
                </div>
                <div className="p-4 bg-background rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><PackageCheck className="h-4 w-4" /> Reorder Quantity</h3>
                  <p className="text-2xl font-bold">{result.reorderQuantity} units</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Explanation</h3>
                <p className="text-sm mt-1">{result.forecastExplanation}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
