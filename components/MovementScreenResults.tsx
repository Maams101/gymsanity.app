import {
  formatMovementScreenLine,
  resolveMovementScreen,
  screenScoreLabel,
  type MovementScreen,
} from "@/lib/movement-screen";
import type { CameraAssessment } from "@/lib/onboarding-schema";

function ScoreBadge({ score }: { score: MovementScreen["deepSquat"]["score"] }) {
  const tone =
    score === 3
      ? "bg-green-100 text-green-900"
      : score === 2
        ? "bg-amber-100 text-amber-950"
        : "bg-gymsanity-100 text-gymsanity-900";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      {score}/3 · {screenScoreLabel(score)}
    </span>
  );
}

export function MovementScreenResults({
  assessment,
  compact = false,
}: {
  assessment: CameraAssessment;
  compact?: boolean;
}) {
  const screen = resolveMovementScreen(assessment);
  const patterns = [screen.deepSquat, screen.shoulderMobility];

  if (compact) {
    return <p>{formatMovementScreenLine(screen)}</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gymsanity-800">{screen.summary}</p>
      <div className="grid gap-3">
        {patterns.map((p) => (
          <article key={p.id} className="rounded-xl border border-gymsanity-100 bg-white/80 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-semibold text-gymsanity-950">{p.name}</h4>
              <ScoreBadge score={p.score} />
            </div>
            <p className="mt-2 text-sm text-gymsanity-800">{p.whatWeSaw}</p>
            <p className="mt-2 text-sm text-gymsanity-900">
              <span className="font-medium">Coaching focus: </span>
              {p.coachingFocus}
            </p>
          </article>
        ))}
      </div>
      <p className="text-xs text-gymsanity-600">
        Scores follow a 1–3 functional movement screen scale (3 = the pattern looked clear on camera). This is a
        coaching snapshot from two poses — not a certified FMS, a diagnosis, or a body-composition test.
      </p>
    </div>
  );
}
