
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Search, XCircle } from 'lucide-react';
import React from 'react';

const CancellationSection = ({ title, description, inputLabel, onCancel }: { title: string, description: string, inputLabel: string, onCancel: (id: string) => void }) => {
    const [id, setId] = React.useState('');

    const handleCancelClick = () => {
        if (!id) return;
        onCancel(id);
        setId('');
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex w-full max-w-sm items-center space-x-2">
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor={title.toLowerCase().replace(' ', '-')} className="sr-only">{inputLabel}</Label>
                        <Input
                            id={title.toLowerCase().replace(' ', '-')}
                            type="text"
                            placeholder={inputLabel}
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                        />
                    </div>
                    <Button type="button" variant="destructive" onClick={handleCancelClick} disabled={!id}>
                        <XCircle className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function CancellationPage() {
    const { toast } = useToast();

    const handleCancel = (type: string, id: string) => {
        // In a real application, you would make an API call here to cancel the document.
        console.log(`Cancelling ${type} with ID: ${id}`);
        toast({
            title: `${type} Cancellation`,
            description: `${type} #${id} has been marked for cancellation (simulated).`,
        });
    };

    const cancellationSections = [
        { title: 'Cancel Invoice', description: 'Cancel a customer sales invoice.', inputLabel: 'Invoice Number (e.g., INV-001)' },
        { title: 'Cancel Receipt', description: 'Cancel a customer payment receipt.', inputLabel: 'Receipt Number (e.g., REC-001)' },
        { title: 'Cancel Transfer Note', description: 'Cancel a stock transfer between locations.', inputLabel: 'Transfer Note Number (e.g., TRN-001)' },
        { title: 'Cancel Purchase Order', description: 'Cancel a purchase order sent to a supplier.', inputLabel: 'PO Number (e.g., PO-001)' },
        { title: 'Cancel Production Note', description: 'Cancel a finished good production entry.', inputLabel: 'Production Note ID' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Cancellation</h1>
                <p className="text-muted-foreground">
                    A central place to cancel various transactions in the system. Use with caution.
                </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {cancellationSections.map(section => (
                    <CancellationSection 
                        key={section.title}
                        title={section.title}
                        description={section.description}
                        inputLabel={section.inputLabel}
                        onCancel={(id) => handleCancel(section.title.split(' ')[1], id)}
                    />
                ))}
            </div>
        </div>
    );
}
