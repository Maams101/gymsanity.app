export type ExercisePairType = "SUPERSET" | "CIRCUIT";

export type LineWithPairing = {
  id: string;
  pairGroupId: string | null;
  pairType: ExercisePairType | null;
  pairOrder: number | null;
};

export type DisplayBlock<T extends LineWithPairing> =
  | { kind: "single"; line: T }
  | { kind: "group"; pairType: ExercisePairType; groupId: string; lines: T[] };

export function groupLinesForDisplay<T extends LineWithPairing>(lines: T[]): DisplayBlock<T>[] {
  const blocks: DisplayBlock<T>[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (seen.has(line.id)) continue;

    if (line.pairGroupId && line.pairType) {
      const groupLines = lines
        .filter((l) => l.pairGroupId === line.pairGroupId)
        .sort((a, b) => (a.pairOrder ?? 0) - (b.pairOrder ?? 0));
      for (const gl of groupLines) seen.add(gl.id);
      blocks.push({
        kind: "group",
        pairType: line.pairType,
        groupId: line.pairGroupId,
        lines: groupLines,
      });
    } else {
      blocks.push({ kind: "single", line });
      seen.add(line.id);
    }
  }

  return blocks;
}

export function pairLetter(order: number | null | undefined): string {
  if (order == null || order < 1) return "";
  return String.fromCharCode(64 + order);
}

export function pairTypeLabel(type: ExercisePairType): string {
  return type === "SUPERSET" ? "Superset" : "Circuit";
}

export function pairFlowHint(type: ExercisePairType, count: number): string {
  if (type === "SUPERSET") {
    return count === 2
      ? "Alternate A → B, then rest between rounds."
      : "Move through each letter back-to-back, then rest.";
  }
  return "Complete A through the last letter, then rest one round.";
}

export function pairSizeForLine<T extends LineWithPairing>(line: T, all: T[]): number {
  if (!line.pairGroupId) return 1;
  return all.filter((l) => l.pairGroupId === line.pairGroupId).length;
}
