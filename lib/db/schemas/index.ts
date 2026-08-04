import { z } from "zod";

export const InsertTaskSchema = z.object({
  label: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const UpdateTaskSchema = z.object({
  label: z.string().optional(),
  completed_at: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).nullable().optional(),
});

export const InsertRoutineBlockSchema = z.object({
  label: z.string(),
  category: z.string(),
  start_time: z.number(),
  end_time: z.number(),
  type: z.enum(["PLAN", "ACTUAL"]),
});

export const UpdateRoutineBlockSchema = z.object({
  label: z.string().optional(),
  category: z.string().optional(),
  start_time: z.number().optional(),
  end_time: z.number().optional(),
  type: z.enum(["PLAN", "ACTUAL"]).optional(),
});

export const InsertJournalSchema = z.object({
  content: z.string(),
  date: z.string(),
  ai_analysis: z.record(z.string(), z.any()).optional(),
});

export const UpdateJournalSchema = z.object({
  content: z.string().optional(),
  ai_analysis: z.record(z.string(), z.any()).nullable().optional(),
  date: z.string().optional(),
});
