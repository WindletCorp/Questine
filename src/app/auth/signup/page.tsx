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

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string, password?: string, username?: string}>({});
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    let newErrors: {email?: string, password?: string, username?: string} = {};
    if (!username) newErrors.username = "Display name is required";
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    
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

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        }
      }
    });

    if (error) {
      handleClientError(
        createError("AUTH", error.message, "Try Again", () => setLoading(false))
      );
      setLoading(false);
      return;
    }

    // Success, trigger middleware refresh and redirect
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      <FloatingBackground />
      <div className="w-full max-w-sm flex flex-col items-center gap-10 z-10 relative">
        <div className="text-center w-full">
          <h1 className="text-4xl font-black text-foreground mb-3 tracking-tight">
            Create Profile
          </h1>
          <p className="text-zinc-500 font-bold text-lg">
            Start mastering your time today.
          </p>
        </div>

        <form onSubmit={handleSignup} className="w-full flex flex-col gap-5" noValidate>
          <Input 
            label="Display Name" 
            type="text" 
            value={username}
            onChange={(e) => { setUsername(e.target.value); setErrors(prev => ({...prev, username: undefined})); }}
            placeholder="Duolingo Owl"
            required
            disabled={loading}
            error={errors.username}
          />
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
          <div className="flex flex-col gap-1 w-full">
            <Input 
              label="Password" 
              type="password" 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({...prev, password: undefined})); }}
              placeholder="••••••••"
              required
              disabled={loading}
              error={errors.password || (password.length > 0 && password.length < 6 ? "Password must be at least 6 characters" : undefined)}
            />
          </div>
          
          <Button type="submit" variant="primary" fullWidth disabled={loading || (password.length > 0 && password.length < 6)}>
            {loading ? "SIGNING UP..." : "SIGN UP"}
          </Button>
        </form>

        <p className="text-zinc-500 font-bold">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-accent hover:text-accent-shadow transition-colors">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
