"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MumbleBar } from "@/components/ui/MumbleBar";
import { RoutineViewer, RoutineBlock } from "@/components/routine/RoutineViewer";
import { Button } from "@/components/ui/Button";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import { generateCatchUpRoutine } from "@/app/actions/generateCatchUpRoutine";
import { saveCatchUp, SaveTask, SaveMetric } from "@/app/actions/saveCatchUp";
import { ModelMessage } from "ai";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Check, X, Calendar, Activity, CheckSquare } from "lucide-react";
import { TypingIndicator } from "@/components/ui/TypingIndicator";
import { MetricCard } from "@/components/ui/MetricCard";
import { TaskCard } from "@/components/ui/TaskCard";
import { cn } from "@/lib/utils";

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

  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [messages, setMessages] = useState<ModelMessage[]>([]);
  const [aiClarification, setAiClarification] = useState<string>("What did you actually do? I'll update your routine.");
  const [generatedBlocks, setGeneratedBlocks] = useState<RoutineBlock[]>([]);
  const [generatedTasks, setGeneratedTasks] = useState<SaveTask[]>([]);
  const [generatedMetrics, setGeneratedMetrics] = useState<SaveMetric[]>([]);

  const [aiConfig, setAiConfig] = useState<{ apiKey: string, model: string } | null>(null);

  useEffect(() => {
    const key = localStorage.getItem("byok_api_key");
    const model = localStorage.getItem("byok_ai_model") || "gemini-1.5-flash";
    if (key) {
      setAiConfig({ apiKey: key, model });
    } else {
      toast.error("No API key found. Redirecting to settings.");
      router.push("/settings");
    }
  }, [router]);

  // Reset state when date changes
  useEffect(() => {
    setMessages([]);
    setGeneratedBlocks([]);
    setGeneratedTasks([]);
    setGeneratedMetrics([]);
    setAiClarification(`What did you actually do on ${displayDateStr}?`);
    setInputValue("");
  }, [selectedDateStr, displayDateStr]);

  const handleGenerate = async () => {
    if (!inputValue.trim() && messages.length === 0) return;
    if (!aiConfig) return;

    setLoading(true);
    
    const newUserMessage: ModelMessage = { role: "user", content: inputValue || "Process my update." };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setAiClarification("Parsing your update...");

    const apiMessages = [...updatedMessages];
    if (generatedBlocks.length > 0) {
      const lastMsgIndex = apiMessages.length - 1;
      const lastMsg = apiMessages[lastMsgIndex];
      if (lastMsg.role === 'user' && typeof lastMsg.content === 'string') {
        apiMessages[lastMsgIndex] = {
          ...lastMsg,
          content: `Current actual routine state (with manual edits):\n${JSON.stringify(generatedBlocks)}\n\nUser request: ${lastMsg.content}`
        };
      }
    }

    try {
      const response = await generateCatchUpRoutine(apiMessages, selectedDateStr, aiConfig.apiKey, aiConfig.model);
      
      const newAiMessage: ModelMessage = { 
        role: "assistant", 
        content: response.message + (response.blocks ? JSON.stringify(response.blocks) : "") 
      };
      setMessages([...updatedMessages, newAiMessage]);
      setAiClarification(response.message);

      if (response.type === "routine") {
        if (response.blocks) {
          const blocksWithIds = response.blocks.map((b: any) => {
            const st = b.start_time.length === 5 ? `${b.start_time}:00` : b.start_time;
            const et = b.end_time.length === 5 ? `${b.end_time}:00` : b.end_time;

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
          setGeneratedBlocks(blocksWithIds as RoutineBlock[]);
        }
        if (response.tasks) setGeneratedTasks(response.tasks);
        if (response.metrics) setGeneratedMetrics(response.metrics);
        toast.success("Reality processed!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to process update. Please try again.");
      setAiClarification("Oops, something went wrong. Try again.");
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (generatedBlocks.length === 0 && generatedTasks.length === 0 && generatedMetrics.length === 0) return;
    setSaving(true);
    
    try {
      const journalText = messages
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join("\n\n");

      await saveCatchUp(
        selectedDateStr,
        journalText,
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
        <h1 className="text-xl font-black text-gray-800">Catch-Up</h1>
        <div className="w-10 h-10" />
      </div>

      <div className="flex-1 flex flex-col items-center p-6 md:p-12 z-10 w-full max-w-4xl mx-auto gap-8">
        <div className="w-full text-center mb-2 animate-in fade-in slide-in-from-top-4 duration-500">
          <span className="inline-flex items-center gap-2 bg-pink-100 text-pink-800 px-4 py-2 rounded-full font-bold text-sm tracking-wide border-2 border-pink-200 shadow-sm">
            <Calendar size={16} /> Log Reality: {displayDateStr}
          </span>
        </div>

        {/* Interaction Area */}
        <div className="w-full flex flex-col gap-4">
          <div className="bg-blue-50 border-4 border-blue-200 rounded-3xl p-6 shadow-sm flex items-start gap-4">
            <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-500">
              <Sparkles size={24} />
            </div>
            <div className="flex-1 pt-2 min-h-[40px] flex items-center">
              {loading ? (
                <TypingIndicator />
              ) : (
                <p className="text-lg font-bold text-blue-900 leading-tight">
                  {aiClarification}
                </p>
              )}
            </div>
          </div>
          
          <MumbleBar 
            value={inputValue} 
            onChange={setInputValue} 
            onSubmit={handleGenerate}
            placeholder={messages.length === 0 ? "e.g. I woke up at 9, ran 5km, and did laundry..." : "Refine your log..."}
          />
          <div className="flex justify-end">
            <Button 
              type="button" 
              variant="primary" 
              onClick={handleGenerate} 
              disabled={loading || (!inputValue.trim() && messages.length === 0)}
            >
              {loading ? "Processing..." : (messages.length === 0 ? "Log Actual" : "Refine Log")}
            </Button>
          </div>
        </div>

        {/* Preview Area */}
        {(generatedBlocks.length > 0 || generatedTasks.length > 0 || generatedMetrics.length > 0) && (
          <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
            
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
                setGeneratedBlocks([]);
                setGeneratedTasks([]);
                setGeneratedMetrics([]);
              }} disabled={saving}>
                <span className="flex items-center gap-2"><X size={20} /> Clear</span>
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
