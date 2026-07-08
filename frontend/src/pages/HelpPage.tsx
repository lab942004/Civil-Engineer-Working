import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Mail, MessageCircle, FileText, ChevronRight } from 'lucide-react';

const faqs = [
  { q: 'How to use the Engineering Calculator?', a: 'Navigate to Calculator module, select a calculator type, enter parameters and click Calculate.' },
  { q: 'How to generate a BOQ?', a: 'Go to BOQ Generator, add items with quantities and rates. The total is calculated automatically.' },
  { q: 'How to upload drawings?', a: 'Go to Drawing Library and click Upload Drawing. Supported formats: PDF, DWG, DXF, PNG, JPG.' },
  { q: 'How to reset password?', a: 'Click "Forgot Password" on the login page and follow the email instructions.' },
];

export default function HelpPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Help & Support</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="p-3 rounded-lg border border-[hsl(var(--border))]">
                <p className="font-medium text-sm">{faq.q}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{faq.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 text-center space-y-2">
              <Mail className="mx-auto h-8 w-8 text-[hsl(221.2,83.2%,53.3%)]" />
              <h3 className="font-medium">Email Support</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">support@civilengineer.com</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center space-y-2">
              <MessageCircle className="mx-auto h-8 w-8 text-[hsl(221.2,83.2%,53.3%)]" />
              <h3 className="font-medium">Live Chat</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Available 24/7</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}