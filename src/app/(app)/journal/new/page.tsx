"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createJournalLog } from "@/app/actions/updateSummaryData";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, BookOpen } from "lucide-react";
import { FloatingBackground } from "@/components/ui/FloatingBackground";

export default function NewJournalPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("Entry cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      await createJournalLog(content);
      toast.success("Journal entry created!");
      router.push("/journal"); // Changed redirect to /journal instead of /home
    } catch (err) {
      toast.error("Failed to create entry.");
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-amber-50/30 relative overflow-hidden">
      <FloatingBackground />
      
      <div className="relative z-10 flex items-center justify-between p-6 md:px-12 bg-white/50 backdrop-blur-md border-b-2 border-amber-100">
        <button 
          onClick={() => router.push("/journal")}
          className="p-2 rounded-xl bg-white border-2 border-amber-200 text-amber-600 shadow-sm active:translate-y-1 active:shadow-none transition-all hover:bg-amber-50"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2 text-amber-600 font-black tracking-wide uppercase">
          <BookOpen size={20} strokeWidth={3} />
          <span>New Entry</span>
        </div>
        <div className="w-10 h-10" />
      </div>

      <div className="flex-1 flex flex-col p-6 md:p-12 z-10 w-full max-w-4xl mx-auto gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={saving}
          placeholder="What's on your mind? Did you follow your routine today?"
          className="flex-1 w-full bg-white border-4 border-amber-200 rounded-[2rem] p-8 font-bold text-gray-800 text-lg leading-relaxed focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 resize-none transition-all shadow-[0_8px_0_0_#fde68a]"
          autoFocus
        />
        <div className="flex justify-end pt-4">
          <Button 
            type="button" 
            variant="primary" 
            onClick={handleSave} 
            disabled={saving || !content.trim()}
          >
            {saving ? "Saving..." : "Save Entry"}
          </Button>
        </div>
      </div>
    </div>
  );
}
