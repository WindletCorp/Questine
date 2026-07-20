"use client";

import { redirect } from "next/navigation";
import { RoutineBlock } from "@/components/routine/RoutineViewer";
import Link from "next/link";
import { Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RoutineDashboard } from "@/components/routine/RoutineDashboard";
import { useTodayTimelineBlocks, useTodayTasks } from "@/hooks/useSupabaseQueries";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RoutinePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  // Check auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        redirect("/auth/login");
      }
      setLoading(false);
    });
  }, [supabase]);

  const todayDateObj = new Date();
  const year = todayDateObj.getFullYear();
  const month = String(todayDateObj.getMonth() + 1).padStart(2, '0');
  const day = String(todayDateObj.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const { data: timelineBlocks, isLoading: blocksLoading } = useTodayTimelineBlocks(todayStr);
  const { data: tasksData, isLoading: tasksLoading } = useTodayTasks(todayStr);

  if (loading || blocksLoading || tasksLoading) {
    return (
      <div className="flex flex-col flex-1 items-center bg-background p-6 pt-28 md:p-12 md:pt-32">
        <div className="w-full max-w-2xl flex flex-col gap-8 animate-pulse">
          <div className="h-16 bg-gray-200 rounded-3xl w-full"></div>
          <div className="h-64 bg-gray-200 rounded-3xl w-full"></div>
          <div className="h-32 bg-gray-200 rounded-3xl w-full mt-4"></div>
        </div>
      </div>
    );
  }

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

  const tasksMap = new Map();
  (tasksData || []).forEach(t => tasksMap.set(t.id, t));
  const tasks = Array.from(tasksMap.values()).sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

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
