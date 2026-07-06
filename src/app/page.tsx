import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/home");
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background p-6">
      <div className="w-full max-w-md flex flex-col gap-8 items-center text-center">
        <div>
          <h1 className="text-5xl font-black text-foreground mb-4 leading-tight">
            Build your perfect routine.
          </h1>
          <p className="text-xl text-zinc-500 font-bold mb-8">
            Tell us about your day, and our AI will plan it out. Let's get started.
          </p>
        </div>
        
        <Link href="/onboarding" className="w-full">
          <Button type="button" fullWidth className="text-xl py-6">
            Get Started
          </Button>
        </Link>
      </div>
    </div>
  );
}
