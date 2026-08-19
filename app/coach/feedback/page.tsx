import { prisma } from "@/lib/db";
import { CoachFeedbackList } from "@/components/coach/CoachFeedbackList";

export default async function CoachFeedbackPage() {
  const feedback = await prisma.focusGroupFeedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  const serialized = feedback.map((f) => ({
    id: f.id,
    message: f.message,
    rating: f.rating,
    createdAt: f.createdAt.toISOString(),
    user: f.user,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gymsanity-700">Coach</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-gymsanity-950">Focus group feedback</h1>
        <p className="mt-2 max-w-xl text-gymsanity-900/75">
          Notes from focus-group participants — submitted from their Settings page.
        </p>
      </div>
      <CoachFeedbackList feedback={serialized} />
    </div>
  );
}
