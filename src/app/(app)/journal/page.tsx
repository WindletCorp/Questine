import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DateSelector } from "@/components/ui/DateSelector";
import { JournalLogBubble } from "@/components/ui/JournalLogBubble";
import { MetricCard } from "@/components/ui/MetricCard";
import { CreateMetricInline } from "@/components/ui/CreateMetricInline";
import { RoutineViewerWithToggle } from "@/components/routine/RoutineViewerWithToggle";
import { RoutineBlock } from "@/components/routine/RoutineViewer";
import { TaskCard } from "@/components/ui/TaskCard";
import Link from "next/link";
import { Plus } from "lucide-react";


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

        <DateSelector selectedDate={selectedDate} />

        <div className="flex flex-col gap-4 mt-4">
          <h2 className="text-2xl font-black text-gray-800">Routine History</h2>
          {blocks.length > 0 ? (
            <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100 opacity-80 scale-[0.98]">
              <RoutineViewerWithToggle
                blocks={blocks}
                viewDateStr={selectedDate}
                defaultMode={blocks.some(b => b.type === 'actual') ? (blocks.some(b => b.type === 'plan') ? 'overlay' : 'actual') : 'plan'}
                initialScrollTime="08:00"
              />
            </div>
          ) : (
            <div className="bg-gray-50 p-8 rounded-3xl border-2 border-gray-200 text-center font-bold text-gray-500 shadow-inner">
              No routine logged on this date.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 mt-8">
          <h2 className="text-2xl font-black text-gray-800">Metrics</h2>
          <div className="flex flex-wrap gap-4">
            {metricLogs?.map((m: any, i: number) => {
              const themes = ["indigo", "pink", "blue", "emerald", "orange"] as const;
              return (
                <MetricCard
                  key={m.id}
                  id={m.id}
                  name={m.metric_definitions?.name || "Unknown"}
                  value={m.value}
                  unit={m.metric_definitions?.unit}
                  colorTheme={themes[i % themes.length]}
                />
              );
            })}
            <CreateMetricInline dateStr={selectedDate} />
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-8">
          <h2 className="text-2xl font-black text-gray-800">Tasks</h2>
          <div className="flex flex-col gap-3">
            {tasks?.length ? tasks.map((t: any) => (
              <TaskCard
                key={t.id}
                id={t.id}
                title={t.title}
                status={t.status}
                targetDate={t.target_date}
                linkedBlockId={t.linked_block_id}
                availableBlocks={blocks}
              />
            )) : (
              <div className="text-gray-400 font-bold italic py-4">No tasks logged.</div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-8">
          <h2 className="text-2xl font-black text-gray-800">Journal Logs</h2>
          <div className="flex flex-col gap-6">
            {journalLogs?.length ? journalLogs.map((log: any) => (
              <JournalLogBubble key={log.id} id={log.id} content={log.content} timestamp={log.logged_at} />
            )) : (
              <div className="text-gray-400 font-bold italic py-4">No journal entries.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
