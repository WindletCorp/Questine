"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { updateMetricValue, createMetric } from "@/app/actions/updateSummaryData";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

interface MetricCardProps {
  id?: string;
  name: string;
  value: string | number;
  unit?: string;
  className?: string;
  colorTheme?: "indigo" | "pink" | "blue" | "emerald" | "orange";
  isNew?: boolean;
  onCancelNew?: () => void;
  dateStr?: string; // used for creation
}

export function MetricCard({ 
  id, 
  name: initialName, 
  value: initialValue, 
  unit: initialUnit, 
  className, 
  colorTheme = "indigo",
  isNew = false,
  onCancelNew,
  dateStr
}: MetricCardProps) {
  const [value, setValue] = useState(initialValue);
  const [name, setName] = useState(initialName);
  const [unit, setUnit] = useState(initialUnit || "");
  
  const [isEditing, setIsEditing] = useState(isNew);
  const [editValue, setEditValue] = useState(initialValue.toString());
  const [saving, setSaving] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const themeStyles = {
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-[0_4px_0_0_#c7d2fe]",
    pink: "bg-pink-50 border-pink-200 text-pink-900 shadow-[0_4px_0_0_#fbcfe8]",
    blue: "bg-blue-50 border-blue-200 text-blue-900 shadow-[0_4px_0_0_#bfdbfe]",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-[0_4px_0_0_#a7f3d0]",
    orange: "bg-orange-50 border-orange-200 text-orange-900 shadow-[0_4px_0_0_#fed7aa]",
  };

  const labelStyles = {
    indigo: "text-indigo-500",
    pink: "text-pink-500",
    blue: "text-blue-500",
    emerald: "text-emerald-500",
    orange: "text-orange-500",
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const num = parseFloat(editValue);
    if (isNaN(num)) {
      toast.error("Please enter a valid number");
      return;
    }
    if (isNew && !name.trim()) {
      toast.error("Metric name is required");
      return;
    }
    
    setSaving(true);
    try {
      if (isNew) {
        await createMetric(name, num, unit);
        toast.success("Metric created!");
        if (onCancelNew) onCancelNew();
      } else if (id) {
        await updateMetricValue(id, num);
        setValue(num);
        setIsEditing(false);
        toast.success(`${name} updated!`);
      }
    } catch (err) {
      toast.error("Failed to save metric");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isNew && onCancelNew) {
      onCancelNew();
    } else {
      setIsEditing(false);
      setEditValue(value.toString());
    }
  };

  return (
    <div
      onClick={() => {
        if (!isEditing && id) setIsEditing(true);
      }}
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-3xl border-4 min-w-[120px] outline-none transition-all relative overflow-hidden",
        themeStyles[colorTheme],
        !isEditing && id && "cursor-pointer hover:-translate-y-1 hover:shadow-[0_6px_0_0_#c7d2fe]",
        className
      )}
    >
      {isEditing ? (
        <div className="flex flex-col items-center w-full gap-2 z-10">
          {isNew ? (
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (e.g. Calories)"
              className="w-full bg-white/50 border-2 border-black/10 rounded-xl px-2 py-1 text-xs font-bold text-center focus:outline-none focus:border-black/30 placeholder:text-black/30"
              disabled={saving}
            />
          ) : (
            <span className={cn("text-xs font-black uppercase tracking-wider text-center leading-tight mb-1", labelStyles[colorTheme])}>
              {name}
            </span>
          )}
          
          <input
            ref={inputRef}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            disabled={saving}
            className="w-full max-w-[80px] bg-white border-2 border-black/10 rounded-xl px-2 py-1 text-xl font-black text-center focus:outline-none focus:border-black/30"
          />

          {isNew && (
            <input 
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Unit (e.g. kcal)"
              className="w-full bg-white/50 border-2 border-black/10 rounded-xl px-2 py-1 text-xs font-bold text-center focus:outline-none focus:border-black/30 placeholder:text-black/30"
              disabled={saving}
            />
          )}
          
          <div className="flex items-center gap-2 mt-1">
            <button 
              onClick={handleCancel}
              disabled={saving}
              className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-black/50 transition-colors"
            >
              <X size={16} strokeWidth={3} />
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-sm transition-colors"
            >
              <Check size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <span className="text-3xl font-black mb-1">{value}</span>
          <span
            className={cn(
              "text-xs font-black uppercase tracking-wider text-center leading-tight",
              labelStyles[colorTheme]
            )}
          >
            {name} {unit && `(${unit})`}
          </span>
        </>
      )}
    </div>
  );
}
