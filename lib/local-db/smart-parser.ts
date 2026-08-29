import type { TimelineItem } from "../db/types";

export interface ParsedEntry {
  type: "task" | "routine" | "metric" | "journal";
  label?: string;
  category?: string;
  routineType?: "PLAN" | "ACTUAL";
  metricName?: string;
  metricValue?: number;
  content?: string;
  durationMinutes?: number;
  startTimeIso: string;
  endTimeIso: string;
}

/**
 * Intelligent client-side zero-friction parser for natural language command input.
 * Handles inputs like:
 * - "30 pushups" -> metric entry
 * - "Deep work for 2h" / "Gym 45m" -> routine block
 * - "Buy groceries at 5pm" / "Finish presentation" -> task
 * - Long thoughts or reflections -> journal entry
 */
export function parseNaturalEntry(input: string, activeMetricNames: string[] = []): ParsedEntry {
  const trimmed = input.trim();
  const now = new Date();
  let startTime = new Date(now);
  let durationMinutes = 30;

  // 1. Check for metric pattern: e.g. "30 pushups", "pushups 25", "2.5L water", "water 3"
  const metricMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z\s]+)$/) || trimmed.match(/^([a-zA-Z\s]+)\s+(\d+(?:\.\d+)?)$/);
  if (metricMatch) {
    const isFirstNum = !isNaN(Number(metricMatch[1]));
    const val = isFirstNum ? Number(metricMatch[1]) : Number(metricMatch[2]);
    const name = (isFirstNum ? metricMatch[2] : metricMatch[1]).trim().toLowerCase();

    // Check if matches or resembles any active metric
    const matchedDef = activeMetricNames.find(m => m.toLowerCase().includes(name) || name.includes(m.toLowerCase()));
    if (matchedDef || activeMetricNames.length === 0 || name.length <= 15) {
      return {
        type: "metric",
        metricName: matchedDef || name,
        metricValue: val,
        startTimeIso: startTime.toISOString(),
        endTimeIso: startTime.toISOString(),
      };
    }
  }

  // 2. Check for routine duration keywords: "for 2h", "1h 30m", "45 mins", "focus 2 hours"
  const durationMatch = trimmed.match(/(?:for\s+)?(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours?)\s*(\d+)?\s*(?:m|min|mins|minutes?)?/i) ||
                        trimmed.match(/(\d+)\s*(?:m|min|mins|minutes?)/i);

  const routineKeywords = ["workout", "gym", "sleep", "deep work", "study", "meditate", "reading", "focus", "routine"];
  const containsRoutineKeyword = routineKeywords.some(k => trimmed.toLowerCase().includes(k));

  if (durationMatch || containsRoutineKeyword) {
    if (durationMatch) {
      const hours = durationMatch[1] && trimmed.includes("h") ? parseFloat(durationMatch[1]) : 0;
      const mins = durationMatch[2] ? parseInt(durationMatch[2], 10) : (trimmed.includes("m") && !trimmed.includes("h") ? parseInt(durationMatch[1], 10) : 0);
      durationMinutes = Math.max(15, Math.round(hours * 60 + mins));
    } else {
      durationMinutes = 60; // default 1 hour for routine keywords
    }

    const cleanLabel = trimmed
      .replace(/(?:for\s+)?\d+(?:\.\d+)?\s*(?:h|hr|hrs|hours?)/gi, "")
      .replace(/\d+\s*(?:m|min|mins|minutes?)/gi, "")
      .replace(/^focus\s+/i, "Deep Work: ")
      .trim() || "Focus Session";

    let category = "Focus";
    const lower = cleanLabel.toLowerCase();
    if (lower.includes("gym") || lower.includes("workout") || lower.includes("run") || lower.includes("walk")) category = "Health";
    if (lower.includes("sleep") || lower.includes("rest") || lower.includes("relax")) category = "Rest";
    if (lower.includes("read") || lower.includes("learn") || lower.includes("study")) category = "Learning";

    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    return {
      type: "routine",
      label: cleanLabel,
      category,
      routineType: "ACTUAL",
      durationMinutes,
      startTimeIso: startTime.toISOString(),
      endTimeIso: endTime.toISOString(),
    };
  }

  // 3. Check for Journal reflection: longer sentences, questions, introspective starts
  const journalPrefixes = ["today i", "i feel", "reflecting", "learned", "note:", "journal:"];
  const isJournalLike = trimmed.length > 80 || journalPrefixes.some(p => trimmed.toLowerCase().startsWith(p));

  if (isJournalLike) {
    const cleanContent = trimmed.replace(/^(?:note|journal):\s*/i, "");
    return {
      type: "journal",
      content: cleanContent,
      startTimeIso: startTime.toISOString(),
      endTimeIso: startTime.toISOString(),
    };
  }

  // 4. Default to Actionable Task
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
  return {
    type: "task",
    label: trimmed,
    startTimeIso: startTime.toISOString(),
    endTimeIso: endTime.toISOString(),
  };
}
