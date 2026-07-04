import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RoutineBlock } from "@/components/routine/RoutineViewer";
import Link from "next/link";
import { Plus } from "lucide-react";
import { JournalDashboard } from "@/components/journal/JournalDashboard";

type Props = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function JournalPage(props: Props) {
  const searchParams = await props.searchParams;
  const dateParam = typeof searchParams?.date === 'string' ? searchParams.date : undefined;

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

  const selectedDate = dateParam || todayStr;

  const startOfDay = new Date(`${selectedDate}T00:00:00.000Z`).toISOString();
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
    .eq("target_date", selectedDate);

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

  const { data: metricLogs } = await supabase
    .from("metric_logs")
    .select("*, metric_definitions(name, unit)")
    .eq("user_id", user.id)
    .gte("recorded_at", startOfDay)
    .lt("recorded_at", endOfDay)
    .order("recorded_at", { ascending: true });

  const { data: journalLogs } = await supabase
    .from("journal_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("logged_at", startOfDay)
    .lt("logged_at", endOfDay)
    .order("logged_at", { ascending: true });

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

  return (
    <div className="flex flex-col flex-1 items-center bg-background p-6 pt-28 md:p-12 md:pt-32">

      {/* Top CTA Island */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white border-4 border-gray-200 rounded-[2rem] p-4 z-50 flex justify-center items-center shadow-[0_8px_0_0_#e5e7eb]">
        <Link
          href="/journal/new"
          className="flex items-center justify-center gap-2 px-6 py-2 rounded-xl bg-amber-400 text-amber-950 font-black shadow-[0_4px_0_0_#d97706] hover:bg-amber-300 hover:translate-y-[-2px] hover:shadow-[0_6px_0_0_#d97706] active:translate-y-[4px] active:shadow-none transition-all w-full"
        >
          <Plus strokeWidth={3} size={18} /> New Entry
        </Link>
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-8">
        <JournalDashboard 
          selectedDate={selectedDate}
          blocks={blocks}
          tasks={tasks}
          journalLogs={journalLogs || []}
          metricLogs={metricLogs || []}
        />
      </div>
    </div>
  );
}
