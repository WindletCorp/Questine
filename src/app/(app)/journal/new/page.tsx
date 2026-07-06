"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createJournalLog } from "@/app/actions/updateSummaryData";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Send } from "lucide-react";
import { FloatingBackground } from "@/components/ui/FloatingBackground";

export default function NewJournalPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [content]);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await createJournalLog(content);
      toast.success("Journal entry saved!");
      router.push("/journal"); 
    } catch (err) {
      toast.error("Failed to create entry.");
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-amber-50/50 relative overflow-hidden selection:bg-amber-200">
      <FloatingBackground />
      
      {/* Minimal Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <button 
          onClick={() => router.push("/journal")}
          className="p-3 rounded-full bg-white/60 hover:bg-white text-gray-500 hover:text-gray-900 transition-all shadow-sm backdrop-blur-md active:scale-95"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-gray-400 font-bold text-sm tracking-widest uppercase bg-white/40 px-4 py-1 rounded-full backdrop-blur-md">
          Focus Mode
        </div>
        <div className="w-12" /> {/* Spacer */}
      </div>

      {/* Immersive Writing Area */}
      <div className="flex-1 flex flex-col items-center p-6 md:p-12 z-10 w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32">
        <div className="w-full mt-20 md:mt-32">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={saving}
            placeholder="What's on your mind today?"
            className="w-full bg-transparent border-none p-0 font-bold text-gray-800 text-3xl md:text-5xl leading-tight focus:outline-none focus:ring-0 resize-none placeholder-gray-300 overflow-hidden"
            autoFocus
            rows={2}
          />
        </div>
        
        {/* Save Button (Fades in when typing) */}
        <div className={`fixed bottom-12 right-6 md:right-12 transition-all duration-500 ${content.trim() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
          <Button 
            type="button" 
            variant="primary" 
            onClick={handleSave} 
            disabled={saving || !content.trim()}
            className="rounded-full w-16 h-16 flex items-center justify-center p-0 shadow-[0_8px_0_0_#d97706] bg-amber-400 text-amber-950 hover:bg-amber-300 hover:shadow-[0_10px_0_0_#d97706] hover:translate-y-[-2px] active:translate-y-[8px] active:shadow-none transition-all"
          >
            <Send size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
}
