"use client";

import React, { useState } from "react";
import { Check, Edit3, Trash2, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleTaskStatus, updateTaskDetails, deleteTask, createTask } from "@/app/actions/updateSummaryData";
import { toast } from "sonner";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { ChunkyDatePicker } from "./ChunkyDatePicker";
import { ChunkyDropdown } from "./ChunkyDropdown";

interface TaskCardProps {
  id?: string;
  title: string;
  status: "pending" | "completed";
  targetDate?: string;
  linkedBlockId?: string;
  className?: string;
  isNew?: boolean;
  dateStr?: string;
  onCancelNew?: () => void;
  availableBlocks?: any[];
}

function formatBlockLabel(block: any) {
  if (!block.start_time || !block.end_time) return block.label;
  const start = new Date(block.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const end = new Date(block.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${start} - ${end}: ${block.label}`;
}

export function TaskCard({ 
  id, 
  title: initialTitle, 
  status: initialStatus, 
  targetDate = "", 
  linkedBlockId = "",
  className,
  isNew = false,
  dateStr,
  onCancelNew,
  availableBlocks = []
}: TaskCardProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isEditing, setIsEditing] = useState(isNew);
  
  // Edit state
  const [editTitle, setEditTitle] = useState(initialTitle);
  const [editTargetDate, setEditTargetDate] = useState(targetDate || dateStr || "");
  const [editLinkedBlock, setEditLinkedBlock] = useState(linkedBlockId);
  const [loading, setLoading] = useState(false);

  const controls = useAnimation();
  const isCompleted = status === "completed";

  const handleToggle = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!id || loading || isEditing) return;
    
    const newStatus = isCompleted ? "pending" : "completed";
    setStatus(newStatus);
    setLoading(true);

    try {
      await toggleTaskStatus(id, newStatus);
    } catch (err) {
      setStatus(isCompleted ? "completed" : "pending");
      toast.error("Failed to update task.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast.error("Task title cannot be empty");
      return;
    }
    
    setLoading(true);
    try {
      if (isNew) {
        await createTask(editTitle, editTargetDate || new Date().toISOString().split('T')[0]);
        toast.success("Task created!");
        if (onCancelNew) onCancelNew();
      } else if (id) {
        await updateTaskDetails(id, editTitle, editTargetDate, editLinkedBlock || null);
        setIsEditing(false);
        toast.success("Task updated!");
      }
    } catch (err) {
      toast.error("Failed to save task.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this task?")) {
      controls.start({ x: 0 });
      return;
    }
    
    setLoading(true);
    try {
      await deleteTask(id);
      toast.success("Task deleted");
    } catch (err) {
      toast.error("Failed to delete task");
      controls.start({ x: 0 });
      setLoading(false);
    }
  };

  const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isEditing || isNew) return;
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      // Swipe Right -> Delete
      handleDelete();
    } else if (info.offset.x < -swipeThreshold) {
      // Swipe Left -> Edit
      setIsEditing(true);
      controls.start({ x: 0 });
    } else {
      controls.start({ x: 0 });
    }
  };

  const blockOptions = availableBlocks.map(b => ({ label: formatBlockLabel(b), value: b.id }));

  if (isEditing) {
    return (
      <div className={cn("flex flex-col gap-3 p-4 rounded-2xl border-4 bg-white border-amber-300 shadow-[0_6px_0_0_#fcd34d] transition-all", className)}>
        <input 
          type="text" 
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Task title..."
          className="w-full font-black text-lg text-gray-800 bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
          disabled={loading}
          autoFocus
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Target Date</label>
            <ChunkyDatePicker 
              value={editTargetDate}
              onChange={setEditTargetDate}
              disabled={loading}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Linked Block</label>
            <ChunkyDropdown 
              value={editLinkedBlock}
              onChange={setEditLinkedBlock}
              options={blockOptions}
              disabled={loading}
              placeholder="None"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-2 border-t-2 border-gray-100 pt-3">
          <button 
            onClick={() => isNew && onCancelNew ? onCancelNew() : setIsEditing(false)}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
          >
            <X size={16} strokeWidth={3} /> Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow-sm transition-colors"
          >
            <Save size={16} strokeWidth={3} /> {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl touch-pan-y">
      {/* Background Action Indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none z-0">
        <div className="flex items-center gap-2 text-red-500 font-black">
          <Trash2 size={24} strokeWidth={3} /> <span>Delete</span>
        </div>
        <div className="flex items-center gap-2 text-amber-500 font-black">
          <span>Edit</span> <Edit3 size={24} strokeWidth={3} />
        </div>
      </div>

      <motion.button
        type="button"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={onDragEnd}
        animate={controls}
        onClick={handleToggle}
        disabled={!id || loading}
        className={cn(
          "relative z-10 flex items-center gap-4 p-4 rounded-2xl border-4 shadow-sm transition-colors duration-200 text-left w-full outline-none focus-visible:ring-4 focus-visible:ring-emerald-200",
          isCompleted
            ? "bg-emerald-50 border-emerald-500"
            : "bg-white border-gray-200 hover:bg-gray-50",
          className,
          (!id || loading) && "cursor-not-allowed pointer-events-none brightness-95"
        )}
      >
        <div
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center border-2 shrink-0 transition-colors",
            isCompleted
              ? "bg-emerald-500 border-emerald-600 text-white"
              : "bg-gray-100 border-gray-300 text-transparent"
          )}
        >
          <Check strokeWidth={4} size={18} />
        </div>
        <div className="flex-1 overflow-hidden">
          <span
            className={cn(
              "block font-black text-lg leading-tight truncate transition-all",
              isCompleted ? "text-emerald-900 line-through decoration-emerald-500/50" : "text-gray-800"
            )}
          >
            {initialTitle}
          </span>
          {!isCompleted && targetDate && (
             <span className="text-xs font-bold text-gray-400 block mt-1">Due: {targetDate}</span>
          )}
        </div>
      </motion.button>
    </div>
  );
}
