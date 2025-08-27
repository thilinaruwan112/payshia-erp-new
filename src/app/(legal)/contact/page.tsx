
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl">Contact Us</CardTitle>
        <CardDescription>
          Have a question or want to learn more? We'd love to hear from you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input placeholder="Your Name" />
            <Input type="email" placeholder="Your Email" />
          </div>
          <Input placeholder="Subject" />
          <Textarea placeholder="Your Message" rows={6} />
          <Button type="submit" className="w-full">Send Message</Button>
        </form>
      </CardContent>
    </Card>
  );
}
