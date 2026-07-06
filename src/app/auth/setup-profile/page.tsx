"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import { checkUsername } from "@/app/actions/checkUsername";
import { saveProfileSetup } from "@/app/actions/saveProfileSetup";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";


export default function SetupProfilePage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();
  
  // Inline debounce for simplicity since we might not have the hook
  useEffect(() => {
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
    
    if (!cleanUsername || cleanUsername.length < 3) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      const isAvailable = await checkUsername(cleanUsername);
      setUsernameAvailable(isAvailable);
      setCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameAvailable || !displayName || username.length < 3) return;
    
    setLoading(true);
    const result = await saveProfileSetup(username, displayName);
    
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success("Profile setup complete!");
      // We can force a hard refresh to /home so the app layout loads with the new profile data
      window.location.href = "/home";
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      <FloatingBackground />
      <div className="w-full max-w-sm flex flex-col items-center gap-8 z-10 relative bg-white p-8 rounded-[2rem] shadow-sm border-4 border-gray-100">
        <div className="text-center w-full">
          <h1 className="text-3xl font-black text-gray-800 mb-2 tracking-tight">
            Claim Your Identity
          </h1>
          <p className="text-gray-500 font-bold text-sm">
            Choose how you'll appear to others on Questine.
          </p>
        </div>

        <form onSubmit={handleSave} className="w-full flex flex-col gap-6" noValidate>
          <div className="flex flex-col gap-1">
            <Input 
              label="Display Name" 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Duolingo Owl"
              required
              disabled={loading}
            />
          </div>
          
          <div className="flex flex-col gap-1 relative">
            <Input 
              label="Username" 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. duo_owl"
              required
              disabled={loading}
              error={username.length > 0 && username.length < 3 ? "Must be at least 3 characters" : undefined}
            />
            {/* Uniqueness Indicator */}
            <div className="absolute right-4 top-[38px] flex items-center">
              {checkingUsername ? (
                <Loader2 className="animate-spin text-gray-400" size={20} />
              ) : usernameAvailable === true ? (
                <CheckCircle2 className="text-green-500" size={20} />
              ) : usernameAvailable === false ? (
                <XCircle className="text-red-500" size={20} />
              ) : null}
            </div>
            {usernameAvailable === false && !checkingUsername && (
              <span className="text-xs font-bold text-red-500 mt-1 pl-4">Username is already taken</span>
            )}
            {usernameAvailable === true && !checkingUsername && (
              <span className="text-xs font-bold text-green-500 mt-1 pl-4">Username is available!</span>
            )}
          </div>
          
          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            disabled={loading || !usernameAvailable || !displayName || username.length < 3}
            className="mt-2"
          >
            {loading ? "SAVING..." : "COMPLETE PROFILE"}
          </Button>
        </form>
      </div>
    </div>
  );
}
