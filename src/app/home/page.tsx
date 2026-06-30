import { createClient } from "@/lib/supabase/server";
import { seedDummyData } from "@/actions/debug";
import { Button } from "@/components/ui/Button";
import { redirect } from "next/navigation";
import { RoutineViewer, RoutineBlock } from "@/components/routine/RoutineViewer";

import { SeedButton } from "@/components/ui/SeedButton";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch today's snapshot and blocks
  const today = new Date().toISOString().split('T')[0];
  const { data: snapshot } = await supabase
    .from("day_snapshots")
    .select("plan_routine_id")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  let blocks: RoutineBlock[] = [];
  if (snapshot?.plan_routine_id) {
    const { data: routineBlocks } = await supabase
      .from("routine_blocks")
      .select("*")
      .eq("routine_id", snapshot.plan_routine_id)
      .order("order_index", { ascending: true });
    
    if (routineBlocks) {
      blocks = routineBlocks as RoutineBlock[];
    }
  }

  const handleLogout = async () => {
    "use server";
    const supabaseServer = await createClient();
    await supabaseServer.auth.signOut();
    redirect("/");
  };

  return (
    <div className="flex flex-col flex-1 items-center bg-background p-6 md:p-12">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-foreground mb-2">Welcome to Questine!</h1>
          <p className="text-zinc-500 font-bold">Logged in as: {user.email}</p>
        </div>

        {blocks.length > 0 ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-black text-foreground">Today's Routine</h2>
            <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100">
              <RoutineViewer blocks={blocks} readOnly={true} />
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 p-8 rounded-3xl border-2 border-blue-200 text-center flex flex-col gap-6 shadow-[0_4px_0_0_rgba(191,219,254,1)]">
            <div>
              <h2 className="text-2xl font-black text-blue-900 mb-2">Let's build your first routine!</h2>
              <p className="text-blue-700 font-bold">Head over to settings to provide your context and AI API key.</p>
            </div>
            <a href="/settings" className="mx-auto">
              <Button type="button" variant="primary">
                Go to Settings
              </Button>
            </a>
          </div>
        )}
        
        <div className="flex flex-col gap-4 w-full max-w-xs mx-auto mt-8">
          <SeedButton />

          <form action={handleLogout} className="w-full">
            <Button type="submit" variant="danger" fullWidth>
              Log Out
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
