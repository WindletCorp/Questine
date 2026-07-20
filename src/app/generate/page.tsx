"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MumbleBar } from "@/components/ui/MumbleBar";
import { RoutineViewer, RoutineBlock } from "@/components/routine/RoutineViewer";
import { Button } from "@/components/ui/Button";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import { generateAuthenticatedRoutine } from "@/app/actions/generateAuthenticatedRoutine";
import { saveRoutine } from "@/app/actions/saveRoutine";
import { ModelMessage } from "ai";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Check, X, FastForward } from "lucide-react";
import { TypingIndicator } from "@/components/ui/TypingIndicator";
import { motion, AnimatePresence } from "framer-motion";

type WizardStep = "must_do" | "fixed_events" | "vibe" | "generating" | "review";

export default function GeneratePage() {
  const router = useRouter();
  
  // Wizard States
  const [step, setStep] = useState<WizardStep>("must_do");
  
  // User Inputs
  const [mustDo, setMustDo] = useState("");
  const [fixedEvents, setFixedEvents] = useState("");
  const [vibe, setVibe] = useState("");
  
  // For free-text refinements in the review stage
  const [refinementInput, setRefinementInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<ModelMessage[]>([]);
  const [aiClarification, setAiClarification] = useState<string>("");
  const [generatedBlocks, setGeneratedBlocks] = useState<RoutineBlock[]>([]);

  // API Config
  const [aiConfig, setAiConfig] = useState<{ apiKey: string, model: string } | null>(null);

  useEffect(() => {
    const key = localStorage.getItem("byok_api_key");
    const model = localStorage.getItem("byok_ai_model") || "gemini-1.5-flash";
    if (key) {
      setAiConfig({ apiKey: key, model });
    } else {
      toast.error("No API key found. Redirecting to settings.");
      router.push("/profile");
    }
  }, [router]);

  const handleNextStep = (current: WizardStep, value: string) => {
    if (current === "must_do") {
      if (!value.trim()) setMustDo("Nothing specific.");
      setStep("fixed_events");
    } else if (current === "fixed_events") {
      if (!value.trim()) setFixedEvents("No fixed events.");
      setStep("vibe");
    } else if (current === "vibe") {
      if (!value.trim()) setVibe("Just a normal day.");
      handleGenerateFirstTime(mustDo, fixedEvents, value);
    }
  };

  const handleGenerateFirstTime = async (finalMustDo: string, finalFixedEvents: string, finalVibe: string) => {
    if (!aiConfig) return;

    setStep("generating");
    
    const promptContent = `Here is what I need for my routine today:
- Must-do tasks: ${finalMustDo || "Nothing specific."}
- Fixed events/appointments: ${finalFixedEvents || "No fixed events."}
- Overall vibe/priority: ${finalVibe || "Just a normal day."}

Please build my routine for today around this.`;

    const newUserMessage: ModelMessage = { role: "user", content: promptContent };
    const apiMessages = [newUserMessage];
    
    setMessages(apiMessages);

    try {
      const response = await generateAuthenticatedRoutine(apiMessages, aiConfig.apiKey, aiConfig.model);
      
      const newAiMessage: ModelMessage = { 
        role: "assistant", 
        content: response.message + (response.blocks ? JSON.stringify(response.blocks) : "") 
      };
      setMessages([...apiMessages, newAiMessage]);
      setAiClarification(response.message);

      if (response.updated_global_context) {
        toast.success("✨ AI updated your permanent preferences!");
      }

      if (response.type === "routine" && response.blocks) {
        processAIBlocks(response.blocks);
      }
    } catch (err: any) {
      handleApiError(err);
    }
  };

  const handleRefine = async () => {
    if (!refinementInput.trim() || !aiConfig) return;

    setStep("generating");
    
    const newUserMessage: ModelMessage = { role: "user", content: refinementInput };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setRefinementInput("");

    const apiMessages = [...updatedMessages];
    if (generatedBlocks.length > 0) {
      const lastMsgIndex = apiMessages.length - 1;
      const lastMsg = apiMessages[lastMsgIndex];
      if (lastMsg.role === 'user' && typeof lastMsg.content === 'string') {
        apiMessages[lastMsgIndex] = {
          ...lastMsg,
          content: `Current routine state (includes manual edits):\n${JSON.stringify(generatedBlocks)}\n\nUser request: ${lastMsg.content}`
        };
      }
    }

    try {
      const response = await generateAuthenticatedRoutine(apiMessages, aiConfig.apiKey, aiConfig.model);
      
      const newAiMessage: ModelMessage = { 
        role: "assistant", 
        content: response.message + (response.blocks ? JSON.stringify(response.blocks) : "") 
      };
      setMessages([...updatedMessages, newAiMessage]);
      setAiClarification(response.message);

      if (response.updated_global_context) {
        toast.success("✨ AI updated your permanent preferences!");
      }

      if (response.type === "routine" && response.blocks) {
        processAIBlocks(response.blocks);
      }
    } catch (err: any) {
      handleApiError(err);
    }
  };

  const processAIBlocks = (blocks: any[]) => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const blocksWithIds = blocks.map((b: any) => {
      const stParts = b.start_time.split(":");
      const etParts = b.end_time.split(":");
      const st = `${stParts[0].padStart(2, '0')}:${(stParts[1] || '00').substring(0,2)}:00`;
      const et = `${etParts[0].padStart(2, '0')}:${(etParts[1] || '00').substring(0,2)}:00`;

      const startTimestamp = new Date(`${dateStr}T${st}.000Z`);
      let endTimestamp = new Date(`${dateStr}T${et}.000Z`);

      if (endTimestamp < startTimestamp) {
        endTimestamp = new Date(endTimestamp.getTime() + 24 * 60 * 60 * 1000);
      }
      
      return {
        ...b,
        start_time: startTimestamp.toISOString(),
        end_time: endTimestamp.toISOString(),
        id: Math.random().toString(),
        source: 'ai' as const
      };
    });
    setGeneratedBlocks(blocksWithIds as RoutineBlock[]);
    setStep("review");
    toast.success("Routine updated!");
  };

  const handleApiError = (err: any) => {
    console.error(err);
    const errMsg = err.message || "";
    
    if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("QUOTA_EXCEEDED")) {
      toast.error(
        errMsg.includes("API_KEY_INVALID") 
          ? "Your AI API Key is invalid." 
          : "You exceeded your AI provider's quota.", 
        {
          action: {
            label: 'Go to Settings',
            onClick: () => router.push('/profile')
          },
          duration: 5000,
        }
      );
    } else if (errMsg.includes("PROVIDER_ERROR:")) {
      const cleanMsg = errMsg.split("PROVIDER_ERROR:")[1].trim();
      toast.error(cleanMsg, { duration: 5000 });
    } else {
      toast.error("Failed to generate routine. Please try again.");
    }
    
    // If it was the first generation that failed, go back to vibe step. 
    // If it was a refinement, go back to review step.
    if (messages.length <= 1) {
      setStep("vibe");
    } else {
      setStep("review");
      setMessages(messages.slice(0, -1)); // Revert last message
    }
  };

  const handleAccept = async () => {
    if (generatedBlocks.length === 0) return;
    setSaving(true);
    
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    try {
      await saveRoutine(dateStr, generatedBlocks.map(b => ({
        start_time: b.start_time,
        end_time: b.end_time,
        label: b.label,
        category: b.category || "other",
        source: b.source
      })));
      toast.success("Routine saved successfully!");
      router.push("/home");
    } catch (err: any) {
      toast.error(err.message || "Failed to save routine.");
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    router.push("/home");
  };

  if (!aiConfig) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
      <FloatingBackground />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6 md:px-12 bg-white/50 backdrop-blur-md border-b-2 border-gray-100">
        <button 
          onClick={handleDiscard}
          className="p-2 rounded-xl bg-white border-2 border-gray-200 text-gray-500 shadow-sm active:translate-y-1 active:shadow-none transition-all hover:bg-gray-50"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-gray-800">Build Today's Routine</h1>
        <div className="w-10 h-10" />
      </div>

      <div className="flex-1 flex flex-col items-center p-6 md:p-12 z-10 w-full max-w-4xl mx-auto gap-8">
        
        {step !== "generating" && step !== "review" && (
          <div className="w-full text-center mb-2 animate-in fade-in slide-in-from-top-4 duration-500">
            <span className="inline-flex items-center gap-2 bg-pink-100 text-pink-800 px-4 py-2 rounded-full font-bold text-sm tracking-wide border-2 border-pink-200 shadow-sm">
              <Sparkles size={16} /> Routine Wizard
            </span>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {step === "must_do" && (
            <motion.div key="must_do" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-2xl flex flex-col gap-6">
              <div className="bg-blue-50 border-4 border-blue-200 rounded-3xl p-6 shadow-sm flex items-start gap-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-500">
                  <Sparkles size={24} />
                </div>
                <div className="flex-1 pt-2 min-h-[40px] flex items-center">
                  <p className="text-lg font-bold text-blue-900 leading-tight">
                    First, what are your absolute must-do tasks for today?
                  </p>
                </div>
              </div>
              <MumbleBar 
                value={mustDo} 
                onChange={setMustDo} 
                onSubmit={() => handleNextStep("must_do", mustDo)}
                placeholder="e.g. Finish the Q3 report, hit the gym..."
              />
              <div className="flex justify-between items-center gap-4">
                 <button onClick={() => handleNextStep("must_do", "")} className="text-gray-400 font-bold hover:text-gray-600 transition-colors">
                   Skip
                 </button>
                 <Button onClick={() => handleNextStep("must_do", mustDo)}>
                   Next Step <FastForward size={20} className="ml-2"/>
                 </Button>
              </div>
            </motion.div>
          )}

          {step === "fixed_events" && (
            <motion.div key="fixed_events" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-2xl flex flex-col gap-6">
              <div className="bg-purple-50 border-4 border-purple-200 rounded-3xl p-6 shadow-sm flex items-start gap-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm text-purple-500">
                  <Sparkles size={24} />
                </div>
                <div className="flex-1 pt-2 min-h-[40px] flex items-center">
                  <p className="text-lg font-bold text-purple-900 leading-tight">
                    Any fixed appointments or meetings?
                  </p>
                </div>
              </div>
              <MumbleBar 
                value={fixedEvents} 
                onChange={setFixedEvents} 
                onSubmit={() => handleNextStep("fixed_events", fixedEvents)}
                placeholder="e.g. Dentist at 2pm, Team sync at 4:30pm..."
              />
              <div className="flex justify-between items-center gap-4">
                 <button onClick={() => handleNextStep("fixed_events", "")} className="text-gray-400 font-bold hover:text-gray-600 transition-colors">
                   None
                 </button>
                 <Button onClick={() => handleNextStep("fixed_events", fixedEvents)}>
                   Next Step <FastForward size={20} className="ml-2"/>
                 </Button>
              </div>
            </motion.div>
          )}

          {step === "vibe" && (
            <motion.div key="vibe" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-2xl flex flex-col gap-6">
              <div className="bg-orange-50 border-4 border-orange-200 rounded-3xl p-6 shadow-sm flex items-start gap-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm text-orange-500">
                  <Sparkles size={24} />
                </div>
                <div className="flex-1 pt-2 min-h-[40px] flex items-center">
                  <p className="text-lg font-bold text-orange-900 leading-tight">
                    What's the overall vibe today?
                  </p>
                </div>
              </div>
              <MumbleBar 
                value={vibe} 
                onChange={setVibe} 
                onSubmit={() => handleNextStep("vibe", vibe)}
                placeholder="e.g. Focused work, Relaxed, Deep cleaning..."
              />
              <div className="flex justify-between items-center gap-4">
                 <button onClick={() => handleNextStep("vibe", "")} className="text-gray-400 font-bold hover:text-gray-600 transition-colors">
                   Skip
                 </button>
                 <Button onClick={() => handleNextStep("vibe", vibe)}>
                   Generate Routine ✨
                 </Button>
              </div>
            </motion.div>
          )}

          {step === "generating" && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center flex-1 py-20">
              <div className="mb-6 transform scale-150">
                <TypingIndicator />
              </div>
              <h2 className="text-3xl font-black text-gray-800 mb-2">Building your day...</h2>
              <p className="text-xl font-bold text-gray-500">The AI is crafting the perfect schedule.</p>
            </motion.div>
          )}

          {step === "review" && (
            <motion.div key="review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full flex flex-col gap-6">
              <div className="bg-pink-50 border-4 border-pink-200 rounded-3xl p-6 shadow-sm flex items-start gap-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm text-pink-500">
                  <Sparkles size={24} />
                </div>
                <div className="flex-1 pt-2 min-h-[40px] flex items-center">
                  <p className="text-lg font-bold text-pink-900 leading-tight">
                    {aiClarification || "Here's your routine. Need to change anything?"}
                  </p>
                </div>
              </div>
              
              <MumbleBar 
                value={refinementInput} 
                onChange={setRefinementInput} 
                onSubmit={handleRefine}
                placeholder="e.g. Actually, make lunch 30 mins longer..."
              />
              
              <div className="flex justify-end">
                <Button type="button" variant="secondary" onClick={handleRefine} disabled={!refinementInput.trim()}>
                   Refine
                </Button>
              </div>

              {generatedBlocks.length > 0 && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-black text-gray-800">Preview</h2>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Draft
                    </span>
                  </div>
                  <RoutineViewer 
                    blocks={generatedBlocks} 
                    viewDateStr={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
                    readOnly={false} 
                    onBlockUpdate={(b) => setGeneratedBlocks(prev => prev.map(old => old.id === b.id ? b : old))}
                    onBlockAdd={(b) => setGeneratedBlocks(prev => [...prev, { ...b, id: Math.random().toString() } as RoutineBlock])}
                    onBlockDelete={(id) => setGeneratedBlocks(prev => prev.filter(b => b.id !== id))}
                    initialScrollTime="current"
                  />
                </div>
              )}
              
              <div className="flex flex-col md:flex-row gap-4 mb-12">
                <Button type="button" variant="primary" fullWidth onClick={handleAccept} disabled={saving}>
                  {saving ? "Saving..." : (
                    <span className="flex items-center gap-2"><Check size={20} /> Accept & Save</span>
                  )}
                </Button>
                <Button type="button" variant="secondary" fullWidth onClick={handleDiscard} disabled={saving}>
                  <span className="flex items-center gap-2"><X size={20} /> Discard</span>
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
