import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl">Terms and Conditions</CardTitle>
      </CardHeader>
      <CardContent className="prose dark:prose-invert max-w-none">
        <p>Last updated: July 30, 2024</p>
        <p>
          Please read these terms and conditions carefully before using Our
          Service.
        </p>

        <h2>Interpretation and Definitions</h2>
        <p>
          The words of which the initial letter is capitalized have meanings
          defined under the following conditions. The following definitions shall
          have the same meaning regardless of whether they appear in singular or in
          plural.
        </p>

        <h2>Acknowledgment</h2>
        <p>
          These are the Terms and Conditions governing the use of this Service and
          the agreement that operates between You and the Company. These Terms and
          Conditions set out the rights and obligations of all users regarding the
          use of the Service.
        </p>
        <p>
          Your access to and use of the Service is conditioned on Your acceptance
          of and compliance with these Terms and Conditions. These Terms and
          Conditions apply to all visitors, users and others who access or use
          the Service.
        </p>

        <h2>Links to Other Websites</h2>
        <p>
          Our Service may contain links to third-party web sites or services that
          are not owned or controlled by the Company. The Company has no control
          over, and assumes no responsibility for, the content, privacy policies,
          or practices of any third party web sites or services.
        </p>

        <h2>Changes to These Terms and Conditions</h2>
        <p>
          We reserve the right, at Our sole discretion, to modify or replace
          these Terms at any time. If a revision is material We will make
          reasonable efforts to provide at least 30 days notice prior to any new
          terms taking effect. What constitutes a material change will be
          determined at Our sole discretion.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions about these Terms and Conditions, You can
          contact us:
        </p>
        <ul>
            <li>By email: contact@payshia.com</li>
        </ul>
      </CardContent>
    </Card>
  );
}
