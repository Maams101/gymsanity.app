import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Terms of Service — Gymsanity",
  description: "Terms governing your use of the Gymsanity platform.",
};

export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Service" lastUpdated="August 15, 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of Gymsanity&apos;s website,
        mobile applications, and related services (collectively, the &quot;Service&quot;). By creating an
        account or using the Service, you agree to these Terms.
      </p>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Eligibility</h2>
        <p>
          You must be at least 18 years old (or the age of majority in your jurisdiction) to subscribe. If
          you are using the Service on behalf of an organization, you represent that you have authority to
          bind that organization.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your login credentials and for all
          activity under your account. Notify us promptly at{" "}
          <a href="mailto:support@gymsanity.fit" className="text-gymsanity-700 underline">
            support@gymsanity.fit
          </a>{" "}
          if you suspect unauthorized access.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Membership and billing</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Paid plans renew automatically according to the billing interval shown at checkout unless
            canceled.
          </li>
          <li>
            Payments are processed by Stripe. Taxes may apply based on your location.
          </li>
          <li>
            Refund policies, if any, are stated at purchase or in your plan description. Unless required by
            law, fees are non-refundable once a billing period has started.
          </li>
          <li>
            We may change plan features or pricing with reasonable notice; continued use after the effective
            date constitutes acceptance.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Mobile app stores</h2>
        <p>
          If you download Gymsanity through the Apple App Store or Google Play, additional store terms may
          apply. For iOS, Apple is not a party to these Terms and has no obligation to furnish maintenance or
          support for the app. Billing disputes for in-app purchases (if offered) are handled according to the
          applicable store&apos;s policies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Fitness and health disclaimer</h2>
        <p>
          Gymsanity provides exercise programming, coaching tools, and educational content. The Service is
          not medical advice and is not a substitute for professional healthcare. You participate in
          workouts at your own risk. Consult a physician before beginning any exercise program. We do not
          guarantee specific fitness outcomes.
        </p>
        <p>
          Estimates shown in the app (including macros, recovery scores, or body-composition estimates) are
          approximations for planning purposes only.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Acceptable use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Use the Service for unlawful purposes or to harass others.</li>
          <li>Attempt to access other users&apos; accounts or our systems without authorization.</li>
          <li>Reverse engineer, scrape, or overload the Service.</li>
          <li>Upload malware or content that infringes third-party rights.</li>
          <li>Misrepresent your identity or coaching credentials.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Coaching and sessions</h2>
        <p>
          Group and 1:1 sessions are subject to scheduling, capacity, and cancellation policies shown in the
          app. Credits and session packs are non-transferable unless we expressly allow otherwise.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Intellectual property</h2>
        <p>
          Gymsanity and its licensors own the Service, including software, branding, and program content.
          You receive a limited, non-exclusive, non-transferable license to use the Service for personal,
          non-commercial fitness purposes in accordance with these Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Privacy</h2>
        <p>
          Our collection and use of personal information is described in the{" "}
          <a href="/privacy" className="text-gymsanity-700 underline">
            Privacy Policy
          </a>
          , which is incorporated into these Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Newsletter</h2>
        <p>
          Creating an account adds you to the Gymsanity email list for occasional training notes and studio
          updates. You may unsubscribe at any time using the link in those emails or from Settings. Account
          and billing messages are separate from the newsletter.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Termination</h2>
        <p>
          You may stop using the Service and cancel your subscription at any time through account settings or
          the Stripe customer portal. We may suspend or terminate access for violations of these Terms or to
          protect the Service and other users. Provisions that by their nature should survive termination
          (including disclaimers and limitations of liability) will survive.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY
          KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, GYMSANITY AND ITS AFFILIATES WILL NOT BE LIABLE FOR ANY
          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR
          GOODWILL, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE
          SERVICE IS LIMITED TO THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS BEFORE THE CLAIM, OR ONE
          HUNDRED U.S. DOLLARS ($100), WHICHEVER IS GREATER.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Governing law</h2>
        <p>
          These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict-of-law
          principles, except where mandatory consumer protection laws in your country of residence apply.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Changes</h2>
        <p>
          We may modify these Terms by posting an updated version on this page. Material changes will be
          communicated where required by law. Your continued use after the effective date constitutes
          acceptance.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Contact</h2>
        <p>
          Questions about these Terms:{" "}
          <a href="mailto:support@gymsanity.fit" className="text-gymsanity-700 underline">
            support@gymsanity.fit
          </a>
        </p>
      </section>
    </LegalDocument>
  );
}
