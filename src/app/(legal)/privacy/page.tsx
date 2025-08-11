import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <Card className="max-w-4xl mx-auto">
        <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
            <p>Last updated: July 30, 2024</p>
            <p>
                This Privacy Policy describes Our policies and procedures on the collection,
                use and disclosure of Your information when You use the Service and tells
                You about Your privacy rights and how the law protects You.
            </p>

            <h2>Interpretation and Definitions</h2>
            <h3>Interpretation</h3>
            <p>
                The words of which the initial letter is capitalized have meanings
                defined under the following conditions. The following definitions shall
                have the same meaning regardless of whether they appear in singular or in
                plural.
            </p>

            <h3>Definitions</h3>
            <p>For the purposes of this Privacy Policy:</p>
            <ul>
                <li><strong>Account</strong> means a unique account created for You to access our Service or parts of our Service.</li>
                <li><strong>Company</strong> (referred to as either &quot;the Company&quot;, &quot;We&quot;, &quot;Us&quot; or &quot;Our&quot; in this Agreement) refers to Payshia ERP.</li>
                <li><strong>Cookies</strong> are small files that are placed on Your computer, mobile device or any other device by a website, containing the details of Your browsing history on that website among its many uses.</li>
                <li><strong>Country</strong> refers to: Sri Lanka</li>
            </ul>

            <h2>Collecting and Using Your Personal Data</h2>
            <h3>Types of Data Collected</h3>
            <h4>Personal Data</h4>
            <p>
                While using Our Service, We may ask You to provide Us with certain
                personally identifiable information that can be used to contact or
                identify You. Personally identifiable information may include, but is not
                limited to:
            </p>
            <ul>
                <li>Email address</li>
                <li>First name and last name</li>
                <li>Phone number</li>
                <li>Address, State, Province, ZIP/Postal code, City</li>
                <li>Usage Data</li>
            </ul>

            <h2>Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, You can contact us:</p>
            <ul>
                <li>By email: privacy@payshia.com</li>
            </ul>
        </CardContent>
    </Card>
  );
}
