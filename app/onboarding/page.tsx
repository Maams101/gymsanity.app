import { OnboardingWizard } from "@/components/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <div className="mt-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gymsanity-700">Welcome</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-gymsanity-950">
        Let&apos;s set the tone
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-gymsanity-900/80">
        A few questions about fitness, goals, habits, and health—so your experience in the app matches
        your real life, not a generic template.
      </p>
      <div className="mt-10">
        <OnboardingWizard />
      </div>
    </div>
  );
}
