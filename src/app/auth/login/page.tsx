"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { handleClientError, createError } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string, password?: string}>({});
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    let newErrors: {email?: string, password?: string} = {};
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#7EC8E3', '#F4A8C0', '#1CB854']
    });

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      handleClientError(
        createError("AUTH", error.message, "Try Again", () => setLoading(false))
      );
      setLoading(false);
      return;
    }

    // Success: process trial data if it exists
    try {
      const trialDataStr = sessionStorage.getItem("trial_data");
      if (trialDataStr) {
        const { globalContext, blocks } = JSON.parse(trialDataStr);
        const { claimTrialData } = await import("@/app/actions/claimTrialData");
        const result = await claimTrialData(globalContext, blocks);
        if (result?.error) {
          console.error("Failed to claim trial data:", result.error);
          import("sonner").then(m => m.toast.error(result.error));
        } else if (result?.alreadyClaimed) {
          import("sonner").then(m => m.toast.success("Welcome back! We've loaded your saved routine. (Trial generations can only be claimed once per account)."));
          sessionStorage.removeItem("trial_data");
        } else {
          sessionStorage.removeItem("trial_data");
        }
      }
    } catch (err) {
      console.error("Failed to parse or claim trial data", err);
    }

    // Success, redirect to home.
    window.location.href = "/home";
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      <FloatingBackground />
      <div className="w-full max-w-sm flex flex-col items-center gap-10 z-10 relative">
        <div className="text-center w-full">
          <h1 className="text-4xl font-black text-foreground mb-3 tracking-tight">
            Welcome Back!
          </h1>
          <p className="text-zinc-500 font-bold text-lg">
            Ready to crush your routine?
          </p>
        </div>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-5" noValidate>
          <Input 
            label="Email" 
            type="email" 
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({...prev, email: undefined})); }}
            placeholder="you@example.com"
            required
            disabled={loading}
            error={errors.email}
          />
          <Input 
            label="Password" 
            type="password" 
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({...prev, password: undefined})); }}
            placeholder="••••••••"
            required
            disabled={loading}
            error={errors.password}
          />
          
          <div className="mt-4">
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </Button>
          </div>
        </form>

        <p className="text-zinc-500 font-bold">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="text-accent hover:text-accent-shadow transition-colors">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
