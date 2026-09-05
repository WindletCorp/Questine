"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Trash2, Activity, Plus, Minus } from "lucide-react";
import type { EnrichedMetricEntry } from "@/lib/db/types";
import type { LocalMetricDefinition } from "@/lib/local-db";
import { getLocalUserSubscriptions, logLocalEntry, updateLocalEntry, deleteLocalEntry } from "@/lib/local-db/metrics";
import { VisionOSTimeRangePicker } from "../time-range-picker";
import { ManageMetricsView } from "./manage-metrics-view";
import { cn } from "@/lib/utils";

interface MetricPaneProps {
  entry?: EnrichedMetricEntry | null;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
  isVisible?: boolean;
}

const toLocalIso = (dateStr?: string | null, offsetMinutes: number = 0) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (offsetMinutes) d.setMinutes(d.getMinutes() + offsetMinutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function MetricPane({ entry, userId, onClose, onSuccess, isVisible = false }: MetricPaneProps) {
  const isEditing = !!entry;

  const [definitions, setDefinitions] = useState<LocalMetricDefinition[]>([]);
  const [selectedDefId, setSelectedDefId] = useState<string>(entry?.metric_id || "");
  const [value, setValue] = useState<number>(entry?.value || 10);
  const [startTime, setStartTime] = useState(toLocalIso(entry?.start_time));
  const [endTime, setEndTime] = useState(entry?.end_time ? toLocalIso(entry.end_time) : toLocalIso(null, 20));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isManaging, setIsManaging] = useState(false);

  const loadDefinitions = async () => {
    const res = await getLocalUserSubscriptions(userId, true);
    if (res.data) {
      const defs = res.data.map(sub => sub.metric_definition).filter(Boolean) as LocalMetricDefinition[];
      setDefinitions(defs);
      if (!selectedDefId && defs.length > 0) {
        setSelectedDefId(defs[0].id);
      }
    }
  };

  useEffect(() => {
    loadDefinitions();
  }, [userId, isManaging]); // Reload when coming back from managing

  const activeDef = definitions.find((d) => d.id === selectedDefId);

  const adjustValue = (delta: number) => {
    setValue((prev) => Math.max(1, prev + delta));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDefId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const startIso = new Date(startTime).toISOString();
      const endIso = new Date(endTime).toISOString();

      if (isEditing && entry) {
        await updateLocalEntry(entry.id, {
          value,
          start_time: startIso,
          end_time: endIso,
        });
      } else {
        await logLocalEntry(userId, selectedDefId, value, startIso, endIso);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Metric save failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!entry || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await deleteLocalEntry(entry.id);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Metric delete failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        y: isVisible ? 0 : 24, 
        scale: isVisible ? 1 : 0.96,
        pointerEvents: isVisible ? "auto" : "none"
      }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="absolute w-full max-w-lg p-5 rounded-[30px] bg-white/[0.08] backdrop-blur-[50px] saturate-[210%] border border-white/25 shadow-[0_35px_90px_rgba(0,0,0,0.85),0_0_30px_rgba(255,255,255,0.1),inset_0_2px_4px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.35)] text-white flex flex-col gap-3.5 select-none"
      style={{ willChange: "transform, opacity", transform: "translateZ(0)", zIndex: isVisible ? 10 : 0 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isManaging ? (
          <motion.div 
            key="manage"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-full flex-1 flex flex-col"
          >
            <ManageMetricsView 
              userId={userId} 
              onBack={() => setIsManaging(false)} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="log"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex flex-col gap-3.5"
          >
            {/* Top Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/12">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-400/20 flex items-center justify-center">
                  <Activity className="w-3 h-3 text-purple-300" />
                </div>
                <span className="text-[11px] font-mono tracking-widest uppercase text-white/80 font-semibold">
                  {isEditing ? "Edit Metric Entry" : "Log Metric Activity"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsManaging(true)}
                    className="px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1"
                  >
                    Manage
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white/45 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Metric Selector Chips (No Scrollbar) */}
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {definitions.map((def) => (
            <button
              type="button"
              key={def.id}
              onClick={() => setSelectedDefId(def.id)}
              className={cn(
                "px-2.5 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5",
                selectedDefId === def.id
                  ? "bg-purple-500/25 border-purple-400/70 text-purple-200 font-semibold shadow-sm"
                  : "border-white/10 bg-white/[0.03] text-white/45 hover:text-white/80 hover:bg-white/[0.06]"
              )}
            >
              <span>{def.name}</span>
              {def.unit && <span className="text-[10px] opacity-50 font-mono">({def.unit})</span>}
            </button>
          ))}
        </div>

        {/* Stepper Value Input (No default number spinner arrows) */}
        <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/[0.04] border border-white/12 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-white/45">
            <span>Value</span>
            <span className="text-purple-300 font-semibold">{activeDef?.unit || "Units"}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjustValue(-5)}
                className="px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/15 text-xs font-mono font-bold text-white/70 transition-all cursor-pointer"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => adjustValue(-1)}
                className="w-7 h-7 rounded-xl bg-white/[0.06] hover:bg-white/15 flex items-center justify-center text-white/70 transition-all cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
            </div>

            <input
              type="number"
              min={1}
              required
              value={value}
              onChange={(e) => setValue(Math.max(1, Number(e.target.value) || 1))}
              className="w-20 text-center py-1 text-2xl font-bold bg-transparent text-white border-b border-white/25 focus:border-purple-400 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjustValue(1)}
                className="w-7 h-7 rounded-xl bg-white/[0.06] hover:bg-white/15 flex items-center justify-center text-white/70 transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => adjustValue(5)}
                className="px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/15 text-xs font-mono font-bold text-white/70 transition-all cursor-pointer"
              >
                +5
              </button>
            </div>
          </div>
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
                disabled={isSubmitting || !selectedDefId}
                className="px-4 py-1.5 rounded-xl bg-white text-black font-semibold text-xs transition-all shadow-[0_0_20px_rgba(255,255,255,0.7)] cursor-pointer hover:bg-white/90 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : isEditing ? "Save Entry" : "Log Activity"}
              </button>
            </div>
          </div>
        </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
