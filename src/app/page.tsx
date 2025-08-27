

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Briefcase, DollarSign, LayoutDashboard, Package, Truck, Users, CheckCircle, Quote, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SectionSeparator } from '@/components/section-separator';
import Image from 'next/image';

const features = [
  {
    icon: <LayoutDashboard className="h-8 w-8 text-primary" />,
    name: 'Unified Dashboard',
    description: 'Get a 360-degree view of your business with our comprehensive dashboards.',
  },
  {
    icon: <Package className="h-8 w-8 text-primary" />,
    name: 'Inventory Management',
    description: 'Track stock levels, manage variants, and streamline inventory control.',
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    name: 'CRM',
    description: 'Manage customer relationships, track interactions, and run marketing campaigns.',
  },
  {
    icon: <DollarSign className="h-8 w-8 text-primary" />,
    name: 'Accounting',
    description: 'Handle expenses, manage chart of accounts, and keep your finances in order.',
  },
   {
    icon: <Briefcase className="h-8 w-8 text-primary" />,
    name: 'HRM',
    description: 'Manage your employees, payroll, and attendance all in one place.',
  },
];

const ecosystemFeatures = [
    { name: "Inventory", icon: Package, angle: 0 },
    { name: "Sales", icon: DollarSign, angle: 60 },
    { name: "CRM", icon: Users, angle: 120 },
    { name: "Purchasing", icon: ShoppingCart, angle: 180 },
    { name: "HRM", icon: Briefcase, angle: 240 },
    { name: "Accounting", icon: LayoutDashboard, angle: 300 },
];


const testimonials = [
    {
        name: 'Sarah L.',
        role: 'CEO, TechGadgets Inc.',
        avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
        review: "Payshia ERP has revolutionized how we manage our inventory across multiple locations. The AI forecasting is a game-changer for us. Highly recommended!"
    },
    {
        name: 'David C.',
        role: 'Operations Manager, Fashion Hub',
        avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705e',
        review: "The unified dashboard gives me a complete overview of my business at a glance. It's incredibly intuitive and has saved us countless hours."
    },
    {
        name: 'Michael P.',
        role: 'Founder, Urban Homewares',
        avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706f',
        review: "The CRM and sales modules are fantastic. We've been able to streamline our customer communication and boost our sales by 20% in just one quarter."
    }
]

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen landing-page-aurora">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center px-4 lg:px-6">
          <Link href="/" className="flex items-center justify-center gap-2">
            <Image src="http://content-provider.payshia.com/payshia-erp/branding/Transparent-01u.png" alt="Payshia ERP Logo" width={32} height={32} />
            <span className="text-xl font-bold">Payshia ERP</span>
          </Link>
          <nav className="ml-auto hidden md:flex items-center gap-4 sm:gap-6">
            <Link href="/about" className="text-sm font-medium hover:underline underline-offset-4">About</Link>
            <Link href="/pricing" className="text-sm font-medium hover:underline underline-offset-4">Pricing</Link>
            <Link href="/contact" className="text-sm font-medium hover:underline underline-offset-4">Contact</Link>
            <Link href="/whats-new" className="text-sm font-medium hover:underline underline-offset-4">What's New</Link>
          </nav>
          <div className="ml-auto md:ml-4 flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">
                Login
              </Link>
            </Button>
            <Button asChild>
              <Link href="/register">
                Sign Up
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full flex items-center justify-center text-center min-h-[calc(100vh-4rem)] py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl xl:text-7xl/none text-foreground">
                    The All-In-One Platform to Run Your Business
                  </h1>
                  <p className="max-w-[600px] mx-auto text-foreground/80 md:text-xl">
                    Payshia ERP gives you the tools to manage everything from sales and inventory to accounting and human resources, all in one place.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                   <Button size="lg" asChild>
                     <Link href="/register">
                      Get Started for Free
                    </Link>
                   </Button>
                </div>
            </div>
          </div>
        </section>

        <SectionSeparator />

        <section id="ecosystem" className="w-full py-12 md:py-24 lg:py-32 bg-background/50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Our Ecosystem</div>
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">A Complete ERP Ecosystem</h2>
                    <p className="max-w-[900px] mx-auto text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        All modules are seamlessly integrated to provide a single source of truth for your entire business operation.
                    </p>
                </div>
                <div className="relative flex items-center justify-center h-96 w-96 mx-auto">
                    <div className="absolute flex items-center justify-center h-40 w-40 rounded-full bg-primary/10 border-2 border-dashed border-primary/20">
                         <div className="flex flex-col items-center text-center">
                            <Image src="http://content-provider.payshia.com/payshia-erp/branding/Transparent-01u.png" alt="Payshia ERP Logo" width={64} height={64} />
                            <h3 className="mt-2 text-xl font-bold text-primary">Payshia ERP</h3>
                         </div>
                    </div>
                    {ecosystemFeatures.map((feature, index) => {
                        const angle = feature.angle * (Math.PI / 180);
                        const x = 125 * Math.cos(angle);
                        const y = 125 * Math.sin(angle);
                        return (
                            <div key={index} className="absolute flex flex-col items-center text-center group" style={{ transform: `translate(${x}px, ${y}px)`}}>
                                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-background border shadow-md group-hover:bg-primary transition-colors duration-300">
                                    <feature.icon className="h-8 w-8 text-muted-foreground group-hover:text-primary-foreground" />
                                </div>
                                <span className="mt-2 text-sm font-semibold">{feature.name}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>

        <SectionSeparator />
        
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need. Nothing You Don’t.</h2>
                <p className="max-w-[900px] mx-auto text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our comprehensive suite of tools is designed to streamline your operations and help you make smarter decisions.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-stretch gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
              {features.map((feature) => (
                <Card key={feature.name} className="p-6 flex flex-col hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="p-0 mb-4">
                    <div className="flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full mb-4">
                       {feature.icon}
                    </div>
                    <CardTitle>{feature.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1">
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <SectionSeparator />

        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Pricing</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Choose the Right Plan for Your Business</h2>
                <p className="max-w-[900px] mx-auto text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Affordable pricing that scales with your needs. Get started for free.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12 mt-12">
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
        </section>

        <SectionSeparator />

        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm">Testimonials</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">What Our Customers Are Saying</h2>
                <p className="max-w-[900px] mx-auto text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Hear from business owners who have transformed their operations with Payshia ERP.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-stretch gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.name} className="flex flex-col">
                  <CardContent className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <Quote className="w-8 h-8 text-primary mb-4" />
                        <p className="text-muted-foreground italic">&quot;{testimonial.review}&quot;</p>
                    </div>
                    <div className="flex items-center gap-4 pt-6 mt-4 border-t">
                        <Avatar>
                            <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint="profile photo"/>
                            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{testimonial.name}</p>
                            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container mx-auto grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Ready to transform your business?
              </h2>
              <p className="mx-auto max-w-[600px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join hundreds of businesses growing with Payshia ERP. Get started in minutes.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
               <Button size="lg" variant="secondary" asChild className="w-full">
                 <Link href="/register">
                  Sign Up Now
                </Link>
               </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t border-border/20">
        <div className="container mx-auto flex flex-col gap-2 sm:flex-row py-6 shrink-0 items-center px-4 md:px-6">
          <p className="text-xs text-foreground/60">&copy; 2024 Payshia Software Solutions. All rights reserved.</p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link href="/terms" className="text-xs hover:underline underline-offset-4 text-foreground/60 hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-xs hover:underline underline-offset-4 text-foreground/60 hover:text-foreground">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
