import type { LoadHistoryGroupView } from "@/lib/load-history";
import { formatStoredKgForDisplay, type LoadWeightUnit } from "@/lib/load-weight-display";

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function LoadProgressionTable({
  groups,
  emptyMessage,
  weightUnit = "kg",
}: {
  groups: LoadHistoryGroupView[];
  emptyMessage: string;
  weightUnit?: LoadWeightUnit;
}) {
  if (groups.length === 0) {
    return <p className="text-sm text-gymsanity-800">{emptyMessage}</p>;
  }

  const weightHeader = weightUnit === "lbs" ? "Weight (lbs)" : "Weight (kg)";

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.key} className="rounded-xl border border-gymsanity-100 bg-gymsanity-50/50 p-4">
          <h4 className="font-display text-base font-semibold text-gymsanity-950">{g.displayName}</h4>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gymsanity-200 text-xs font-semibold uppercase tracking-wide text-gymsanity-600">
                  <th className="py-2 pr-3">When</th>
                  <th className="py-2 pr-3">Program</th>
                  <th className="py-2 pr-3">Session</th>
                  <th className="py-2 pr-3">Set</th>
                  <th className="py-2 pr-3">{weightHeader}</th>
                  <th className="py-2 pr-2">Reps</th>
                </tr>
              </thead>
              <tbody>
                {g.entries.map((e) => (
                  <tr key={e.id} className="border-b border-gymsanity-100/80 text-gymsanity-900/90">
                    <td className="py-2 pr-3 whitespace-nowrap">{formatWhen(e.loggedAt)}</td>
                    <td className="py-2 pr-3">{e.programTitle}</td>
                    <td className="py-2 pr-3">{e.dayTitle}</td>
                    <td className="py-2 pr-3">{e.setIndex}</td>
                    <td className="py-2 pr-3 font-medium text-gymsanity-950">
                      {formatStoredKgForDisplay(e.weightKg, weightUnit)}
                    </td>
                    <td className="py-2 pr-2">{e.reps != null ? e.reps : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
