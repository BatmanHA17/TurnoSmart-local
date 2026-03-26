import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms & Conditions</h1>
          <p className="text-sm text-muted-foreground">Last updated: January 2025</p>
        </div>

        {/* Content */}
        <div className="prose max-w-none text-sm text-muted-foreground space-y-6 font-sans">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing and using TurnoSmart ("Service"), you accept and agree to be bound by the terms and provision of this agreement.
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of TurnoSmart per device for personal, non-commercial transitory viewing only.
              This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>modify or copy the materials</li>
              <li>use the materials for any commercial purpose or for any public display</li>
              <li>attempt to reverse engineer any software contained in TurnoSmart</li>
              <li>remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. User Accounts</h2>
            <p>
              When you create an account with us, you must provide information that is accurate, complete, and current at all times.
              You are responsible for safeguarding the password and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Prohibited Uses</h2>
            <p>
              You may not use our service:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>For any unlawful purpose or to solicit others to unlawful acts</li>
              <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
              <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              <li>To submit false or misleading information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Service Availability</h2>
            <p>
              We reserve the right to withdraw or amend our service, and any service or material we provide via TurnoSmart,
              in our sole discretion without notice. We will not be liable if for any reason all or any part of TurnoSmart
              is unavailable at any time or for any period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Disclaimer</h2>
            <p>
              The information on TurnoSmart is provided on an "as is" basis. To the fullest extent permitted by law,
              this Company excludes all representations, warranties, conditions and terms related to our website and the use of this website.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Limitations</h2>
            <p>
              In no event shall TurnoSmart or its suppliers be liable for any damages (including, without limitation,
              damages for loss of data or profit, or due to business interruption) arising out of the use or inability
              to use TurnoSmart, even if TurnoSmart or a TurnoSmart authorized representative has been notified orally
              or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Revisions and Errata</h2>
            <p>
              The materials appearing on TurnoSmart could include technical, typographical, or photographic errors.
              TurnoSmart does not warrant that any of the materials on its website are accurate, complete, or current.
              TurnoSmart may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of Spain
              and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Contact Information</h2>
            <p>
              If you have any questions about these Terms & Conditions, please contact us at goturnosmart@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}