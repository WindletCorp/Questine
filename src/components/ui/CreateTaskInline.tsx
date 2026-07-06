"use client";
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { TaskCard } from "./TaskCard";

export function CreateTaskInline({ dateStr, availableBlocks = [] }: { dateStr: string, availableBlocks?: any[] }) {
  const [isCreating, setIsCreating] = useState(false);

  if (isCreating) {
    return <TaskCard title="" status="pending" isNew={true} dateStr={dateStr} availableBlocks={availableBlocks} onCancelNew={() => setIsCreating(false)} />;
  }

  return (
    <button 
      onClick={() => setIsCreating(true)}
      className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl border-4 border-dashed border-gray-300 bg-gray-50 text-gray-500 font-bold hover:bg-gray-100 hover:border-gray-400 transition-colors"
    >
      <Plus strokeWidth={3} /> Add Task
    </button>
  );
}
