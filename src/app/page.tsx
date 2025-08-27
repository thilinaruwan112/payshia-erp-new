
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Briefcase, DollarSign, LayoutDashboard, Package, Truck, Users, CheckCircle, Quote, ShoppingCart, Terminal, ChevronDown, LogIn, Phone, Search, ArrowDown, Building } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SectionSeparator } from '@/components/section-separator';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';

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
  {
    icon: <ShoppingCart className="h-8 w-8 text-primary" />,
    name: 'Purchasing',
    description: 'Create purchase orders, manage suppliers, and track goods received.',
  }
];

const ecosystemFeatures = [
    { name: "ERP", icon: LayoutDashboard, angle: -90 },
    { name: "Inventory", icon: Package, angle: -150 },
    { name: "Accounting", icon: DollarSign, angle: -210 },
    { name: "HRM", icon: Briefcase, angle: -270 },
    { name: "CRM", icon: Users, angle: -330 },
    { name: "POS", icon: Terminal, angle: -30 },
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

const premiumAgents = [
    {
        name: 'Innovate Solutions',
        location: 'Colombo, Sri Lanka',
        avatar: 'https://i.pravatar.cc/150?u=agent1',
    },
    {
        name: 'Kandy Tech Partners',
        location: 'Kandy, Sri Lanka',
        avatar: 'https://i.pravatar.cc/150?u=agent2',
    },
    {
        name: 'Jaffna Business Systems',
        location: 'Jaffna, Sri Lanka',
        avatar: 'https://i.pravatar.cc/150?u=agent3',
    },
    {
        name: 'Galle Enterprise Group',
        location: 'Galle, Sri Lanka',
        avatar: 'https://i.pravatar.cc/150?u=agent4',
    }
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center px-4 lg:px-6">
          <Link href="/" className="flex items-center justify-center gap-2">
            <Image src="https://content-provider.payshia.com/payshia-erp/branding/payshia-erp-logo-01.webp" alt="Payshia ERP Logo" width={32} height={32} />
             <span className="font-bold">Payshia ERP</span>
          </Link>
          <nav className="ml-auto hidden md:flex items-center gap-4 sm:gap-6">
            <Link href="/about" className="text-sm font-medium hover:underline underline-offset-4">About</Link>
            <Link href="/pricing" className="text-sm font-medium hover:underline underline-offset-4">Pricing</Link>
            <Link href="/contact" className="text-sm font-medium hover:underline underline-offset-4">Contact</Link>
            <Link href="/whats-new" className="text-sm font-medium hover:underline underline-offset-4">What's New</Link>
          </nav>
          <div className="ml-auto md:ml-4 flex items-center gap-2">
             <ThemeToggle />
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
         <section className="relative w-full landing-page-aurora flex items-center min-h-[calc(100vh-4rem)]">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="space-y-4">
                  <Image src="https://content-provider.payshia.com/payshia-erp/branding/payshia-erp-logo-01.webp" alt="Payshia ERP Logo" width={150} height={150} className="mx-auto lg:mx-0" />
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-foreground">
                    Scalable & Modular Web-Based ERP
                  </h1>
                  <p className="max-w-[600px] mx-auto lg:mx-0 text-muted-foreground md:text-xl">
                    An all-in-one solution for managing your sales channels, locations,
                    inventory, and orders with powerful AI features.
                  </p>
                  <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center lg:justify-start">
                    <Button asChild size="lg">
                      <Link href="/register">Get Started</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link href="https://wa.me/94770481363" target="_blank" rel="noopener noreferrer">Live Demo</Link>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="hidden lg:grid grid-cols-2 gap-4">
                 {features.slice(0, 6).map((feature, index) => (
                    <Card key={index} className="bg-background/40 backdrop-blur-sm border-white/20">
                      <CardHeader className="flex-row items-center gap-4 pb-2">
                        {feature.icon}
                        <CardTitle className="text-base">{feature.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                 ))}
              </div>
            </div>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <Link href="#ecosystem">
                <ArrowDown className="h-8 w-8 text-foreground/50" />
            </Link>
          </div>
        </section>

        

        <section id="ecosystem" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center text-center mb-12 md:mb-20">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-foreground">
                A Complete ERP Ecosystem
              </h2>
              <p className="max-w-[900px] mx-auto text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mt-4">
                All modules are seamlessly integrated to provide a single source
                of truth for your entire business operation.
              </p>
            </div>

            {/* Mobile Grid Layout */}
            <div className="grid grid-cols-2 gap-8 md:hidden">
                {ecosystemFeatures.map((feature, index) => (
                    <div key={index} className="flex flex-col items-center text-center">
                        <div className="flex items-center justify-center h-20 w-20 rounded-full bg-muted border-2 border-border shadow-lg">
                            <feature.icon className="h-8 w-8 text-primary" />
                        </div>
                        <span className="mt-3 text-sm font-semibold text-foreground tracking-wider">{feature.name}</span>
                    </div>
                ))}
                 <div className="col-span-2 flex flex-col items-center text-center">
                    <div className="text-center mt-8">
                        <h3 className="text-3xl font-bold text-primary">
                            Payshia ERP
                        </h3>
                        <p className="text-xl text-primary/80 opacity-80">
                            Solutions
                        </p>
                    </div>
                 </div>
            </div>

            {/* Desktop Circular Layout */}
            <div className="relative hidden md:flex items-center justify-center min-h-[30rem] w-full">
              <div
                className="absolute flex items-center justify-center h-80 w-80 rounded-full bg-primary/10"
              >
                <div className="text-center">
                  <h3 className="text-4xl font-bold text-primary">
                    Payshia ERP
                  </h3>
                  <p className="text-2xl text-primary/80">
                    Solutions
                  </p>
                </div>
              </div>
              {ecosystemFeatures.map((feature, index) => {
                const angle = feature.angle * (Math.PI / 180);
                const radius = 220;
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                return (
                  <div
                    key={index}
                    className="absolute flex flex-col items-center text-center group"
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                      transition: 'transform 0.3s ease',
                    }}
                  >
                    <div className="flex items-center justify-center h-20 w-20 rounded-full bg-background border-2 border-border shadow-lg group-hover:border-primary transition-colors duration-300">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                    <span className="mt-3 text-sm font-semibold text-foreground tracking-wider">
                      {feature.name}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-4 mt-20">
                <Button variant="outline">Explore Products</Button>
                <Button>Contact Sales</Button>
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
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12 mt-12">
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
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />1 User</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />1 Location</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Up to 25 Products</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Community Support</li>
                    </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" asChild>
                            <Link href="/register">Get Started</Link>
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
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Up to 10 Users</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Up to 5 Locations</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Up to 1000 Products</li>
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
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Unlimited Users</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Unlimited Locations</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Unlimited Products</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />Priority Support</li>
                    </ul>
                    </CardContent>
                    <CardFooter>
                    <Button className="w-full" variant="outline">
                        Choose Plan
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
        
        <SectionSeparator />

        <section id="agents" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Agents</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Join Our Agent Network</h2>
                <p className="max-w-[900px] mx-auto text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Partner with us and grow your business. As a Payshia ERP agent, you'll get access to tools, training, and support to succeed.
                </p>
              </div>
              <div className="mx-auto w-full max-w-sm space-y-2">
                   <Button size="lg" asChild>
                     <Link href="/register">
                      Become an Agent
                    </Link>
                   </Button>
              </div>
            </div>
          </div>
        </section>

        <SectionSeparator />

        <section id="premium-agents" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm">Our Network</div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Meet Our Premium Agents</h2>
                        <p className="max-w-[900px] mx-auto text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Our trusted partners are here to help you get the most out of Payshia ERP.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid max-w-5xl items-stretch gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-4 mt-12">
                    {premiumAgents.map((agent) => (
                        <Card key={agent.name} className="flex flex-col text-center items-center p-6 hover:shadow-lg transition-shadow">
                             <div className="flex items-center justify-center h-24 w-24 mb-4 rounded-full bg-primary/10 border-2 border-primary">
                                <Building className="h-10 w-10 text-primary" />
                            </div>
                            <CardHeader className="p-0">
                                <CardTitle className="text-lg">{agent.name}</CardTitle>
                                <CardDescription>{agent.location}</CardDescription>
                            </CardHeader>
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
