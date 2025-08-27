
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="flex flex-col items-center">
         <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Pricing</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Choose the Right Plan for Your Business</h2>
            <p className="max-w-[900px] mx-auto text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Affordable pricing that scales with your needs. Get started for free.
            </p>
        </div>
        <div className="mx-auto grid max-w-5xl items-center gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          {/* Basic Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Basic</CardTitle>
              <CardDescription>Perfect for small businesses and startups.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">$15</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />5 Users</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />2 Locations</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />1,000 Products</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Email Support</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Choose Plan
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className="border-primary ring-2 ring-primary">
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>For growing businesses that need more power.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">$45</span>
                <span className="text-muted-foreground">/month</span>
              </div>
               <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />20 Users</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />10 Locations</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />10,000 Products</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Priority Support</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />AI Logistics</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Upgrade to Pro
              </Button>
            </CardFooter>
          </Card>
          
          {/* Enterprise Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <CardDescription>Advanced features for scaling businesses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-baseline">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
               <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Unlimited Users</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Unlimited Locations</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Unlimited Products</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />24/7 Phone Support</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline">
                Contact Sales
              </Button>
            </CardFooter>
          </Card>
        </div>
    </div>
  );
}
