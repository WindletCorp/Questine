"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Trash2, CheckSquare } from "lucide-react";
import type { Task } from "@/lib/db/types";
import { createLocalTask, updateLocalTask, deleteLocalTask } from "@/lib/local-db/tasks";
import { VisionOSTimeRangePicker } from "../time-range-picker";

interface TaskPaneProps {
  task?: Task | null;
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

export function TaskPane({ task, userId, onClose, onSuccess, isVisible = false }: TaskPaneProps) {
  const isEditing = !!task;

  const [label, setLabel] = useState(task?.label || "");
  const [startTime, setStartTime] = useState(toLocalIso(task?.start_time));
  const [endTime, setEndTime] = useState(task?.end_time ? toLocalIso(task.end_time) : toLocalIso(null, 45));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const startIso = new Date(startTime).toISOString();
      const endIso = new Date(endTime).toISOString();

      if (isEditing && task) {
        await updateLocalTask(task.id, {
          label: label.trim(),
          start_time: startIso,
          end_time: endIso,
        });
      } else {
        await createLocalTask({
          user_id: userId,
          label: label.trim(),
          start_time: startIso,
          end_time: endIso,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Task save failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!task || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await deleteLocalTask(task.id);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Task delete failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

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
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/12">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-blue-400/20 flex items-center justify-center">
            <CheckSquare className="w-3 h-3 text-blue-300" />
          </div>
          <span className="text-[11px] font-mono tracking-widest uppercase text-white/80 font-semibold">
            {isEditing ? "Edit Task" : "New Task"}
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
          ref={inputRef}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/20 focus:border-white/60 focus:bg-white/[0.12] text-sm text-white placeholder-white/35 outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
        />

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
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
