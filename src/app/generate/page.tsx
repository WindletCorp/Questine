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
import { ArrowLeft, Sparkles, Check, X } from "lucide-react";

export default function GeneratePage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // State for the conversation
  const [messages, setMessages] = useState<ModelMessage[]>([]);
  const [aiClarification, setAiClarification] = useState<string>("Tell me about your day!");
  const [generatedBlocks, setGeneratedBlocks] = useState<RoutineBlock[]>([]);

  // Get API key and model from local storage on mount
  const [aiConfig, setAiConfig] = useState<{ apiKey: string, model: string } | null>(null);

  useEffect(() => {
    const key = localStorage.getItem("byok_api_key");
    const model = localStorage.getItem("byok_ai_model") || "gemini-2.5-flash";
    if (key) {
      setAiConfig({ apiKey: key, model });
    } else {
      toast.error("No API key found. Redirecting to settings.");
      router.push("/settings");
    }
  }, [router]);

  const handleGenerate = async () => {
    if (!inputValue.trim() && messages.length === 0) return;
    if (!aiConfig) return;

    setLoading(true);
    
    // Add user's message to the conversation history
    const newUserMessage: ModelMessage = { role: "user", content: inputValue || "Generate my routine." };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setAiClarification("Thinking...");

    // Inject current blocks state into the prompt for the AI so it respects manual edits
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
      
      // Add the AI's response to the history so it remembers its own questions/blocks
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
        const blocksWithIds = response.blocks.map(b => ({
          ...b,
          id: Math.random().toString(),
          source: 'ai' as const
        }));
        setGeneratedBlocks(blocksWithIds as RoutineBlock[]);
        toast.success("Routine updated!");
      }
    } catch (err: any) {
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
              onClick: () => router.push('/settings')
            },
            duration: 5000,
          }
        );
        setAiClarification("Please update your API Key or Model in Settings.");
      } else if (errMsg.includes("PROVIDER_ERROR:")) {
        const cleanMsg = errMsg.split("PROVIDER_ERROR:")[1].trim();
        toast.error(cleanMsg, { duration: 5000 });
        setAiClarification("The AI provider had an issue. Please wait a moment and try again.");
      } else {
        toast.error("Failed to generate routine. Please try again.");
        setAiClarification("Oops, something went wrong. Try again.");
      }
      
      // Revert the last user message from history on error so they can retry
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (generatedBlocks.length === 0) return;
    setSaving(true);
    
    // Get today's date in local YYYY-MM-DD
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

  if (!aiConfig) return null; // Wait for redirect if no key

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
        <div className="w-10 h-10" /> {/* Spacer for centering */}
      </div>

      <div className="flex-1 flex flex-col items-center p-6 md:p-12 z-10 w-full max-w-4xl mx-auto gap-8">
        
        {/* Interaction Area */}
        <div className="w-full flex flex-col gap-4">
          <div className="bg-pink-50 border-4 border-pink-200 rounded-3xl p-6 shadow-sm flex items-start gap-4">
            <div className="bg-white p-3 rounded-2xl shadow-sm text-pink-500">
              <Sparkles size={24} />
            </div>
            <div className="flex-1 pt-2">
              <p className="text-lg font-bold text-pink-900 leading-tight">
                {aiClarification}
              </p>
            </div>
          </div>
          
          <MumbleBar 
            value={inputValue} 
            onChange={setInputValue} 
            onSubmit={handleGenerate}
            placeholder={messages.length === 0 ? "e.g. I have a dentist appointment at 2pm..." : "Refine your routine..."}
          />
          <div className="flex justify-end">
            <Button 
              type="button" 
              variant="primary" 
              onClick={handleGenerate} 
              disabled={loading || (!inputValue.trim() && messages.length === 0)}
            >
              {loading ? "Generating..." : (messages.length === 0 ? "Generate" : "Refine")}
            </Button>
          </div>
        </div>

        {/* Preview Area */}
        {generatedBlocks.length > 0 && (
          <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-black text-gray-800">Preview</h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Draft
                </span>
              </div>
              <RoutineViewer 
                blocks={generatedBlocks} 
                readOnly={false} 
                onBlockUpdate={(b) => setGeneratedBlocks(prev => prev.map(old => old.id === b.id ? b : old))}
                onBlockAdd={(b) => setGeneratedBlocks(prev => [...prev, { ...b, id: Math.random().toString() } as RoutineBlock])}
                onBlockDelete={(id) => setGeneratedBlocks(prev => prev.filter(b => b.id !== id))}
                initialScrollTime="current"
              />
            </div>
            
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
          </div>
        )}

      </div>
    </div>
  );
}
