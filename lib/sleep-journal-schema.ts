import { z } from "zod";

const dateRe = /^\d{4}-\d{2}-\d{2}$/;

export const sleepJournalUpsertSchema = z.object({
  entryDate: z.string().regex(dateRe, "Use YYYY-MM-DD."),
  hoursAsleep: z.coerce.number().min(0).max(24),
  bedtimeRoutine: z.string().max(8000).default(""),
  dreamsRecalled: z.string().max(8000).default(""),
});

export type SleepJournalUpsertInput = z.infer<typeof sleepJournalUpsertSchema>;
