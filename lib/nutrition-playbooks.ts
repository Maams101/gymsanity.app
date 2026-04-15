/**
 * Goal-aligned nutrition playbooks (education only — not medical advice).
 * Keys match onboarding `primaryGoals` in lib/onboarding-schema.ts.
 */
export type NutritionGoalKey =
  | "strength"
  | "fat_loss"
  | "mobility"
  | "performance"
  | "mental_health"
  | "routine"
  | "general_health";

export type NutritionPlaybookSection = {
  goalKey: NutritionGoalKey;
  title: string;
  summary: string;
  bullets: string[];
};

const PLAYBOOKS: Record<NutritionGoalKey, NutritionPlaybookSection> = {
  strength: {
    goalKey: "strength",
    title: "Fuel for strength",
    summary:
      "Support recovery and progressive overload with enough energy and protein spread across the day.",
    bullets: [
      "Aim for protein at each main meal; add a post-training snack if sessions are long or late.",
      "Carbs around harder sessions help performance—don’t fear them on training days.",
      "Hydration and sleep do more for strength gains than any single supplement.",
      "If you’re gaining weight slowly for muscle, a modest calorie surplus beats aggressive bulking for most people.",
    ],
  },
  fat_loss: {
    goalKey: "fat_loss",
    title: "Nutrition for sustainable fat loss",
    summary: "Consistency and protein protect muscle while you run a controlled deficit.",
    bullets: [
      "Prioritize protein and fiber-rich foods to stay full on fewer calories.",
      "Build the deficit from habits you can keep (portion awareness, fewer liquid calories) rather than extreme cuts.",
      "Keep training fuel adequate on hard days so performance (and mood) don’t crash.",
      "Weekly averages matter more than one perfect day.",
    ],
  },
  mobility: {
    goalKey: "mobility",
    title: "Anti-inflammatory basics",
    summary: "Gentle nutrition patterns can support tissue health alongside your movement work.",
    bullets: [
      "Colorful plants (berries, greens, peppers) and omega-3–rich foods are simple wins.",
      "Stay hydrated; dehydration shows up as stiffness and fatigue.",
      "Alcohol and very low energy intake can slow recovery—trend better, not perfect.",
      "Pair nutrition changes with sleep and stress care from your onboarding.",
    ],
  },
  performance: {
    goalKey: "performance",
    title: "Performance fueling",
    summary: "Time energy around sessions and protect recovery between them.",
    bullets: [
      "Pre-session: familiar carbs + a little protein 1–3 hours before; avoid brand-new foods on game day.",
      "Intra-session fluids + electrolytes if you sweat heavily or train over an hour hard.",
      "Post-session: carbs + protein within a few hours—not magic timing, just don’t skip fuel entirely.",
      "Travel and early mornings: pack portable carbs you tolerate well.",
    ],
  },
  mental_health: {
    goalKey: "mental_health",
    title: "Steady fuel, steadier mood",
    summary: "Regular meals and gentle blood-sugar stability support nervous system regulation.",
    bullets: [
      "Eat at semi-regular times; long gaps can amplify irritability and cravings for many people.",
      "Include protein + complex carbs together when you can.",
      "Caffeine late in the day can disrupt sleep—your playbook already tracks sleep; protect it.",
      "Restrictive dieting often backfires emotionally; prefer flexible structure with your coach.",
    ],
  },
  routine: {
    goalKey: "routine",
    title: "Simple systems",
    summary: "Repeatable meals and grocery rhythms beat perfect macros when life is busy.",
    bullets: [
      "Pick 2–3 breakfast and lunch templates you enjoy; rotate weekly.",
      "Batch-cook one protein and one carb on a low-stress day.",
      "Keep a short grocery list on your phone; restock the same staples.",
      "Small prep (washed fruit, cut veg) makes healthy choices the default.",
    ],
  },
  general_health: {
    goalKey: "general_health",
    title: "Foundations for longevity",
    summary: "Broad, minimally processed patterns that support energy and long-term health.",
    bullets: [
      "Half the plate plants, quarter protein, quarter whole grains or starchy veg—flexible, not rigid.",
      "Fish, legumes, nuts, olive oil, yogurt: rotate protein sources across the week.",
      "Limit ultra-processed foods as a trend, not a moral rule.",
      "Water, sleep, and steps amplify anything you do with food.",
    ],
  },
};

const GOAL_KEYS = new Set<string>(Object.keys(PLAYBOOKS));

export function isNutritionGoalKey(k: string): k is NutritionGoalKey {
  return GOAL_KEYS.has(k);
}

/** One section per selected goal, in the order the member listed them; deduped. */
export function nutritionPlaybookSectionsForGoals(goals: string[]): NutritionPlaybookSection[] {
  const seen = new Set<NutritionGoalKey>();
  const out: NutritionPlaybookSection[] = [];
  for (const g of goals) {
    if (!isNutritionGoalKey(g)) continue;
    if (seen.has(g)) continue;
    seen.add(g);
    out.push(PLAYBOOKS[g]);
  }
  if (out.length === 0) {
    out.push(PLAYBOOKS.general_health);
  }
  return out;
}
