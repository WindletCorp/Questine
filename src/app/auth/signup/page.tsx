"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { handleClientError, createError } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
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
        <div className="text-center">
          <h1 className="text-4xl font-black text-foreground mb-3 tracking-tight">
            Create Profile
          </h1>
          <p className="text-zinc-500 font-bold text-lg">
            Start mastering your time today.
          </p>
        </div>

        <form onSubmit={handleSignup} className="w-full flex flex-col gap-5">
          <Input 
            label="Display Name" 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Duolingo Owl"
            required
            disabled={loading}
          />
          <Input 
            label="Email" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
          />
          <Input 
            label="Password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
          />
          
          <div className="mt-4">
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Creating..." : "Sign Up"}
            </Button>
          </div>
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
