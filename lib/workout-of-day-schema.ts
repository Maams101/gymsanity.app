import { z } from "zod";

export const wodBlockSchema = z.object({
  name: z.string().min(1).max(200),
  prescription: z.string().min(1).max(500),
  setCount: z.number().int().min(1).max(20).default(3),
});

export type WodBlock = z.infer<typeof wodBlockSchema>;

export const workoutOfDayWriteSchema = z.object({
  dayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  blocks: z.array(wodBlockSchema).min(1).max(20),
  published: z.boolean().optional(),
});

export type WorkoutOfDayWrite = z.infer<typeof workoutOfDayWriteSchema>;

export const wodAttemptSchema = z.object({
  wodId: z.string().min(1),
  note: z.string().max(2000).optional(),
});

export function parseWodBlocks(raw: unknown): WodBlock[] {
  const arr = z.array(wodBlockSchema).safeParse(raw);
  return arr.success ? arr.data : [];
}
