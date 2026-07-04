import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RoutineBlock } from "@/components/routine/RoutineViewer";
import Link from "next/link";
import { Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RoutineDashboard } from "@/components/routine/RoutineDashboard";

export default async function RoutinePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const todayDateObj = new Date();
  const year = todayDateObj.getFullYear();
  const month = String(todayDateObj.getMonth() + 1).padStart(2, '0');
  const day = String(todayDateObj.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  
  const startOfDay = new Date(`${todayStr}T00:00:00.000Z`).toISOString();
  const endOfDay = new Date(new Date(startOfDay).getTime() + 24 * 60 * 60 * 1000).toISOString();

  const { data: timelineBlocks } = await supabase
    .from("timeline_blocks")
    .select("*")
    .eq("user_id", user.id)
    .gte("start_time", startOfDay)
    .lt("start_time", endOfDay)
    .order("start_time", { ascending: true });

  const { data: tasksData1 } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("target_date", todayStr);

  const { data: tasksData2 } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .gte("completed_at", startOfDay)
    .lt("completed_at", endOfDay);

  const tasksMap = new Map();
  [...(tasksData1 || []), ...(tasksData2 || [])].forEach(t => tasksMap.set(t.id, t));
  const tasks = Array.from(tasksMap.values()).sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  let blocks: RoutineBlock[] = [];
  if (timelineBlocks) {
    blocks = timelineBlocks.map(block => ({
      id: block.id,
      start_time: block.start_time,
      end_time: block.end_time,
      label: block.label,
      source: block.source,
      color_override: block.color || undefined,
      type: block.type as 'plan' | 'actual',
    }));
  }

  const hasPlan = blocks.length > 0;

  return (
    <div className="flex flex-col flex-1 items-center bg-background p-6 pt-28 md:p-12 md:pt-32">
      
      {/* Top CTA Island */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white border-4 border-gray-200 rounded-[2rem] p-4 z-50 flex justify-center items-center shadow-[0_8px_0_0_#e5e7eb]">
        {hasPlan ? (
          <Link href={`/catchup?date=${todayStr}`} className="w-full">
            <Button type="button" variant="primary" className="flex items-center justify-center gap-2 w-full text-lg">
              <Play size={20} fill="currentColor" /> Log Reality
            </Button>
          </Link>
        ) : (
          <Link href="/generate" className="w-full">
            <Button type="button" variant="primary" className="flex items-center justify-center gap-2 w-full text-lg">
              <Sparkles size={20} /> Plan Today
            </Button>
          </Link>
        )}
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-8">
        <RoutineDashboard blocks={blocks} tasks={tasks} todayStr={todayStr} />
      </div>
    </div>
  );
}
