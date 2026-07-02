"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MumbleBar } from "@/components/ui/MumbleBar";
import { RoutineViewer, RoutineBlock } from "@/components/routine/RoutineViewer";
import { Button } from "@/components/ui/Button";
import { generateTrial } from "@/app/actions/generateTrial";
import { toast } from "sonner";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [globalContext, setGlobalContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [blocks, setBlocks] = useState<RoutineBlock[] | null>(null);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!globalContext.trim()) {
      toast.error("Please tell us a bit about your day first!");
      return;
    }

    setLoading(true);

    try {
      const generatedBlocks = await generateTrial(globalContext);
      
      const blocksWithIds = generatedBlocks.map((b, idx) => ({
        ...b,
        id: `trial-block-${idx}`
      }));
      
      setBlocks(blocksWithIds);
      setStep(2);
    } catch (err: any) {
      const isLoggedInError = err.message.toLowerCase().includes("logged in");
      toast.error(err.message || "Failed to generate routine.", {
        action: {
          label: isLoggedInError ? "Go to Dashboard" : "Sign Up Now",
          onClick: () => router.push(isLoggedInError ? "/home" : "/auth/signup")
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    if (blocks && blocks.length > 0) {
      sessionStorage.setItem("trial_data", JSON.stringify({
        globalContext,
        blocks: blocks.map(({ id, ...rest }) => rest)
      }));
    }
    router.push("/auth/signup");
  };

  const handleBlockUpdate = (updatedBlock: RoutineBlock) => {
    setBlocks(prev => prev ? prev.map(b => b.id === updatedBlock.id ? updatedBlock : b) : null);
  };

  const handleBlockDelete = (blockId: string) => {
    setBlocks(prev => prev ? prev.filter(b => b.id !== blockId) : null);
  };

  const handleBlockAdd = (newBlock: Omit<RoutineBlock, 'id'>) => {
    setBlocks(prev => prev ? [...prev, { ...newBlock, id: `manual-${Date.now()}` }] : null);
  };

  return (
    <div className="flex min-h-screen flex-col items-center pt-24 pb-12 px-4 bg-background relative overflow-hidden">
      <FloatingBackground />
      
      <div className="w-full max-w-2xl z-10 relative flex flex-col gap-8">
        
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-4 shrink-0">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (s < step || (blocks && s === 2)) setStep(s);
                }}
                disabled={!blocks && s > 1}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  step === s 
                    ? "bg-primary text-white shadow-[0_4px_0_0_#5BA9C6]" 
                    : step > s 
                      ? "bg-green-400 text-white shadow-[0_4px_0_0_#1CB854] cursor-pointer" 
                      : "bg-gray-200 text-gray-500 opacity-50 cursor-not-allowed"
                }`}
              >
                {step > s ? <Check size={20} /> : s}
              </button>
              {s !== 3 && <div className={`w-12 h-2 rounded-full transition-colors duration-300 ${step > s ? "bg-green-400" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="flex-1 w-full relative">
          <AnimatePresence mode="wait">
            {/* Step 1: Context Input */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-black text-foreground mb-4">
                    Let's build your routine!
                  </h1>
                  <p className="text-zinc-500 font-bold text-lg">
                    Tell me about your schedule, your goals, or anything that'd help build your perfect day.
                  </p>
                </div>

                <div className="flex flex-col gap-4 bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100">
                  <MumbleBar 
                    value={globalContext}
                    onChange={setGlobalContext}
                    placeholder="e.g. I wake up at 7am, work from 9 to 5, and want to fit in a 30min run..."
                    onSubmit={handleGenerate}
                  />
                  <Button 
                    onClick={handleGenerate} 
                    disabled={loading || !globalContext.trim()}
                    className="w-full py-4 text-lg"
                  >
                    {loading ? "Generating..." : "Build my routine"}
                  </Button>
                  
                  <div className="text-center mt-2">
                    <span className="text-zinc-500 font-medium">Already have an account? </span>
                    <button onClick={() => router.push('/auth/login')} className="text-blue-500 font-bold hover:underline">
                      Log In
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Review Calendar */}
            {step === 2 && blocks && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6 w-full"
              >
                <div className="text-center mb-2">
                  <h1 className="text-3xl font-black text-foreground mb-2">
                    Review & Edit
                  </h1>
                  <p className="text-zinc-500 font-bold">
                    Tap on any block to edit its timing, or click empty space to add a new one.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100">
                  <RoutineViewer 
                    blocks={blocks} 
                    readOnly={false} 
                    onBlockUpdate={handleBlockUpdate}
                    onBlockDelete={handleBlockDelete}
                    onBlockAdd={handleBlockAdd}
                  />
                </div>
                
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border-2 border-gray-100">
                  <button 
                    onClick={() => setStep(1)}
                    className="text-zinc-500 font-bold hover:text-foreground px-4 py-2"
                  >
                    Back
                  </button>
                  <Button onClick={() => setStep(3)} className="px-8 py-3 text-lg">
                    Looks Good!
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Save & Signup */}
            {step === 3 && blocks && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6 w-full"
              >
                <div className="bg-pink-50 p-8 rounded-3xl border-2 border-pink-200 text-center flex flex-col gap-6 shadow-[0_8px_0_0_rgba(251,207,232,1)] mt-8">
                  <h1 className="text-4xl font-black text-pink-900">You're all set!</h1>
                  <p className="text-pink-700 font-bold text-lg">
                    Create a free account to save this {blocks.length}-step routine, customize it further, and use it every day to master your time.
                  </p>
                  
                  <div className="flex flex-col gap-4 mt-4">
                    <Button onClick={handleSignup} variant="primary" className="py-5 text-xl bg-pink-400 hover:bg-pink-500 shadow-[0_4px_0_0_#f472b6]">
                      Save & Sign Up
                    </Button>
                    <button 
                      onClick={() => setStep(2)}
                      className="text-pink-600 font-bold hover:underline"
                    >
                      Wait, I need to make one more edit
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
/* eslint-disable react/no-unescaped-entities, @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
