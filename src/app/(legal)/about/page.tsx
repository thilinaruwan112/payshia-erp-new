
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl">About Payshia ERP</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg text-muted-foreground">
            Payshia ERP is a modern, scalable, and modular web-based ERP system designed to streamline your business operations.
        </p>
        <p>
            Our mission is to provide an affordable, all-in-one solution for businesses to manage their sales, inventory, customers, and finances with ease. We believe that powerful business tools should be accessible to everyone, not just large corporations.
        </p>
         <p>
            Built with a modern tech stack, Payshia ERP is designed for performance, reliability, and an excellent user experience. We are constantly innovating and adding new features, including powerful AI tools, to help you make smarter business decisions.
        </p>
      </CardContent>
    </Card>
  );
}
