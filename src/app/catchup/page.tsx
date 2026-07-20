"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MumbleBar } from "@/components/ui/MumbleBar";
import { RoutineViewer, RoutineBlock } from "@/components/routine/RoutineViewer";
import { Button } from "@/components/ui/Button";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import { generateCatchUpRoutine } from "@/app/actions/generateCatchUpRoutine";
import { saveCatchUp, SaveTask, SaveMetric } from "@/app/actions/saveCatchUp";
import { toast } from "sonner";
import { ArrowLeft, Check, X, Calendar, Activity, CheckSquare, FastForward, Sparkles } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { TaskCard } from "@/components/ui/TaskCard";
import { TypingIndicator } from "@/components/ui/TypingIndicator";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type WizardState = "loading" | "no_plan" | "review" | "mind_dump" | "final_mind_dump" | "generating" | "final";

interface BlockReview {
  block: RoutineBlock;
  nailedIt: boolean;
  actualText?: string;
}

export default function CatchUpPage() {
  const router = useRouter();
  
  const searchParams = useSearchParams();
  const dateParam = searchParams?.get("date");
  
  const displayDateStr = React.useMemo(() => {
    if (!dateParam) return "Today";
    const [year, month, day] = dateParam.split("-");
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return d.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' });
  }, [dateParam]);
  
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    dateParam || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
  );

  useEffect(() => {
    if (dateParam) {
      setSelectedDateStr(dateParam);
    }
  }, [dateParam]);

  const [wizardState, setWizardState] = useState<WizardState>("loading");
  const [plannedBlocks, setPlannedBlocks] = useState<RoutineBlock[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviews, setReviews] = useState<BlockReview[]>([]);
  
  const [showDeviationInput, setShowDeviationInput] = useState(false);
  const [deviationText, setDeviationText] = useState("");
  const [fallbackInput, setFallbackInput] = useState("");
  
  const [aiConfig, setAiConfig] = useState<{ apiKey: string, model: string } | null>(null);

  const [generatedBlocks, setGeneratedBlocks] = useState<RoutineBlock[]>([]);
  const [generatedTasks, setGeneratedTasks] = useState<SaveTask[]>([]);
  const [generatedMetrics, setGeneratedMetrics] = useState<SaveMetric[]>([]);
  const [saving, setSaving] = useState(false);

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

  // Fetch planned blocks
  useEffect(() => {
    const fetchBlocks = async () => {
      setWizardState("loading");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const startOfDay = new Date(`${selectedDateStr}T00:00:00.000Z`).toISOString();
      const endOfDay = new Date(new Date(startOfDay).getTime() + 24 * 60 * 60 * 1000).toISOString();
      
      const { data } = await supabase.from("timeline_blocks")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_time", startOfDay)
        .lt("start_time", endOfDay)
        .order("start_time");
        
      if (data && data.length > 0) {
        const nowIso = new Date().toISOString();
        const actualBlocks = data.filter((b: any) => b.type === "actual");
        const planned = data.filter((b: any) => {
           if (b.type !== "plan") return false;
           if (b.start_time > nowIso) return false;
           const hasActual = actualBlocks.some((a: any) => a.start_time <= b.start_time && a.end_time > b.start_time);
           return !hasActual;
        });

        if (planned.length > 0) {
          setPlannedBlocks(planned as RoutineBlock[]);
          setWizardState("review");
        } else {
          setWizardState("no_plan");
        }
      } else {
        setWizardState("no_plan");
      }
    };
    
    fetchBlocks();
  }, [selectedDateStr]);

  const currentBlock = plannedBlocks[reviewIndex];

  const executeAI = async (finalReviews: BlockReview[], isFallback: boolean, finalDump?: string) => {
    if (!aiConfig) return;
    setWizardState("generating");
    
    let promptContent = "";
    if (isFallback) {
      promptContent = fallbackInput;
    } else {
      const nailed = finalReviews.filter(r => r.nailedIt).map(r => `- ${new Date(r.block.start_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit', timeZone: 'UTC'})} to ${new Date(r.block.end_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit', timeZone: 'UTC'})}: ${r.block.label}`);
      const deviated = finalReviews.filter(r => !r.nailedIt).map(r => `- Instead of ${r.block.label}, I did: "${r.actualText}"`);
      
      promptContent = `I completed the following planned blocks exactly as planned:\n${nailed.join("\n") || "None"}\n\nFor the other blocks, here is what I actually did:\n${deviated.join("\n") || "None"}\n\n${finalDump ? `Additionally, here is a final mind dump of other things I did: "${finalDump}"\n\n` : ''}Please generate my final actual timeline for today. Ignore blocks I nailed exactly, and focus on generating Actuals for the deviations.`;
    }

    try {
      const response = await generateCatchUpRoutine([{ role: "user", content: promptContent }], selectedDateStr, aiConfig.apiKey, aiConfig.model);
      
      if (response.type === "routine" && response.blocks) {
        const blocksWithIds = response.blocks.map((b: any) => {
          const stParts = b.start_time.split(":");
          const etParts = b.end_time.split(":");
          const st = `${stParts[0].padStart(2, '0')}:${(stParts[1] || '00').substring(0,2)}:00`;
          const et = `${etParts[0].padStart(2, '0')}:${(etParts[1] || '00').substring(0,2)}:00`;

          const startTimestamp = new Date(`${selectedDateStr}T${st}.000Z`);
          let endTimestamp = new Date(`${selectedDateStr}T${et}.000Z`);

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
        setGeneratedBlocks(blocksWithIds);
        setGeneratedTasks(response.tasks || []);
        setGeneratedMetrics(response.metrics || []);
        setWizardState("final");
        toast.success("Reality processed!");
      } else {
        throw new Error("Failed to generate blocks");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to process update.");
      setWizardState(isFallback ? "no_plan" : "review"); 
    }
  };

  const handleNextWithReview = (newReview: BlockReview) => {
    const updatedReviews = [...reviews, newReview];
    setReviews(updatedReviews);
    
    if (reviewIndex < plannedBlocks.length - 1) {
      setReviewIndex(prev => prev + 1);
      setShowDeviationInput(false);
      setDeviationText("");
    } else {
      setFallbackInput(""); // clear it for final dump
      setWizardState("final_mind_dump");
    }
  };

  const handleBack = () => {
    if (reviewIndex > 0) {
      setReviewIndex(prev => prev - 1);
      setReviews(prev => prev.slice(0, -1));
      setShowDeviationInput(false);
      setDeviationText("");
    }
  };

  const handleAccept = async () => {
    if (generatedBlocks.length === 0 && generatedTasks.length === 0 && generatedMetrics.length === 0) return;
    setSaving(true);
    
    try {
      await saveCatchUp(
        selectedDateStr,
        "Logged via wizard",
        generatedBlocks.map(b => ({
          start_time: b.start_time,
          end_time: b.end_time,
          label: b.label,
          category: b.category || "other",
          source: b.source
        })),
        generatedTasks,
        generatedMetrics
      );
      toast.success("Reality saved successfully!");
      router.push("/home");
    } catch (err: any) {
      toast.error(err.message || "Failed to save.");
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
      <FloatingBackground />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6 md:px-12 bg-white/50 backdrop-blur-md border-b-2 border-gray-100">
        <button 
          onClick={() => router.push("/home")}
          className="p-2 rounded-xl bg-white border-2 border-gray-200 text-gray-500 shadow-sm active:translate-y-1 active:shadow-none transition-all hover:bg-gray-50"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-gray-800">Catch-Up</h1>
        <div className="w-10 h-10" />
      </div>

      <div className="flex-1 flex flex-col items-center p-6 md:p-12 z-10 w-full max-w-4xl mx-auto gap-8">
        
        {wizardState !== "loading" && (
          <div className="w-full text-center mb-2 animate-in fade-in slide-in-from-top-4 duration-500">
            <span className="inline-flex items-center gap-2 bg-pink-100 text-pink-800 px-4 py-2 rounded-full font-bold text-sm tracking-wide border-2 border-pink-200 shadow-sm">
              <Calendar size={16} /> Log Reality: {displayDateStr}
            </span>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {wizardState === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center flex-1 py-20">
              <div className="mb-4">
                <TypingIndicator />
              </div>
              <p className="text-xl font-bold text-gray-500">Fetching your plan...</p>
            </motion.div>
          )}

          {wizardState === "no_plan" && (
            <motion.div key="noplan" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-2xl flex flex-col gap-6">
              <div className="bg-blue-50 border-4 border-blue-200 rounded-3xl p-6 shadow-sm flex items-start gap-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-500">
                  <Sparkles size={24} />
                </div>
                <div className="flex-1 pt-2 min-h-[40px] flex items-center">
                  <p className="text-lg font-bold text-blue-900 leading-tight">
                    You didn't plan a routine for this day. What did you end up doing?
                  </p>
                </div>
              </div>
              <MumbleBar 
                value={fallbackInput} 
                onChange={setFallbackInput} 
                onSubmit={() => executeAI([], true)}
                placeholder="e.g. I woke up at 9, ran 5km, and did laundry..."
              />
              <Button onClick={() => executeAI([], true)} disabled={!fallbackInput.trim()}>
                Process Logs
              </Button>
            </motion.div>
          )}

          {wizardState === "mind_dump" && (
            <motion.div key="minddump" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-2xl flex flex-col gap-6">
              <div className="bg-purple-50 border-4 border-purple-200 rounded-3xl p-6 shadow-sm flex items-start gap-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm text-purple-500">
                  <Sparkles size={24} />
                </div>
                <div className="flex-1 pt-2 min-h-[40px] flex items-center">
                  <p className="text-lg font-bold text-purple-900 leading-tight">
                    Skip the block-by-block review. Just tell me what you did today!
                  </p>
                </div>
              </div>
              <MumbleBar 
                value={fallbackInput} 
                onChange={setFallbackInput} 
                onSubmit={() => executeAI([], true)}
                placeholder="e.g. I followed the plan until noon, but then I had to go to the dentist..."
              />
              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => setWizardState("review")} className="flex-1">
                  Back to Review
                </Button>
                <Button onClick={() => executeAI([], true)} disabled={!fallbackInput.trim()} className="flex-1 bg-purple-500 hover:bg-purple-600 shadow-[0_4px_0_0_#9333ea]">
                  Process Reality
                </Button>
              </div>
            </motion.div>
          )}

          {wizardState === "review" && currentBlock && (
            <motion.div key="review" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full max-w-xl flex flex-col gap-6">
              
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  {reviewIndex > 0 && (
                    <button 
                      onClick={handleBack}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Back to previous block"
                    >
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  <div className="font-bold text-gray-400 text-sm tracking-widest uppercase">
                    Reviewing Block {reviewIndex + 1} of {plannedBlocks.length}
                  </div>
                </div>
                <button
                  onClick={() => setWizardState("mind_dump")}
                  className="text-xs font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                >
                  <Sparkles size={14} /> AI Mind Dump
                </button>
              </div>

              <div className="bg-white p-8 rounded-[2rem] shadow-sm border-4 border-gray-100 flex flex-col items-center text-center gap-4">
                <span className="text-pink-500 font-black text-xl">
                  {new Date(currentBlock.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} - {new Date(currentBlock.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                </span>
                <h2 className="text-4xl font-black text-gray-800">{currentBlock.label}</h2>
              </div>

              {!showDeviationInput ? (
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="secondary" className="py-6 text-xl bg-red-50 hover:bg-red-100 border-red-200 text-red-600 shadow-[0_4px_0_0_#fecaca]" onClick={() => setShowDeviationInput(true)}>
                    <X size={24} className="mr-2" /> Did Something Else
                  </Button>
                  <Button variant="primary" className="py-6 text-xl bg-emerald-400 hover:bg-emerald-500 shadow-[0_4px_0_0_#34d399]" onClick={() => handleNextWithReview({ block: currentBlock, nailedIt: true })}>
                    <Check size={24} className="mr-2" /> Nailed It!
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-orange-50 border-4 border-orange-200 rounded-3xl p-6 shadow-sm">
                     <p className="text-lg font-bold text-orange-900 mb-4">What did you do instead?</p>
                     <MumbleBar 
                       value={deviationText}
                       onChange={setDeviationText}
                       onSubmit={() => handleNextWithReview({ block: currentBlock, nailedIt: false, actualText: deviationText })}
                       placeholder="e.g. Scrolled TikTok for an hour..."
                     />
                  </div>
                  <div className="flex gap-4">
                    <Button variant="secondary" onClick={() => setShowDeviationInput(false)} className="flex-1">Back</Button>
                    <Button variant="primary" disabled={!deviationText.trim()} onClick={() => handleNextWithReview({ block: currentBlock, nailedIt: false, actualText: deviationText })} className="flex-1 bg-orange-500 hover:bg-orange-600 shadow-[0_4px_0_0_#ea580c]">
                      Next <FastForward size={20} className="ml-2"/>
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {wizardState === "final_mind_dump" && (
            <motion.div key="final_mind_dump" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-2xl flex flex-col gap-6">
              <div className="bg-purple-50 border-4 border-purple-200 rounded-3xl p-6 shadow-sm flex items-start gap-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm text-purple-500">
                  <Sparkles size={24} />
                </div>
                <div className="flex-1 pt-2 min-h-[40px] flex items-center">
                  <p className="text-lg font-bold text-purple-900 leading-tight">
                    Awesome, you reviewed all your blocks! Did anything else happen today that wasn't on the plan?
                  </p>
                </div>
              </div>
              <MumbleBar 
                value={fallbackInput} 
                onChange={setFallbackInput} 
                onSubmit={() => executeAI(reviews, false, fallbackInput)}
                placeholder="e.g. I randomly decided to clean the garage for an hour..."
              />
              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => executeAI(reviews, false)} className="flex-1">
                  Skip & Process
                </Button>
                <Button onClick={() => executeAI(reviews, false, fallbackInput)} disabled={!fallbackInput.trim()} className="flex-1 bg-purple-500 hover:bg-purple-600 shadow-[0_4px_0_0_#9333ea]">
                  Process Reality
                </Button>
              </div>
            </motion.div>
          )}

          {wizardState === "generating" && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center flex-1 py-20">
              <div className="mb-6 transform scale-150">
                <TypingIndicator />
              </div>
              <h2 className="text-3xl font-black text-gray-800 mb-2">Compiling your day...</h2>
              <p className="text-xl font-bold text-gray-500">The AI is parsing your logs and building your actual timeline.</p>
            </motion.div>
          )}

          {wizardState === "final" && (
             <motion.div key="final" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full flex flex-col gap-6">
                
                {generatedMetrics.length > 0 && (
                  <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold mb-2">
                      <Activity size={20} />
                      <span>Metrics Extracted</span>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {generatedMetrics.map((m, i) => {
                        const themes = ["indigo", "pink", "blue", "emerald", "orange"] as const;
                        return (
                          <MetricCard 
                            key={i} 
                            name={m.name} 
                            value={m.value} 
                            unit={m.unit} 
                            colorTheme={themes[i % themes.length]}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
    
                {generatedTasks.length > 0 && (
                  <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2">
                      <CheckSquare size={20} />
                      <span>Tasks Captured</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {generatedTasks.map((t, i) => (
                        <TaskCard key={i} title={t.title} status={t.status} />
                      ))}
                    </div>
                  </div>
                )}
    
                {generatedBlocks.length > 0 && (
                  <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-black text-gray-800">Actual Routine Preview</h2>
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Timeline
                      </span>
                    </div>
                  <RoutineViewer 
                    blocks={generatedBlocks} 
                    viewDateStr={selectedDateStr}
                    viewMode="actual"
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
                    {saving ? "Saving Reality..." : (
                      <span className="flex items-center gap-2"><Check size={20} /> Confirm & Save Reality</span>
                    )}
                  </Button>
                  <Button type="button" variant="secondary" fullWidth onClick={() => {
                    setWizardState("review");
                    setReviewIndex(0);
                    setReviews([]);
                  }} disabled={saving}>
                    <span className="flex items-center gap-2"><X size={20} /> Start Over</span>
                  </Button>
                </div>

             </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
/* eslint-disable react/no-unescaped-entities, @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
