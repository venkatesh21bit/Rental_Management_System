'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppNavigation } from '@/components/app-navigation';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                We collect information you provide directly to us, such as when you create an account, make a rental request, 
                or contact us for support.
              </p>
              <h4 className="font-semibold mt-4">Personal Information:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Name, email address, and phone number</li>
                <li>Address and location information</li>
                <li>Payment and billing information</li>
                <li>Business information (for commercial accounts)</li>
                <li>Profile photos and documents</li>
              </ul>
              <h4 className="font-semibold mt-4">Usage Information:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>How you interact with our platform</li>
                <li>Equipment searches and preferences</li>
                <li>Rental history and patterns</li>
                <li>Device and browser information</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide and improve our rental platform services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Communicate with you about products, services, and promotions</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, investigate, and prevent fraudulent transactions and abuse</li>
                <li>Comply with legal obligations and protect our rights</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Information Sharing</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>We may share your information in the following situations:</p>
              <h4 className="font-semibold mt-4">With Other Users:</h4>
              <p>
                When you make a rental request, we share relevant contact and profile information with equipment owners 
                to facilitate the rental process.
              </p>
              <h4 className="font-semibold mt-4">With Service Providers:</h4>
              <p>
                We work with third-party companies to provide payment processing, analytics, customer support, 
                and other business functions.
              </p>
              <h4 className="font-semibold mt-4">For Legal Reasons:</h4>
              <p>
                We may disclose information if required by law, to respond to legal requests, or to protect 
                our rights and the safety of our users.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Data Security</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                We implement appropriate security measures to protect your personal information against unauthorized access, 
                alteration, disclosure, or destruction:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication requirements</li>
                <li>Secure data centers and infrastructure</li>
                <li>Employee training on data protection practices</li>
              </ul>
              <p className="mt-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure, 
                so we cannot guarantee absolute security.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                We retain your personal information for as long as necessary to provide our services and fulfill 
                the purposes outlined in this Privacy Policy. Specific retention periods include:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Account information: Until account deletion plus 30 days</li>
                <li>Transaction records: 7 years for tax and legal compliance</li>
                <li>Support communications: 3 years</li>
                <li>Analytics data: 2 years in aggregated form</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Your Rights and Choices</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>You have the following rights regarding your personal information:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Objection:</strong> Object to certain processing of your personal information</li>
                <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us using the information provided below.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Cookies and Tracking Technologies</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                We use cookies and similar tracking technologies to collect and track information and to improve our Service:
              </p>
              <h4 className="font-semibold mt-4">Types of Cookies:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Essential cookies:</strong> Required for the platform to function properly</li>
                <li><strong>Performance cookies:</strong> Help us analyze how the platform is used</li>
                <li><strong>Functional cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Advertising cookies:</strong> Used to deliver relevant advertisements</li>
              </ul>
              <p className="mt-4">
                You can control cookies through your browser settings, but disabling certain cookies may affect platform functionality.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Third-Party Links</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Our platform may contain links to third-party websites or services. We are not responsible for the privacy 
                practices or content of these external sites. We encourage you to review the privacy policies of any 
                third-party sites you visit.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Our Service is not intended for children under 18 years of age. We do not knowingly collect personal 
                information from children under 18. If you become aware that a child has provided us with personal 
                information, please contact us so we can take appropriate action.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                the new Privacy Policy on this page and updating the "Last updated" date. Significant changes will 
                be communicated via email or platform notifications.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>Email:</strong> privacy@rentalpro.com</p>
                <p><strong>Data Protection Officer:</strong> dpo@rentalpro.com</p>
                <p><strong>Address:</strong> RentalPro Privacy Team<br />
                123 Business Street<br />
                City, State 12345</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
