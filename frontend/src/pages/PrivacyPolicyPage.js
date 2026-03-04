import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen py-12 px-6 hero-gradient">
      <div className="container mx-auto max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card className="border-border/40">
          <CardContent className="p-8 md:p-12">
            <h1 className="font-cormorant text-4xl font-bold text-primary mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: January 2026</p>

            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to Onda ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the "Platform").
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Account Information:</strong> Name, email address, phone number, and password when you create an account.</li>
                  <li><strong>Profile Information:</strong> Profile photos, service preferences, and location data.</li>
                  <li><strong>Payment Information:</strong> Credit card details, billing address, and transaction history. Payment processing is handled securely by Stripe.</li>
                  <li><strong>Biometric Data:</strong> If you choose to enable passkey authentication, we store cryptographic public keys associated with your biometric authentication. We do not store actual biometric data (fingerprints, facial scans).</li>
                  <li><strong>Communications:</strong> Messages exchanged between clients and stylists through our platform.</li>
                  <li><strong>Location Data:</strong> With your permission, we collect location data to connect you with nearby stylists and calculate travel distances.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Connect clients with beauty professionals</li>
                  <li>Send promotional communications (with your consent)</li>
                  <li>Respond to your comments, questions, and requests</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                  <li>Detect, investigate, and prevent fraudulent transactions and abuse</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Payment Processing & Security</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  All payment transactions are processed through Stripe, a PCI-DSS compliant payment processor. We do not store complete credit card numbers on our servers.
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>Secure Processing:</strong> All payment data is encrypted using industry-standard TLS encryption.</li>
                  <li><strong>Tokenization:</strong> Stripe replaces sensitive card data with secure tokens.</li>
                  <li><strong>Fraud Prevention:</strong> We employ fraud detection measures to protect against unauthorized transactions.</li>
                  <li><strong>Refunds:</strong> Refund requests are processed according to our Refund Policy.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Information Sharing</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We may share your information in the following circumstances:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>With Service Providers:</strong> We share information with stylists to facilitate bookings and service delivery.</li>
                  <li><strong>With Payment Processors:</strong> Transaction data is shared with Stripe for payment processing.</li>
                  <li><strong>For Legal Compliance:</strong> We may disclose information if required by law or to protect our rights.</li>
                  <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  We do not sell your personal information to third parties.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Data Retention</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We retain your personal information for as long as your account is active or as needed to provide services. We may retain certain information for legitimate business purposes, such as fraud prevention and financial record-keeping requirements (typically 7 years for transaction records).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Your Rights</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Depending on your location, you may have the following rights:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Access and receive a copy of your personal data</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to or restrict processing of your data</li>
                  <li>Data portability</li>
                  <li>Withdraw consent at any time</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement appropriate technical and organizational measures to protect your personal information, including encryption, secure servers, and regular security audits. However, no method of transmission over the Internet is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have questions about this Privacy Policy or our data practices, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-card rounded-lg border border-border/40">
                  <p className="text-foreground font-semibold">Onda Privacy Team</p>
                  <p className="text-muted-foreground">Email: privacy@onda.com.au</p>
                  <p className="text-muted-foreground">Address: 123 Beauty Lane, New York, NY 10001</p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
