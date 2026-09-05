"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Trash2, BookOpen } from "lucide-react";
import type { Journal } from "@/lib/db/types";
import { createLocalJournal, updateLocalJournal, deleteLocalJournal } from "@/lib/local-db/journals";
import { VisionOSTimeRangePicker } from "../time-range-picker";
import { cn } from "@/lib/utils";

interface JournalPaneProps {
  journal?: Journal | null;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
  isVisible?: boolean;
}

const PROMPTS = [
  "Today's key highlight:",
  "What challenged me and what I learned:",
  "3 things I'm grateful for right now:",
  "Tomorrow's main goal:",
];

const toLocalIso = (dateStr?: string | null, offsetMinutes: number = 0) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (offsetMinutes) d.setMinutes(d.getMinutes() + offsetMinutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function JournalPane({ journal, userId, onClose, onSuccess, isVisible = false }: JournalPaneProps) {
  const isEditing = !!journal;

  const [content, setContent] = useState(journal?.content || "");
  const [startTime, setStartTime] = useState(toLocalIso(journal?.start_time));
  const [endTime, setEndTime] = useState(journal?.end_time ? toLocalIso(journal.end_time) : toLocalIso(null, 15));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  const applyPrompt = (prompt: string) => {
    setContent((prev) => (prev ? `${prev}\n\n${prompt}\n` : `${prompt}\n`));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const startIso = new Date(startTime).toISOString();
      const endIso = new Date(endTime).toISOString();

      if (isEditing && journal) {
        await updateLocalJournal(journal.id, {
          content: content.trim(),
          start_time: startIso,
          end_time: endIso,
        });
      } else {
        await createLocalJournal({
          user_id: userId,
          content: content.trim(),
          start_time: startIso,
          end_time: endIso,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Journal save failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!journal || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await deleteLocalJournal(journal.id);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Journal delete failed:", err);
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
      style={{ willChange: "transform, opacity", transform: "translateZ(0)", zIndex: isVisible ? 10 : 0 }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/12">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center">
            <BookOpen className="w-3 h-3 text-emerald-300" />
          </div>
          <span className="text-[11px] font-mono tracking-widest uppercase text-white/80 font-semibold">
            {isEditing ? "Edit Reflection" : "New Journal Reflection"}
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
        <textarea
          required
          ref={inputRef}
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your thoughts, milestones, or reflections..."
          className="w-full p-3.5 rounded-2xl bg-white/[0.06] border border-white/20 focus:border-white/60 focus:bg-white/[0.12] text-sm text-white placeholder-white/35 outline-none resize-none transition-all leading-relaxed shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
        />

        {/* Prompt Chips */}
        {!isEditing && (
          <div className="flex flex-wrap gap-1.5">
            {PROMPTS.map((prompt) => (
              <button
                type="button"
                key={prompt}
                onClick={() => applyPrompt(prompt)}
                className="px-2.5 py-1 rounded-xl text-[11px] border border-white/10 bg-white/[0.03] text-white/50 hover:text-white hover:border-emerald-400/50 hover:bg-emerald-500/15 transition-all cursor-pointer truncate max-w-full"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

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
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-1.5 rounded-xl bg-white text-black font-semibold text-xs transition-all shadow-[0_0_20px_rgba(255,255,255,0.7)] cursor-pointer hover:bg-white/90 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEditing ? "Save Reflection" : "Save Reflection"}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
