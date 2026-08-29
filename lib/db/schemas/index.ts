import { z } from "zod";

export const InsertTaskSchema = z.object({
  label: z.string().describe("The name or title of the task (e.g., 'Do laundry')"),
  start_time: z.string().describe("ISO 8601 UTC timestamp of the task start time."),
  end_time: z.string().describe("ISO 8601 UTC timestamp of the task end time."),
  metadata: z.record(z.string(), z.any()).optional().describe("Optional JSON object. To add subtasks, use the 'waypoints' array: { waypoints: [{ order: 0, title: 'Step 1', completed: false }] }"),
});

export const UpdateTaskSchema = z.object({
  label: z.string().optional().describe("The name or title of the task"),
  completed_at: z.string().nullable().optional().describe("ISO 8601 UTC timestamp of when the task was completed. Pass null to mark as incomplete."),
  start_time: z.string().optional().describe("ISO 8601 UTC timestamp of the task start time."),
  end_time: z.string().optional().describe("ISO 8601 UTC timestamp of the task end time."),
  metadata: z.record(z.string(), z.any()).nullable().optional().describe("Optional JSON object. To add subtasks, use the 'waypoints' array: { waypoints: [{ order: 0, title: 'Step 1', completed: false }] }"),
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

export const InsertMetricEntrySchema = z.object({
  metric_id: z.string().describe("The UUID of the metric definition to log an entry for"),
  value: z.number().describe("The numeric value of the metric entry"),
  start_time: z.string().describe("ISO 8601 UTC timestamp of when the metric measurement started"),
  end_time: z.string().optional().describe("ISO 8601 UTC timestamp of when the metric measurement ended. Defaults to start_time if omitted (point-in-time)."),
});
