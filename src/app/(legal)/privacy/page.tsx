
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: '1. Interpretation and Definitions',
      content: `
        <h3 class="text-xl font-semibold">Interpretation</h3>
        <p>
            The words of which the initial letter is capitalized have meanings
            defined under the following conditions. The following definitions shall
            have the same meaning regardless of whether they appear in singular or in
            plural.
        </p>
        <h3 class="text-xl font-semibold mt-4">Definitions</h3>
        <p>For the purposes of this Privacy Policy:</p>
        <ul class="list-disc pl-6">
            <li><strong>Account</strong> means a unique account created for You to access our Service or parts of our Service.</li>
            <li><strong>Company</strong> (referred to as either &quot;the Company&quot;, &quot;We&quot;, &quot;Us&quot; or &quot;Our&quot; in this Agreement) refers to Payshia ERP.</li>
            <li><strong>Cookies</strong> are small files that are placed on Your computer, mobile device or any other device by a website, containing the details of Your browsing history on that website among its many uses.</li>
            <li><strong>Country</strong> refers to: Sri Lanka</li>
        </ul>
      `,
    },
    {
      title: '2. Collecting and Using Your Personal Data',
      content: `
        <h3 class="text-xl font-semibold">Types of Data Collected</h3>
        <h4 class="text-lg font-semibold mt-2">Personal Data</h4>
        <p>
            While using Our Service, We may ask You to provide Us with certain
            personally identifiable information that can be used to contact or
            identify You. Personally identifiable information may include, but is not
            limited to:
        </p>
        <ul class="list-disc pl-6">
            <li>Email address</li>
            <li>First name and last name</li>
            <li>Phone number</li>
            <li>Address, State, Province, ZIP/Postal code, City</li>
            <li>Usage Data</li>
        </ul>
      `,
    },
    {
      title: '3. Contact Us',
      content: `
        <p>If you have any questions about this Privacy Policy, You can contact us:</p>
        <ul class="list-disc pl-6">
            <li>By email: privacy@payshia.com</li>
        </ul>
      `,
    },
  ];

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl">Privacy Policy</CardTitle>
        <p className="text-muted-foreground pt-2">Last updated: July 30, 2024</p>
      </CardHeader>
      <CardContent className="space-y-8">
        <p className="pb-4">
          This Privacy Policy describes Our policies and procedures on the collection,
          use and disclosure of Your information when You use the Service and tells
          You about Your privacy rights and how the law protects You.
        </p>
        {sections.map((section, index) => (
          <div key={index}>
            <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
            <div
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
