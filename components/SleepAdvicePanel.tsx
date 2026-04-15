import { SleepAdviceSlideshow } from "@/components/SleepAdviceSlideshow";
import { sleepAdviceIntro, sleepAdviceSections } from "@/lib/sleep-advice";

export function SleepAdvicePanel() {
  return (
    <aside className="space-y-5 rounded-2xl border border-gymsanity-100 bg-gymsanity-50/60 p-6 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gymsanity-700">
          Sleep & recovery lab
        </p>
        <h2 className="mt-2 font-display text-lg font-semibold text-gymsanity-950">
          Evidence-based habits
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gymsanity-900/80">{sleepAdviceIntro}</p>
      </div>

      <SleepAdviceSlideshow sections={sleepAdviceSections} />

      <p className="text-xs leading-relaxed text-gymsanity-700/90">
        This is general education, not medical advice. Talk to a clinician if you have insomnia, sleep
        apnea symptoms, or chronic fatigue.
      </p>
    </aside>
  );
}
