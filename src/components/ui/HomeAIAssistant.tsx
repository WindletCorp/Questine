"use client";

import { useState, useEffect } from "react";
import { Sparkles, X, Activity } from "lucide-react";
import { MumbleBar } from "@/components/ui/MumbleBar";
import { AnimatePresence, motion } from "framer-motion";
import { executeGlobalCommand } from "@/app/actions/executeGlobalCommand";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function HomeAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  
  const [aiConfig, setAiConfig] = useState<{ apiKey: string, model: string } | null>(null);

  useEffect(() => {
    const key = localStorage.getItem("byok_api_key");
    const model = localStorage.getItem("byok_ai_model") || "gemini-1.5-flash";
    if (key) {
      setAiConfig({ apiKey: key, model });
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;
    
    if (!aiConfig) {
      toast.error("Please configure your AI key in Settings first.");
      router.push("/settings");
      setIsOpen(false);
      return;
    }

    setIsProcessing(true);
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const result = await executeGlobalCommand(
        input, 
        todayStr, 
        aiConfig.apiKey, 
        aiConfig.model
      );
      
      if (result.success) {
        toast.success(result.message || "Command executed successfully!");
        setInput("");
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result.message || "I couldn't quite understand that request.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Something went wrong while thinking.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <motion.div
        layout
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full bg-white border-4 border-gray-200 rounded-[2rem] shadow-[0_8px_0_0_#e5e7eb] overflow-hidden flex flex-col"
      >
        <AnimatePresence mode="popLayout">
          {!isOpen ? (
            <motion.div
              key="closed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="p-2 flex justify-center items-center w-full"
            >
              <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-500 text-white font-black uppercase tracking-widest shadow-[0_4px_0_0_#9333ea] hover:bg-purple-400 hover:-translate-y-[2px] hover:shadow-[0_6px_0_0_#9333ea] active:translate-y-[4px] active:shadow-none transition-all"
              >
                <Sparkles strokeWidth={3} size={20} /> Ask AI
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="p-6 flex flex-col gap-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2.5 rounded-2xl text-purple-600">
                    <Sparkles size={24} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-black text-xl text-gray-800 tracking-wide uppercase">AI Assistant</h3>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-gray-100 text-gray-400 rounded-full hover:bg-gray-200 hover:text-gray-600 transition-colors"
                >
                  <X size={24} strokeWidth={3} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <MumbleBar 
                  value={input} 
                  onChange={setInput} 
                  onSubmit={handleSubmit}
                  placeholder="e.g. Push my afternoon blocks back by an hour..."
                  disabled={isProcessing}
                />
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-purple-500 font-bold py-2 animate-pulse">
                  <Activity size={20} /> Thinking...
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
