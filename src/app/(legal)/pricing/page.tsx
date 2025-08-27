
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="flex flex-col items-center">
         <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Pricing</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Choose the Right Plan for Your Business</h2>
            <p className="max-w-[900px] mx-auto text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Affordable pricing that scales with your needs. Get started for free.
            </p>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          {/* Free Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Perfect for getting started and exploring the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">Rs.0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" />1 User</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" />1 Location</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" />Up to 25 Products</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" />Community Support</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" disabled>
                Current Plan
              </Button>
            </CardFooter>
          </Card>

          {/* Standard Plan */}
          <Card className="border-primary ring-2 ring-primary">
            <CardHeader>
              <CardTitle>Standard</CardTitle>
              <CardDescription>For growing businesses that need more power.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">Rs.3500</span>
                <span className="text-muted-foreground line-through">Rs.5000</span>
                <span className="text-muted-foreground">/month</span>
              </div>
               <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" />Up to 10 Users</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" />Up to 5 Locations</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" />Up to 1000 Products</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" />Email Support</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Choose Plan
              </Button>
            </CardFooter>
          </Card>
          
          {/* Pro Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>Advanced features for scaling businesses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-baseline">
                <span className="text-4xl font-bold">Rs.10000</span>
                <span className="text-muted-foreground">/month</span>
              </div>
               <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" />Unlimited Users</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" />Unlimited Locations</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" />Unlimited Products</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" />Priority Support</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline">
                Choose Plan
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-16 max-w-4xl text-center">
            <h3 className="text-2xl font-bold">Enterprise Solution</h3>
            <p className="text-muted-foreground mt-2">
                For large-scale operations with custom needs, we offer a tailored Enterprise plan. Get everything in Pro, plus a dedicated account manager, custom integrations, and 24/7 phone support.
            </p>
            <p className="mt-4 text-sm">
                Contact us at <Link href="mailto:sales@payshia.com" className="font-semibold text-primary hover:underline">sales@payshia.com</Link> or <Link href="tel:+94770481363" className="font-semibold text-primary hover:underline">+94 770 481 363</Link> to get a custom quote.
            </p>
        </div>
    </div>
  );
}
