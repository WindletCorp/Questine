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
import { Check, Sparkles, FastForward } from "lucide-react";
import { TypingIndicator } from "@/components/ui/TypingIndicator";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  
  const [wakeSleepTime, setWakeSleepTime] = useState("");
  const [mustDoTasks, setMustDoTasks] = useState("");
  const [mainGoals, setMainGoals] = useState("");

  const [loading, setLoading] = useState(false);
  const [blocks, setBlocks] = useState<RoutineBlock[] | null>(null);
  const router = useRouter();

  const handleNextStep = (currentStep: number, value: string) => {
    if (currentStep === 1) {
      if (!value.trim()) setWakeSleepTime("Normal hours (9am - 10pm)");
      setStep(2);
    } else if (currentStep === 2) {
      if (!value.trim()) setMustDoTasks("Nothing specific");
      setStep(3);
    } else if (currentStep === 3) {
      if (!value.trim()) setMainGoals("Just a balanced day");
      handleGenerate(wakeSleepTime, mustDoTasks, value);
    }
  };

  const handleGenerate = async (finalWake: string, finalMustDo: string, finalGoals: string) => {
    setLoading(true);

    const compiledContext = `
Wake & Sleep Times: ${finalWake || wakeSleepTime || "Normal hours"}
Must-Do Tasks: ${finalMustDo || mustDoTasks || "Nothing specific"}
Main Goals / Vibe: ${finalGoals || mainGoals || "Just a balanced day"}
    `.trim();

    try {
      const generatedBlocks = await generateTrial(compiledContext);
      
      const blocksWithIds = generatedBlocks.map((b, idx) => ({
        ...b,
        id: `trial-block-${idx}`
      }));
      
      setBlocks(blocksWithIds);
      setStep(4);
    } catch (err: any) {
      const isLoggedInError = err.message.toLowerCase().includes("logged in");
      toast.error(err.message || "Failed to generate routine.", {
        action: {
          label: isLoggedInError ? "Go to Dashboard" : "Sign Up Now",
          onClick: () => router.push(isLoggedInError ? "/home" : "/auth/signup")
        }
      });
      setStep(3); // Go back on error
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    if (blocks && blocks.length > 0) {
      const compiledContext = `Wake/Sleep: ${wakeSleepTime}\nMust-Do: ${mustDoTasks}\nGoals: ${mainGoals}`;
      sessionStorage.setItem("trial_data", JSON.stringify({
        globalContext: compiledContext,
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
        {step !== 5 && (
          <div className="flex items-center justify-center gap-2 mb-4 shrink-0">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    // Only allow going back, not forward (unless review step)
                    if (s < step || (blocks && s === 4)) setStep(s);
                  }}
                  disabled={!blocks && s > 3}
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
                {s !== 4 && <div className={`w-8 h-2 rounded-full transition-colors duration-300 ${step > s ? "bg-green-400" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 w-full relative">
          {loading && (
             <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-32 absolute inset-0 z-50">
               <div className="mb-6 transform scale-150">
                 <TypingIndicator />
               </div>
               <h2 className="text-3xl font-black text-gray-800 mb-2 text-center">Crafting your perfect routine...</h2>
             </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1: Wake / Sleep */}
            {step === 1 && !loading && (
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
                    First, when do you usually wake up and go to sleep?
                  </p>
                </div>

                <div className="flex flex-col gap-6 bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100">
                  <MumbleBar 
                    value={wakeSleepTime}
                    onChange={setWakeSleepTime}
                    placeholder="e.g. Wake up at 7am, sleep at 11pm..."
                    onSubmit={() => handleNextStep(1, wakeSleepTime)}
                  />
                  <div className="flex justify-between items-center gap-4">
                     <button onClick={() => handleNextStep(1, "")} className="text-gray-400 font-bold hover:text-gray-600 transition-colors">
                       Skip
                     </button>
                     <Button onClick={() => handleNextStep(1, wakeSleepTime)}>
                       Next Step <FastForward size={20} className="ml-2"/>
                     </Button>
                  </div>
                  
                  <div className="text-center mt-2 border-t-2 border-gray-100 pt-4">
                    <span className="text-zinc-500 font-medium">Already have an account? </span>
                    <button onClick={() => router.push('/auth/login')} className="text-blue-500 font-bold hover:underline">
                      Log In
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Must-Do Tasks */}
            {step === 2 && !loading && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col gap-6"
              >
                <div className="bg-purple-50 border-4 border-purple-200 rounded-3xl p-6 shadow-sm flex items-start gap-4">
                  <div className="bg-white p-3 rounded-2xl shadow-sm text-purple-500">
                    <Sparkles size={24} />
                  </div>
                  <div className="flex-1 pt-2 min-h-[40px] flex items-center">
                    <p className="text-lg font-bold text-purple-900 leading-tight">
                      What are your absolute must-do tasks every day?
                    </p>
                  </div>
                </div>
                <MumbleBar 
                  value={mustDoTasks} 
                  onChange={setMustDoTasks} 
                  onSubmit={() => handleNextStep(2, mustDoTasks)}
                  placeholder="e.g. Work 9-5, hit the gym, read for 30 mins..."
                />
                <div className="flex justify-between items-center gap-4">
                   <button onClick={() => handleNextStep(2, "")} className="text-gray-400 font-bold hover:text-gray-600 transition-colors">
                     Skip
                   </button>
                   <Button onClick={() => handleNextStep(2, mustDoTasks)}>
                     Next Step <FastForward size={20} className="ml-2"/>
                   </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Goals & Vibe */}
            {step === 3 && !loading && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col gap-6"
              >
                <div className="bg-orange-50 border-4 border-orange-200 rounded-3xl p-6 shadow-sm flex items-start gap-4">
                  <div className="bg-white p-3 rounded-2xl shadow-sm text-orange-500">
                    <Sparkles size={24} />
                  </div>
                  <div className="flex-1 pt-2 min-h-[40px] flex items-center">
                    <p className="text-lg font-bold text-orange-900 leading-tight">
                      Lastly, what are your main goals or the overall vibe?
                    </p>
                  </div>
                </div>
                <MumbleBar 
                  value={mainGoals} 
                  onChange={setMainGoals} 
                  onSubmit={() => handleNextStep(3, mainGoals)}
                  placeholder="e.g. Be more productive, relax more, build a habit..."
                />
                <div className="flex justify-between items-center gap-4">
                   <button onClick={() => handleNextStep(3, "")} className="text-gray-400 font-bold hover:text-gray-600 transition-colors">
                     Skip
                   </button>
                   <Button onClick={() => handleNextStep(3, mainGoals)}>
                     Generate Routine ✨
                   </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Review Calendar */}
            {step === 4 && blocks && !loading && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
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
                    viewDateStr={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
                    readOnly={false} 
                    onBlockUpdate={handleBlockUpdate}
                    onBlockDelete={handleBlockDelete}
                    onBlockAdd={handleBlockAdd}
                    initialScrollTime="current"
                  />
                </div>
                
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border-2 border-gray-100">
                  <button 
                    onClick={() => setStep(3)}
                    className="text-zinc-500 font-bold hover:text-foreground px-4 py-2"
                  >
                    Back
                  </button>
                  <Button onClick={() => setStep(5)} className="px-8 py-3 text-lg">
                    Looks Good!
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Save & Signup */}
            {step === 5 && blocks && !loading && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
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
                      onClick={() => setStep(4)}
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
