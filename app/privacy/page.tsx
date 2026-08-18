import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy — Gymsanity",
  description: "How Gymsanity collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy" lastUpdated="August 15, 2026">
      <p>
        Gymsanity (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the Gymsanity fitness platform at{" "}
        <a href="https://gymsanity.fit" className="text-gymsanity-700 underline">
          gymsanity.fit
        </a>{" "}
        and related mobile applications. This Privacy Policy explains what information we collect, how we
        use it, and the choices you have.
      </p>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Information we collect</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Account information:</strong> name, email address, password (stored as a secure hash),
            and membership plan details when you register or subscribe.
          </li>
          <li>
            <strong>Newsletter:</strong> email address and optional first name when you join the Gymsanity
            list when you create an account.
          </li>
          <li>
            <strong>Workout and program data:</strong> assigned programs, session completion, logged sets and
            reps, rest timers, workout-of-the-day attempts, and progress notes you enter in the app.
          </li>
          <li>
            <strong>Onboarding and camera assessment:</strong> if you complete the optional camera-based
            onboarding assessment, pose metrics are processed on your device to estimate movement patterns.
            We store summary results you submit—not raw video—unless you explicitly choose to share media with
            your coach.
          </li>
          <li>
            <strong>Health and recovery estimates:</strong> goals, sleep and nutrition logs, recovery
            check-ins, and derived estimates (for example macro targets or body-composition estimates from
            height, weight, and activity). These are informational only and are not medical diagnoses.
          </li>
          <li>
            <strong>Payment information:</strong> subscriptions and one-time purchases are processed by
            Stripe. We receive billing status, plan identifiers, and limited customer metadata from Stripe—we
            do not store full card numbers on our servers.
          </li>
          <li>
            <strong>Device and usage data:</strong> basic logs such as IP address, browser or app version, and
            pages or features used, to keep the service secure and reliable.
          </li>
          <li>
            <strong>Third-party fitness integrations:</strong> if you connect services such as Apple Health,
            Google Fit, or similar providers, we receive only the data types you authorize for sync (for
            example activity or sleep summaries).
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">How we use information</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide programming, coaching, booking, and account management.</li>
          <li>Personalize workouts, recovery guidance, and progress tracking.</li>
          <li>Process payments and manage subscriptions through Stripe.</li>
          <li>Communicate about your account, sessions, and service updates.</li>
          <li>
            Send optional newsletter emails (training notes and studio updates) if you are on the list.
            Every newsletter includes an unsubscribe link.
          </li>
          <li>Improve features, fix bugs, and protect against fraud or abuse.</li>
          <li>Comply with legal obligations.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Camera and sensors</h2>
        <p>
          Camera access is requested only for features that need it (such as the optional onboarding
          assessment). You may deny camera permission and still use most of the app. Pose processing during
          onboarding is designed to run locally in your browser or WebView where possible.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Health disclaimer</h2>
        <p>
          Gymsanity provides fitness programming and educational estimates. It is not a medical device and
          does not provide medical advice. Always consult a qualified healthcare professional before starting
          or changing an exercise program, especially if you have injuries, pregnancy, or chronic
          conditions. Stop exercising and seek medical care if you experience pain, dizziness, or other
          concerning symptoms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Sharing</h2>
        <p>We do not sell your personal information. We may share data with:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Service providers</strong> (hosting, email, analytics, payment processing) under contracts
            that limit use to providing services to us.
          </li>
          <li>
            <strong>Your coach</strong> when you are enrolled in coaching—relevant workout, onboarding, and
            progress data may be visible to assigned coaches.
          </li>
          <li>
            <strong>Legal requirements</strong> when required by law or to protect rights, safety, and
            security.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Retention and security</h2>
        <p>
          We retain account and workout data while your account is active and as needed for legal, tax, or
          operational purposes. We use industry-standard safeguards including encrypted connections (HTTPS)
          and access controls. No method of transmission or storage is 100% secure.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Your choices</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Update profile information in Settings.</li>
          <li>Disconnect third-party fitness integrations in Settings.</li>
          <li>Manage or cancel subscriptions via Stripe customer portal (linked from billing flows).</li>
          <li>
            Unsubscribe from the newsletter via the link in any newsletter email, or from Settings if you
            have an account.
          </li>
          <li>
            Request account deletion or a copy of your data by contacting{" "}
            <a href="mailto:privacy@gymsanity.fit" className="text-gymsanity-700 underline">
              privacy@gymsanity.fit
            </a>
            .
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Children</h2>
        <p>
          Gymsanity is not directed to children under 13 (or the minimum age in your jurisdiction). We do not
          knowingly collect personal information from children.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Changes</h2>
        <p>
          We may update this policy from time to time. We will post the revised version on this page and
          update the &quot;Last updated&quot; date. Continued use after changes constitutes acceptance of the
          updated policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-gymsanity-950">Contact</h2>
        <p>
          Questions about this Privacy Policy:{" "}
          <a href="mailto:privacy@gymsanity.fit" className="text-gymsanity-700 underline">
            privacy@gymsanity.fit
          </a>
        </p>
      </section>
    </LegalDocument>
  );
}
