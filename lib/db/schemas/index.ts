import { z } from "zod";

export const InsertTaskSchema = z.object({
  label: z.string().describe("The name or title of the task (e.g., 'Do laundry')"),
  due_date: z.string().nullable().optional().describe("ISO 8601 UTC timestamp of the task due date. Pass null for no due date."),
  metadata: z.record(z.string(), z.any()).optional().describe("Optional key-value JSON object for any extra task details"),
});

export const UpdateTaskSchema = z.object({
  label: z.string().optional().describe("The name or title of the task"),
  completed_at: z.string().nullable().optional().describe("ISO 8601 UTC timestamp of when the task was completed. Pass null to mark as incomplete."),
  due_date: z.string().nullable().optional().describe("ISO 8601 UTC timestamp of the task due date. Pass null for no due date."),
  metadata: z.record(z.string(), z.any()).nullable().optional().describe("Optional key-value JSON object for any extra task details"),
});

export const InsertRoutineBlockSchema = z.object({
  label: z.string().describe("The title of the routine block (e.g., 'Morning Focus')"),
  category: z.string().describe("A category group for the block (e.g., 'Work', 'Health', 'Leisure')"),
  start_time: z.string().describe("The start time as an ISO 8601 UTC timestamp string"),
  end_time: z.string().describe("The end time as an ISO 8601 UTC timestamp string"),
  type: z.enum(["PLAN", "ACTUAL"]).describe("Must be PLAN for scheduled blocks, or ACTUAL for tracked time."),
});

export const UpdateRoutineBlockSchema = z.object({
  label: z.string().optional().describe("The title of the routine block"),
  category: z.string().optional().describe("A category group for the block"),
  start_time: z.string().optional().describe("The start time as an ISO 8601 UTC timestamp string"),
  end_time: z.string().optional().describe("The end time as an ISO 8601 UTC timestamp string"),
  type: z.enum(["PLAN", "ACTUAL"]).optional().describe("Must be PLAN or ACTUAL"),
});

export const InsertJournalSchema = z.object({
  content: z.string().describe("The actual text content of the journal entry"),
  start_time: z.string().describe("ISO 8601 UTC timestamp of the start of the time frame"),
  end_time: z.string().describe("ISO 8601 UTC timestamp of the end of the time frame"),
  ai_analysis: z.record(z.string(), z.any()).optional().describe("Optional structured AI analysis of the journal entry"),
});

export const UpdateJournalSchema = z.object({
  content: z.string().optional().describe("The actual text content of the journal entry"),
  ai_analysis: z.record(z.string(), z.any()).nullable().optional().describe("Optional structured AI analysis of the journal entry"),
  start_time: z.string().optional().describe("ISO 8601 UTC timestamp of the start of the time frame"),
  end_time: z.string().optional().describe("ISO 8601 UTC timestamp of the end of the time frame"),
});
