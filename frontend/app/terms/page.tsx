'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppNavigation } from '@/components/app-navigation';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Agreement to Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                By accessing and using RentalPro ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Rental Services</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                RentalPro provides an online platform for equipment rental services. We facilitate connections between equipment owners and renters, 
                but we are not directly involved in the rental transactions.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>All rental agreements are between the equipment owner and the renter</li>
                <li>We do not guarantee the condition, safety, or legality of any equipment</li>
                <li>Users are responsible for verifying equipment specifications and conditions</li>
                <li>Insurance and liability arrangements must be made between parties</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. User Accounts</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                To use certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Equipment Listings</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Equipment owners who list their items on our platform agree to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide accurate descriptions and specifications</li>
                <li>Ensure equipment is in safe, working condition</li>
                <li>Maintain appropriate insurance coverage</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Honor confirmed rental agreements</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Payment and Fees</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Our platform may charge service fees for facilitating rentals:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Service fees are clearly disclosed before transaction completion</li>
                <li>Payment processing is handled by secure third-party providers</li>
                <li>Refund policies vary by equipment owner and rental terms</li>
                <li>Disputes should first be resolved between rental parties</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Prohibited Uses</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                You may not use our Service to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Post false, misleading, or fraudulent content</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Interfere with platform security or functionality</li>
                <li>Use automated systems to access the platform</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Liability and Disclaimers</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                The Service is provided "as is" without warranties of any kind. We disclaim all liability for:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Equipment condition, safety, or performance</li>
                <li>Actions or omissions of platform users</li>
                <li>Damages arising from equipment use</li>
                <li>Service interruptions or technical issues</li>
                <li>Loss of data or business opportunities</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Privacy and Data</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information. 
                By using our Service, you consent to our data practices as described in the Privacy Policy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Termination</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                We may terminate or suspend your account and access to the Service at our sole discretion, without prior notice, 
                for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of significant changes via email 
                or platform announcements. Continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                If you have questions about these Terms, please contact us at:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>Email:</strong> legal@rentalpro.com</p>
                <p><strong>Address:</strong> RentalPro Legal Department<br />
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
