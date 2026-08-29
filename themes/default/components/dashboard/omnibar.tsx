"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Sparkles, Mic, Plus } from "lucide-react";
import { parseNaturalEntry } from "@/lib/local-db/smart-parser";
import { createLocalTask } from "@/lib/local-db/tasks";
import { createLocalRoutineBlock } from "@/lib/local-db/routine-blocks";
import { createLocalJournal } from "@/lib/local-db/journals";
import { logLocalEntry, getLocalAvailableMetrics } from "@/lib/local-db/metrics";
import type { LocalMetricDefinition } from "@/lib/local-db";
import styles from "../../theme.module.css";
import { cn } from "@/lib/utils";

interface OmnibarProps {
  userId: string;
  onSuccess: () => void;
}

export function Omnibar({ userId, onSuccess }: OmnibarProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableMetrics, setAvailableMetrics] = useState<LocalMetricDefinition[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadMetrics() {
      const res = await getLocalAvailableMetrics(userId);
      if (res.data) setAvailableMetrics(res.data);
    }
    loadMetrics();
  }, [userId]);

  // Live real-time parsing badge preview
  const liveParsed = React.useMemo(() => {
    if (!text.trim()) return null;
    const metricNames = availableMetrics.map((m) => m.name);
    return parseNaturalEntry(text, metricNames);
  }, [text, availableMetrics]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const parsed = liveParsed || parseNaturalEntry(text, availableMetrics.map((m) => m.name));

      switch (parsed.type) {
        case "task":
          await createLocalTask({
            user_id: userId,
            label: parsed.label || text.trim(),
            start_time: parsed.startTimeIso,
            end_time: parsed.endTimeIso,
          });
          break;
        case "routine":
          await createLocalRoutineBlock({
            user_id: userId,
            label: parsed.label || "Focus Block",
            category: parsed.category || "Focus",
            type: parsed.routineType || "ACTUAL",
            start_time: parsed.startTimeIso,
            end_time: parsed.endTimeIso,
          });
          break;
        case "journal":
          await createLocalJournal({
            user_id: userId,
            content: parsed.content || text.trim(),
            start_time: parsed.startTimeIso,
            end_time: parsed.endTimeIso,
          });
          break;
        case "metric": {
          let metricId = availableMetrics.find(
            (m) => m.name.toLowerCase() === (parsed.metricName || "").toLowerCase()
          )?.id;

          if (!metricId && availableMetrics.length > 0) {
            metricId = availableMetrics[0].id;
          }

          if (metricId) {
            await logLocalEntry(
              userId,
              metricId,
              parsed.metricValue ?? 1,
              parsed.startTimeIso,
              parsed.endTimeIso
            );
          }
          break;
        }
      }

      setText("");
      onSuccess();
    } catch (err) {
      console.error("Omnibar submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "task":
        return "text-blue-300 bg-blue-500/15 border-blue-400/30";
      case "routine":
        return "text-amber-300 bg-amber-500/15 border-amber-400/30";
      case "journal":
        return "text-emerald-300 bg-emerald-500/15 border-emerald-400/30";
      case "metric":
        return "text-purple-300 bg-purple-500/15 border-purple-400/30";
      default:
        return "text-white/50 bg-white/10 border-white/20";
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto shrink-0 z-40 px-1 pb-1">
      <form onSubmit={handleSubmit} className="relative w-full">
        <div
          className={cn(
            "flex items-center px-4 py-2.5 w-full rounded-full border border-white/18 bg-white/[0.08] backdrop-blur-[32px] shadow-[0_16px_48px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.45)] transition-all focus-within:border-white/40 focus-within:bg-white/[0.12]"
          )}
        >
          {/* Real-time Natural Language Detection Pill */}
          <AnimatePresence>
            {liveParsed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                className={cn(
                  "mr-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border shrink-0 font-medium",
                  getBadgeStyle(liveParsed.type)
                )}
              >
                {liveParsed.type}
              </motion.div>
            )}
          </AnimatePresence>

          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type anything (e.g., '30 pushups', 'Deep work 2h', 'Review PRs')..."
            className="bg-transparent border-none outline-none text-xs md:text-[13px] text-white placeholder:text-white/35 w-full font-medium"
            autoComplete="off"
          />

          <button
            type="submit"
            disabled={!text.trim() || isSubmitting}
            className={cn(
              "ml-2 w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer",
              text.trim()
                ? "bg-white text-black hover:bg-white/90 shadow-sm"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            )}
            aria-label="Submit command"
          >
            <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </form>
    </div>
  );
}
