"use client";

import type { LoadHistoryGroupView } from "@/lib/load-history";
import type { LoadWeightUnit } from "@/lib/load-weight-display";
import { LoadProgressionTable } from "@/components/LoadProgressionTable";
import { useEffect, useState } from "react";

const STORAGE_KEY = "gymsanity-load-weight-unit";

export function LoadProgressionPanel({
  groups,
  emptyMessage,
  defaultWeightUnit,
}: {
  groups: LoadHistoryGroupView[];
  emptyMessage: string;
  defaultWeightUnit: LoadWeightUnit;
}) {
  const [weightUnit, setWeightUnit] = useState<LoadWeightUnit>(defaultWeightUnit);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s === "kg" || s === "lbs") setWeightUnit(s);
    } catch {
      /* ignore */
    }
  }, []);

  function onUnitChange(next: LoadWeightUnit) {
    setWeightUnit(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-gymsanity-900">
          Show weight as
          <select
            value={weightUnit}
            onChange={(e) => onUnitChange(e.target.value as LoadWeightUnit)}
            className="rounded-lg border border-gymsanity-200 bg-white px-2 py-1.5 text-gymsanity-950"
          >
            <option value="kg">kg</option>
            <option value="lbs">lbs</option>
          </select>
        </label>
        <p className="text-xs text-gymsanity-700/85">Values are stored in kg; this only changes how numbers are shown.</p>
      </div>
      <LoadProgressionTable groups={groups} emptyMessage={emptyMessage} weightUnit={weightUnit} />
    </div>
  );
}
