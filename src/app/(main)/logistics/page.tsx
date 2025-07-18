
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getLogisticsSuggestion } from './actions';
import { BotMessageSquare, Loader2, Send, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { checkFeatureAccess } from '@/lib/plan-limits';
import { useEffect, useState } from 'react';

const initialState = {
  suggestion: '',
  error: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Send className="mr-2 h-4 w-4" />
      )}
      Get Suggestion
    </Button>
  );
}

function UpgradePrompt() {
  return (
    <Card className="flex flex-col items-center justify-center text-center p-8">
      <CardHeader>
        <Zap className="h-12 w-12 mx-auto text-primary" />
        <CardTitle className="mt-4">Upgrade to Access AI Logistics</CardTitle>
        <CardDescription>
          This feature is available on the Pro plan and above. Upgrade your plan to unlock AI-powered shipping vendor recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/billing">View Plans</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default function LogisticsPage() {
  const [state, formAction] = useFormState(getLogisticsSuggestion, initialState);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    checkFeatureAccess('ai logistics').then(setHasAccess);
  }, []);


  if (hasAccess === null) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              AI Logistics Assistant
            </h1>
            <p className="text-muted-foreground">
              Find the best shipping vendor for your order.
            </p>
          </div>
        </div>
        {hasAccess ? (
          <Card>
            <form action={formAction}>
              <CardHeader>
                <CardTitle>Shipment Details</CardTitle>
                <CardDescription>
                  Provide the details of your shipment to get an AI-powered
                  recommendation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="packageDetails">Package Details</Label>
                  <Textarea
                    id="packageDetails"
                    name="packageDetails"
                    placeholder="e.g., 1 box, 12x12x12 inches, 5 lbs, fragile"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    name="destination"
                    placeholder="e.g., New York, NY"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency</Label>
                   <Select name="urgency" defaultValue="standard">
                      <SelectTrigger id="urgency">
                          <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="express">Express</SelectItem>
                          <SelectItem value="overnight">Overnight</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <SubmitButton />
              </CardFooter>
            </form>
          </Card>
        ) : (
          <UpgradePrompt />
        )}
      </div>
      <div className="sticky top-24">
        <Card className="min-h-[300px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BotMessageSquare className="h-6 w-6 text-primary" />
              AI Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {state?.error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            {state?.suggestion && hasAccess ? (
              <div
                className="prose dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: state.suggestion }}
              />
            ) : (
              <div className="text-muted-foreground">
                {hasAccess ? "Your shipping suggestion will appear here." : "Upgrade your plan to see AI recommendations."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
