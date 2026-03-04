import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12 px-6 hero-gradient">
      <div className="container mx-auto max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card className="border-border/40">
          <CardContent className="p-8 md:p-12">
            <h1 className="font-cormorant text-4xl font-bold text-primary mb-2">Terms & Conditions</h1>
            <p className="text-muted-foreground mb-8">Last updated: February 2026</p>

            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using Onda's platform, mobile application, or website (collectively, the "Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Onda is a marketplace platform that connects clients seeking beauty services with independent beauty professionals ("Stylists"). We facilitate bookings, payments, and communications but do not directly provide beauty services. Stylists are independent contractors, not employees of Onda.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To use certain features of our Service, you must create an account. You agree to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Promptly update your information if it changes</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Not share your account or login credentials with others</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Booking & Services</h2>
                <h3 className="text-xl font-semibold text-foreground mb-3">4.1 For Clients</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Bookings are subject to Stylist availability and acceptance</li>
                  <li>You agree to be present at the scheduled time and location</li>
                  <li>Cancellations must be made at least 24 hours in advance for a full refund</li>
                  <li>Late cancellations (less than 24 hours) may incur a 50% fee</li>
                  <li>No-shows will be charged the full service amount</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-foreground mb-3">4.2 For Stylists</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>You must maintain valid professional licenses and certifications</li>
                  <li>You are responsible for your own equipment, supplies, and insurance</li>
                  <li>You agree to arrive on time and provide services as described</li>
                  <li>Repeated cancellations may result in account suspension</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Payments & Fees</h2>
                <h3 className="text-xl font-semibold text-foreground mb-3">5.1 Client Payments</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>All payments are processed securely through Stripe</li>
                  <li>Prices displayed include the service fee but may not include travel costs</li>
                  <li>Travel costs are calculated based on distance and displayed before booking confirmation</li>
                  <li>Tips are optional and go directly to the Stylist</li>
                  <li>You authorize us to charge your payment method for all applicable fees</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mb-3">5.2 Stylist Payments</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Onda charges a platform fee of 15% on each transaction</li>
                  <li>Flexible payout options: instant, daily, weekly, or monthly withdrawals</li>
                  <li>Minimum withdrawal amount is $25</li>
                  <li>Stylists are responsible for their own tax obligations</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mb-3">5.3 Refunds</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Full refunds are available for cancellations made 24+ hours in advance</li>
                  <li>Partial refunds may be issued for service issues at our discretion</li>
                  <li>Disputes must be reported within 48 hours of the service</li>
                  <li>Refunds are processed to the original payment method within 5-10 business days</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Prohibited Conduct</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You agree not to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Violate any laws or regulations</li>
                  <li>Infringe on the rights of others</li>
                  <li>Use the Service for fraudulent purposes</li>
                  <li>Harass, threaten, or discriminate against any user</li>
                  <li>Post false, misleading, or defamatory content</li>
                  <li>Circumvent platform payments or fees</li>
                  <li>Create multiple accounts for fraudulent purposes</li>
                  <li>Scrape or collect user data without authorization</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Liability & Disclaimers</h2>
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
                  <p className="text-destructive font-semibold mb-2">Important Liability Notice</p>
                  <p className="text-muted-foreground text-sm">
                    Please read this section carefully. It affects your legal rights regarding claims against Onda and Stylists.
                  </p>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong>Independent Contractor Status:</strong> All Stylists on the Onda platform operate as independent contractors, not employees. Onda does not employ, supervise, direct, or control Stylists. Stylists are solely responsible for the services they provide, including the quality, outcomes, and safety of those services.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong>Service Outcomes & Damage:</strong> Onda is not liable for any service outcomes, including but not limited to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Unsatisfactory haircuts, styling, or colouring results</li>
                  <li>Allergic reactions to products used during services</li>
                  <li>Damage to hair, skin, or nails resulting from treatments</li>
                  <li>Burns, cuts, or other injuries during service delivery</li>
                  <li>Damage to personal property during mobile service visits</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong>Professional Liability:</strong> Clients must direct any claims for damage, injury, or unsatisfactory service directly to the Stylist who performed the service. We strongly recommend:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                  <li>Requesting a patch test 48 hours before chemical treatments</li>
                  <li>Discussing allergies and sensitivities before service commencement</li>
                  <li>Verifying Stylist qualifications and insurance before booking</li>
                  <li>Taking before/after photos for your records</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong>Limitation of Liability:</strong> To the maximum extent permitted by Australian Consumer Law and New Zealand Consumer Guarantees Act, Onda shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including lost profits, lost data, or business interruption. Our total liability shall not exceed the amount you paid through our platform in the 12 months preceding the claim.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong>Stylist Insurance Requirement:</strong> Stylists are required to maintain appropriate professional indemnity and public liability insurance of not less than AUD $1,000,000. However, Onda does not verify or guarantee that Stylists maintain such coverage. Clients should verify insurance status directly with their chosen Stylist before service.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Consumer Guarantees:</strong> Nothing in these Terms excludes, restricts, or modifies any rights you may have under the Australian Consumer Law or New Zealand Consumer Guarantees Act that cannot be excluded, restricted, or modified by agreement.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Dispute Resolution Process</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you have a complaint about a service received through Onda:
                </p>
                <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mb-4">
                  <li><strong>Contact the Stylist:</strong> First, attempt to resolve the issue directly with the Stylist within 48 hours of service completion.</li>
                  <li><strong>Report to Onda:</strong> If unresolved, submit a formal complaint through our app or email support@onda.com.au within 7 days.</li>
                  <li><strong>Investigation:</strong> We will investigate complaints and may facilitate communication between parties.</li>
                  <li><strong>Mediation:</strong> For disputes over AUD $500, we may require mediation before any legal action.</li>
                  <li><strong>External Resolution:</strong> Unresolved disputes may be referred to the relevant consumer protection authority.</li>
                </ol>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Time Limits:</strong> Claims for service issues must be submitted within 30 days of the service date. Onda reserves the right to decline claims submitted after this period.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The Onda name, logo, and all content on our platform are protected by intellectual property laws. You may not use our trademarks or content without written permission.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">10. Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to suspend or terminate your account at any time for violations of these Terms or for any other reason at our sole discretion. You may close your account at any time by contacting support.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">11. Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms are governed by the laws of Queensland, Australia. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of Queensland, Australia. For users in New Zealand, certain provisions of the New Zealand Consumer Guarantees Act will apply and cannot be excluded.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">12. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update these Terms from time to time. We will notify you of material changes via email or through the platform. Continued use of the Service after changes constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">13. Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For questions about these Terms, please contact us:
                </p>
                <div className="mt-4 p-4 bg-card rounded-lg border border-border/40">
                  <p className="text-foreground font-semibold">Onda Legal Team</p>
                  <p className="text-muted-foreground">Email: legal@onda.com.au</p>
                  <p className="text-muted-foreground">Phone: 1300 BEAUTY (1300 232 889)</p>
                  <p className="text-muted-foreground">Address: 1/25 Ahern Street, Labrador QLD 4215, Australia</p>
                  <p className="text-muted-foreground mt-2">ABN: To be registered</p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
