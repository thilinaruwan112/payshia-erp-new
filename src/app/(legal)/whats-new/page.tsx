
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const updates = [
  {
    version: "v1.2.0",
    date: "July 31, 2024",
    changes: [
      { type: "New Feature", description: "Introduced AI-powered Logistics Assistant to suggest shipping vendors." },
      { type: "Improvement", description: "Redesigned the main dashboard for better clarity and insights." },
      { type: "Fix", description: "Resolved an issue with inventory calculation during stock transfers." },
    ],
  },
  {
    version: "v1.1.0",
    date: "July 15, 2024",
    changes: [
      { type: "New Feature", description: "Added a full-featured CRM module with customer and campaign management." },
      { type: "New Feature", description: "Implemented a loyalty points system for customers." },
      { type: "Improvement", description: "Enhanced the performance of the product catalog page." },
    ],
  },
  {
    version: "v1.0.0",
    date: "July 1, 2024",
    changes: [
      { type: "New Feature", description: "Initial launch of Payshia ERP with core Inventory, Sales, and Accounting modules." },
    ],
  },
];

export default function WhatsNewPage() {
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "New Feature": return "default";
      case "Improvement": return "secondary";
      case "Fix": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight">What's New in Payshia ERP</h1>
            <p className="text-lg text-muted-foreground mt-2">
                We're constantly improving. Here's a log of our latest updates and features.
            </p>
        </div>
      {updates.map((update, index) => (
        <Card key={index} className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">{update.version}</CardTitle>
              <CardDescription>{update.date}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {update.changes.map((change, changeIndex) => (
                <li key={changeIndex} className="flex items-start gap-4">
                  <Badge variant={getBadgeVariant(change.type)} className="mt-1 whitespace-nowrap">
                    {change.type}
                  </Badge>
                  <p className="text-muted-foreground">{change.description}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
