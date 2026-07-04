"use client";
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { MetricCard } from "./MetricCard";

export function CreateMetricInline({ dateStr }: { dateStr: string }) {
  const [isCreating, setIsCreating] = useState(false);

  if (isCreating) {
    return <MetricCard name="" value="" isNew={true} colorTheme="orange" dateStr={dateStr} onCancelNew={() => setIsCreating(false)} />;
  }

  return (
    <button 
      onClick={() => setIsCreating(true)}
      className="flex flex-col items-center justify-center p-4 rounded-3xl border-4 border-dashed border-gray-300 min-w-[120px] bg-gray-50 text-gray-500 hover:bg-gray-100 hover:border-gray-400 transition-colors"
    >
      <Plus strokeWidth={3} className="mb-1" />
      <span className="text-xs font-black uppercase tracking-wider text-center leading-tight">Add Metric</span>
    </button>
  );
}
