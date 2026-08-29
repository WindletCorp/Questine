"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Check, Trash2, Calendar, Clock, BookOpen, Activity, CheckSquare } from "lucide-react";
import type { TimelineItem } from "@/lib/db/types";
import { createLocalTask, updateLocalTask, deleteLocalTask } from "@/lib/local-db/tasks";
import { createLocalRoutineBlock, updateLocalRoutineBlock, deleteLocalRoutineBlock } from "@/lib/local-db/routine-blocks";
import { createLocalJournal, updateLocalJournal, deleteLocalJournal } from "@/lib/local-db/journals";
import { logLocalEntry, updateLocalEntry, deleteLocalEntry, getLocalAvailableMetrics, getLocalUserSubscriptions } from "@/lib/local-db/metrics";
import type { LocalMetricDefinition } from "@/lib/local-db";
import { GlassButton } from "../glass-button";
import styles from "../../theme.module.css";
import { cn } from "@/lib/utils";

type ActiveTabType = "task" | "routine" | "journal" | "metric";

interface BottomCrudTrayProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenNew: (type?: ActiveTabType) => void;
  editingItem: TimelineItem | null;
  onSuccess: () => void;
}

export function BottomCrudTray({
  userId,
  isOpen,
  onClose,
  onOpenNew,
  editingItem,
  onSuccess,
}: BottomCrudTrayProps) {
  const [activeType, setActiveType] = useState<ActiveTabType>("task");

  // Form State
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("Work");
  const [routineType, setRoutineType] = useState<"PLAN" | "ACTUAL">("PLAN");
  const [journalContent, setJournalContent] = useState("");
  const [metricId, setMetricId] = useState("");
  const [metricValue, setMetricValue] = useState<number>(1);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableMetrics, setAvailableMetrics] = useState<LocalMetricDefinition[]>([]);

  // Load available metrics for selector
  useEffect(() => {
    async function loadMetrics() {
      const res = await getLocalAvailableMetrics(userId);
      if (res.data && res.data.length > 0) {
        setAvailableMetrics(res.data);
        if (!metricId) setMetricId(res.data[0].id);
      }
    }
    loadMetrics();
  }, [userId]);

  // Sync state when editingItem changes
  useEffect(() => {
    const now = new Date();
    const isoNow = now.toISOString().slice(0, 16); // format for input[type=datetime-local]
    const isoPlus1h = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);

    if (editingItem) {
      setActiveType(editingItem.type as ActiveTabType);
      const s = editingItem.data.start_time ? new Date(editingItem.data.start_time).toISOString().slice(0, 16) : isoNow;
      const e = ("end_time" in editingItem.data && editingItem.data.end_time)
        ? new Date(editingItem.data.end_time).toISOString().slice(0, 16)
        : s;

      setStartTime(s);
      setEndTime(e);

      switch (editingItem.type) {
        case "task":
          setLabel(editingItem.data.label);
          break;
        case "routine_block":
          setLabel(editingItem.data.label);
          setCategory(editingItem.data.category);
          setRoutineType(editingItem.data.type as "PLAN" | "ACTUAL");
          break;
        case "journal":
          setJournalContent(editingItem.data.content);
          break;
        case "metric_entry":
          setMetricId(editingItem.data.metric_id);
          setMetricValue(editingItem.data.value);
          break;
      }
    } else {
      // Reset defaults
      setLabel("");
      setCategory("Work");
      setRoutineType("PLAN");
      setJournalContent("");
      setMetricValue(1);
      setStartTime(isoNow);
      setEndTime(isoPlus1h);
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const sIso = startTime ? new Date(startTime).toISOString() : new Date().toISOString();
      const eIso = endTime ? new Date(endTime).toISOString() : sIso;

      if (editingItem) {
        // UPDATE MODE
        switch (editingItem.type) {
          case "task":
            await updateLocalTask(editingItem.data.id, {
              label,
              start_time: sIso,
              end_time: eIso,
            });
            break;
          case "routine_block":
            await updateLocalRoutineBlock(editingItem.data.id, {
              label,
              category,
              type: routineType,
              start_time: sIso,
              end_time: eIso,
            });
            break;
          case "journal":
            await updateLocalJournal(editingItem.data.id, {
              content: journalContent,
              start_time: sIso,
              end_time: sIso,
            });
            break;
          case "metric_entry":
            await updateLocalEntry(editingItem.data.id, {
              value: Number(metricValue),
              start_time: sIso,
              end_time: sIso,
            });
            break;
        }
      } else {
        // CREATE MODE
        switch (activeType) {
          case "task":
            if (!label.trim()) return;
            await createLocalTask({
              user_id: userId,
              label: label.trim(),
              start_time: sIso,
              end_time: eIso,
            });
            break;
          case "routine":
            if (!label.trim()) return;
            await createLocalRoutineBlock({
              user_id: userId,
              label: label.trim(),
              category,
              type: routineType,
              start_time: sIso,
              end_time: eIso,
            });
            break;
          case "journal":
            if (!journalContent.trim()) return;
            await createLocalJournal({
              user_id: userId,
              content: journalContent.trim(),
              start_time: sIso,
              end_time: sIso,
            });
            break;
          case "metric":
            if (!metricId) return;
            await logLocalEntry(userId, metricId, Number(metricValue), sIso, sIso);
            break;
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("CRUD Tray Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingItem) return;
    setIsSubmitting(true);

    try {
      switch (editingItem.type) {
        case "task":
          await deleteLocalTask(editingItem.data.id);
          break;
        case "routine_block":
          await deleteLocalRoutineBlock(editingItem.data.id);
          break;
        case "journal":
          await deleteLocalJournal(editingItem.data.id);
          break;
        case "metric_entry":
          await deleteLocalEntry(editingItem.data.id);
          break;
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Delete Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full shrink-0 z-40">
      {/* Bottom Bar: Action Selector or Open Form */}
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="flex items-center justify-between gap-2 p-2.5 rounded-full bg-white/[0.08] backdrop-blur-[24px] border border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.5)] max-w-md mx-auto"
          >
            <div className="flex items-center gap-1.5 pl-2">
              <span className="text-[11px] font-mono text-white/50">Quick Log:</span>
              <button
                onClick={() => { setActiveType("task"); onOpenNew("task"); }}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 transition-all cursor-pointer"
              >
                + Task
              </button>
              <button
                onClick={() => { setActiveType("routine"); onOpenNew("routine"); }}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
              >
                + Routine
              </button>
              <button
                onClick={() => { setActiveType("journal"); onOpenNew("journal"); }}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
              >
                + Journal
              </button>
            </div>

            <GlassButton
              variant="circle"
              onClick={() => onOpenNew("metric")}
              aria-label="Add new item"
              className="w-8 h-8 bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30 shrink-0"
            >
              <Plus className="w-4 h-4" />
            </GlassButton>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className={cn(
              styles.glassPanel,
              "p-4 rounded-[22px] max-w-xl mx-auto w-full flex flex-col gap-3 relative"
            )}
          >
            {/* Form Header / Type Switcher */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              {editingItem ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-white/50">
                    Editing {editingItem.type.replace("_", " ")}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {(["task", "routine", "journal", "metric"] as ActiveTabType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActiveType(type)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium capitalize transition-all cursor-pointer",
                        activeType === type
                          ? "bg-white/20 text-white border border-white/30"
                          : "text-white/40 hover:text-white/70"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}

              <GlassButton
                variant="circle"
                onClick={onClose}
                aria-label="Close form"
                className="w-6 h-6 border-transparent bg-transparent shadow-none text-white/40 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </GlassButton>
            </div>

            {/* Dynamic Form Content */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Task Fields */}
              {activeType === "task" && (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Task name (e.g. Finish report)..."
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/40"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-white/40 block mb-1">Start Time</label>
                      <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-white/40 block mb-1">End Time</label>
                      <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Routine Fields */}
              {activeType === "routine" && (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Block title (e.g. Deep Work)..."
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-white/30 outline-none"
                    />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="px-2.5 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white outline-none"
                    >
                      <option value="Work" className="bg-neutral-900 text-white">Work</option>
                      <option value="Health" className="bg-neutral-900 text-white">Health</option>
                      <option value="Focus" className="bg-neutral-900 text-white">Focus</option>
                      <option value="Leisure" className="bg-neutral-900 text-white">Leisure</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-white/50">Type:</span>
                    <button
                      type="button"
                      onClick={() => setRoutineType("PLAN")}
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-mono border transition-all",
                        routineType === "PLAN" ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "text-white/40 border-white/10"
                      )}
                    >
                      PLAN
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoutineType("ACTUAL")}
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-mono border transition-all",
                        routineType === "ACTUAL" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "text-white/40 border-white/10"
                      )}
                    >
                      ACTUAL
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-white/40 block mb-1">Start Time</label>
                      <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-white/40 block mb-1">End Time</label>
                      <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Journal Fields */}
              {activeType === "journal" && (
                <div className="flex flex-col gap-2">
                  <textarea
                    required
                    rows={3}
                    placeholder="Write your journal entry or reflection..."
                    value={journalContent}
                    onChange={(e) => setJournalContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-white/30 outline-none resize-none"
                  />
                  <div>
                    <label className="text-[10px] font-mono text-white/40 block mb-1">Logged Time</label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Metric Entry Fields */}
              {activeType === "metric" && (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-white/40 block mb-1">Metric</label>
                      <select
                        value={metricId}
                        onChange={(e) => setMetricId(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white outline-none"
                      >
                        {availableMetrics.map((m) => (
                          <option key={m.id} value={m.id} className="bg-neutral-900 text-white">
                            {m.name} {m.unit ? `(${m.unit})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-white/40 block mb-1">Value</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={metricValue}
                        onChange={(e) => setMetricValue(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-white/40 block mb-1">Timestamp</label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Submit & Delete Actions */}
              <div className="flex items-center justify-between pt-1">
                {editingItem ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <GlassButton
                    type="button"
                    variant="pill"
                    onClick={onClose}
                    className="py-1 px-3 text-xs text-white/60"
                  >
                    Cancel
                  </GlassButton>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{editingItem ? "Save Changes" : "Create"}</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
