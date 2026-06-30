"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Settings, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalView = 'none' | 'context' | 'byok';

export default function SettingsPage() {
  const [globalContext, setGlobalContext] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalView>('none');
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("global_context")
        .eq("id", user.id)
        .single();
      
      if (profile?.global_context) {
        setGlobalContext(profile.global_context);
      }

      const storedKey = localStorage.getItem("byok_api_key");
      if (storedKey) setApiKey(storedKey);

      const storedModel = localStorage.getItem("byok_ai_model");
      if (storedModel) setAiModel(storedModel);

      setLoading(false);
    }
    loadSettings();
  }, [supabase, router]);

  const saveContext = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ global_context: globalContext })
        .eq("id", user.id);
      
      if (error) {
        toast.error(`Failed to save context: ${error.message}`);
      } else {
        toast.success("Context saved successfully!");
        setActiveModal('none');
      }
    }
    setSaving(false);
  };

  const saveBYOK = async () => {
    setSaving(true);
    if (apiKey) {
      localStorage.setItem("byok_api_key", apiKey);
    } else {
      localStorage.removeItem("byok_api_key");
    }
    
    if (aiModel) {
      localStorage.setItem("byok_ai_model", aiModel);
    }
    
    toast.success("AI API Settings saved successfully!");
    setActiveModal('none');
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      <FloatingBackground />
      
      <div className="w-full max-w-lg flex flex-col gap-6 z-10 relative">
        <div className="text-center w-full mb-4">
          <h1 className="text-4xl font-black text-foreground mb-3 tracking-tight">
            Settings
          </h1>
          <p className="text-zinc-500 font-bold text-lg">
            Configure your Questine experience.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={() => setActiveModal('context')}
            className="w-full bg-white hover:bg-gray-50 border-4 border-gray-200 rounded-3xl p-6 flex items-center justify-between transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-500">
                <Settings size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800">Global Context</h3>
                <p className="text-sm font-bold text-gray-400">Edit your daily routine instructions</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300" size={28} />
          </button>

          <button 
            onClick={() => setActiveModal('byok')}
            className="w-full bg-white hover:bg-gray-50 border-4 border-gray-200 rounded-3xl p-6 flex items-center justify-between transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-500">
                <BrainCircuit size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800">AI Model & API Key</h3>
                <p className="text-sm font-bold text-gray-400">Bring your own key & select model</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300" size={28} />
          </button>
        </div>

        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={() => router.push("/home")}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* FULL SCREEN MODALS */}
      <AnimatePresence>
        {activeModal !== 'none' && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
          >
            {activeModal === 'context' && (
              <div className="p-6 md:p-12 flex-1 flex flex-col max-w-2xl mx-auto w-full relative h-full">
                <div className="flex-1 flex flex-col pt-12">
                  <h2 className="text-3xl font-black text-gray-800 mb-2">Global Context</h2>
                  <p className="text-gray-500 font-bold mb-8">
                    The AI uses this baseline to structure your daily routines. Give it your typical wake up time, work hours, and mandatory habits.
                  </p>
                  
                  <textarea 
                    value={globalContext}
                    onChange={(e) => setGlobalContext(e.target.value)}
                    placeholder="e.g. I wake up around 7am, workout, and work 9-5..."
                    className="w-full flex-1 max-h-[40vh] text-xl font-bold bg-white border-4 border-gray-200 rounded-3xl p-6 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all resize-none shadow-sm"
                  />
                </div>

                <div className="pt-8 pb-4 flex flex-col gap-4 mt-auto">
                  <Button type="button" variant="primary" fullWidth onClick={saveContext} disabled={saving}>
                    {saving ? "Saving..." : "Save Context"}
                  </Button>
                  <Button type="button" variant="secondary" fullWidth onClick={() => setActiveModal('none')} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {activeModal === 'byok' && (
              <div className="p-6 md:p-12 flex-1 flex flex-col max-w-2xl mx-auto w-full relative h-full">
                <div className="flex-1 flex flex-col pt-12">
                  <h2 className="text-3xl font-black text-gray-800 mb-2">AI Settings</h2>
                  <p className="text-gray-500 font-bold mb-8">
                    Bring your own Gemini API key. Stored securely in your browser's local storage.
                  </p>
                  
                  <div className="flex flex-col gap-8">
                    <div>
                      <Input 
                        label="Gemini API Key" 
                        type="password" 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">
                        AI Provider
                      </label>
                      <div className="flex flex-col gap-3">
                        <button
                          type="button"
                          className="w-full text-left p-5 rounded-2xl border-4 transition-all font-bold text-lg border-pink-400 bg-pink-50 text-pink-900"
                        >
                          Google (Gemini)
                        </button>
                        <p className="text-xs text-gray-400 font-semibold px-2">
                          More providers (OpenAI, Anthropic) coming soon.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">
                        Model Selection
                      </label>
                      <div className="flex flex-col gap-3">
                        {['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash-lite'].map((model) => (
                          <button
                            key={model}
                            type="button"
                            onClick={() => setAiModel(model)}
                            className={cn(
                              "w-full text-left p-5 rounded-2xl border-4 transition-all font-bold text-lg",
                              aiModel === model 
                                ? "border-pink-400 bg-pink-50 text-pink-900" 
                                : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
                            )}
                          >
                            {model}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 pb-4 flex flex-col gap-4 mt-auto">
                  <Button type="button" variant="primary" fullWidth onClick={saveBYOK} disabled={saving}>
                    {saving ? "Saving..." : "Save AI Settings"}
                  </Button>
                  <Button type="button" variant="secondary" fullWidth onClick={() => setActiveModal('none')} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
