import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { nutritionPlaybookSectionsForGoals } from "@/lib/nutrition-playbooks";
import { onboardingProfileSchema } from "@/lib/onboarding-schema";

export default async function NutritionPage() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { onboardingProfile: true },
  });

  const plan = await prisma.memberNutritionPlan.findUnique({
    where: { userId: session.sub },
    select: { coachNotes: true, updatedAt: true },
  });

  const parsed = onboardingProfileSchema.safeParse(user?.onboardingProfile ?? null);
  const goals = parsed.success ? parsed.data.primaryGoals : [];

  const sections = nutritionPlaybookSectionsForGoals(goals);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold text-gymsanity-950">Nutrition</h1>
        <p className="mt-2 max-w-2xl text-gymsanity-900/75">
          Guidance aligned with the goals you chose in onboarding—plus anything your coach adds for you
          personally.
        </p>
      </div>

      <p className="rounded-xl border border-gymsanity-200 bg-gymsanity-50/80 px-4 py-3 text-xs text-gymsanity-800">
        Educational information only. This is not medical advice. For conditions, medications, or
        allergies, follow your clinician or registered dietitian.
      </p>

      {!parsed.success && (
        <p className="text-sm text-gymsanity-800">
          Complete onboarding so we can tailor playbooks to your selected goals. Until then, a general
          foundation guide is shown below.
        </p>
      )}

      {plan?.coachNotes.trim() ? (
        <section className="rounded-2xl border border-violet-200 bg-violet-50/50 p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-violet-900">
            From your coach
          </h2>
          <p className="mt-1 text-xs text-violet-800/80">
            Updated {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(plan.updatedAt)}
          </p>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gymsanity-950">
            {plan.coachNotes.trim()}
          </div>
        </section>
      ) : (
        <p className="text-sm text-gymsanity-800/80">
          Your coach hasn&apos;t added personalized nutrition notes yet—you still have the goal-based
          guides below.
        </p>
      )}

      <div className="space-y-6">
        {sections.map((s) => (
          <section
            key={s.goalKey}
            className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm shadow-gymsanity-900/5"
          >
            <h2 className="font-display text-xl font-semibold text-gymsanity-950">{s.title}</h2>
            <p className="mt-2 text-sm text-gymsanity-900/80">{s.summary}</p>
            <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-gymsanity-900/85">
              {s.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
