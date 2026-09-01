"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Trash2, Calendar } from "lucide-react";
import type { RoutineBlock } from "@/lib/db/types";
import { createLocalRoutineBlock, updateLocalRoutineBlock, deleteLocalRoutineBlock } from "@/lib/local-db/routine-blocks";
import { VisionOSTimeRangePicker } from "../time-range-picker";
import { cn } from "@/lib/utils";

interface RoutinePaneProps {
  routine?: RoutineBlock | null;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  "Deep Work",
  "Health & Fitness",
  "Learning",
  "Rituals",
  "Social",
  "Rest & Leisure",
] as const;

const toLocalIso = (dateStr?: string | null, offsetMinutes: number = 0) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (offsetMinutes) d.setMinutes(d.getMinutes() + offsetMinutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function RoutinePane({ routine, userId, onClose, onSuccess }: RoutinePaneProps) {
  const isEditing = !!routine;

  const [label, setLabel] = useState(routine?.label || "");
  const [category, setCategory] = useState(routine?.category || "Deep Work");
  const [type, setType] = useState<"PLAN" | "ACTUAL">(routine?.type === "PLAN" ? "PLAN" : "ACTUAL");
  const [startTime, setStartTime] = useState(toLocalIso(routine?.start_time));
  const [endTime, setEndTime] = useState(routine?.end_time ? toLocalIso(routine.end_time) : toLocalIso(null, 60));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const startIso = new Date(startTime).toISOString();
      const endIso = new Date(endTime).toISOString();

      if (isEditing && routine) {
        await updateLocalRoutineBlock(routine.id, {
          label: label.trim(),
          category,
          type,
          start_time: startIso,
          end_time: endIso,
        });
      } else {
        await createLocalRoutineBlock({
          user_id: userId,
          label: label.trim(),
          category,
          type,
          start_time: startIso,
          end_time: endIso,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Routine save failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!routine || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await deleteLocalRoutineBlock(routine.id);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Routine delete failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
      className="w-full max-w-lg p-5 rounded-[30px] bg-white/[0.08] backdrop-blur-[50px] saturate-[210%] border border-white/25 shadow-[0_35px_90px_rgba(0,0,0,0.85),0_0_30px_rgba(255,255,255,0.1),inset_0_2px_4px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.35)] text-white flex flex-col gap-3.5 select-none pointer-events-auto"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/12">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center">
            <Calendar className="w-3 h-3 text-amber-300" />
          </div>
          <span className="text-[11px] font-mono tracking-widest uppercase text-white/80 font-semibold">
            {isEditing ? "Edit Routine Block" : "Schedule Routine Block"}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center text-white/45 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Label */}
        <input
          type="text"
          required
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Routine title..."
          className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/20 focus:border-white/60 focus:bg-white/[0.12] text-sm text-white placeholder-white/35 outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
        />

        {/* Plan vs Actual Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/[0.06] border border-white/15">
          <button
            type="button"
            onClick={() => setType("ACTUAL")}
            className={cn(
              "py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
              type === "ACTUAL"
                ? "bg-emerald-400 text-black shadow-sm"
                : "text-white/50 hover:text-white"
            )}
          >
            Actual Activity
          </button>
          <button
            type="button"
            onClick={() => setType("PLAN")}
            className={cn(
              "py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
              type === "PLAN"
                ? "bg-amber-400 text-black shadow-sm"
                : "text-white/50 hover:text-white"
            )}
          >
            Planned Goal
          </button>
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all cursor-pointer",
                category === cat
                  ? "bg-white/25 border-white/50 text-white font-semibold shadow-sm"
                  : "border-white/10 bg-white/[0.03] text-white/45 hover:text-white/80 hover:bg-white/[0.06]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* VisionOS Unified Time Range Picker */}
        <VisionOSTimeRangePicker
          startTime={startTime}
          endTime={endTime}
          onChangeStart={setStartTime}
          onChangeEnd={setEndTime}
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-white/15 text-xs text-white/60 hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !label.trim()}
              className="px-4 py-1.5 rounded-xl bg-white text-black font-semibold text-xs transition-all shadow-[0_0_20px_rgba(255,255,255,0.7)] cursor-pointer hover:bg-white/90 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Save Routine"}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
