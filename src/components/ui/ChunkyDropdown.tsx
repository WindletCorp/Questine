"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface ChunkyDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  disabled?: boolean;
}

export function ChunkyDropdown({ value, onChange, options, placeholder = "Select...", disabled }: ChunkyDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between bg-white border-4 border-gray-200 rounded-2xl px-4 py-3 text-sm font-black text-gray-700",
          "hover:bg-gray-50 active:translate-y-1 active:border-b-4 transition-all shadow-[0_4px_0_0_#e5e7eb] active:shadow-none",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={18} strokeWidth={3} className={cn("transition-transform text-gray-400", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border-4 border-gray-200 rounded-2xl shadow-[0_8px_0_0_#e5e7eb] overflow-hidden flex flex-col max-h-48 overflow-y-auto">
          <button
            type="button"
            onClick={() => { onChange(""); setIsOpen(false); }}
            className="w-full text-left px-4 py-3 font-bold text-gray-500 hover:bg-gray-100 border-b-2 border-gray-100 transition-colors"
          >
            None
          </button>
          {options.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={cn(
                "w-full text-left px-4 py-3 font-black text-gray-700 hover:bg-gray-100 transition-colors",
                i !== options.length - 1 && "border-b-2 border-gray-100",
                value === opt.value && "bg-amber-50 text-amber-600"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
