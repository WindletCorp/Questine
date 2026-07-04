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

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("target_date", selectedDate)
    .order("created_at", { ascending: true });

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
    <div className="flex flex-col flex-1 items-center bg-background p-6 md:p-12">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        
        <div className="text-center w-full mb-2">
          <h1 className="text-3xl font-black text-foreground tracking-tight">Journal & History</h1>
          <p className="text-zinc-500 font-bold text-sm">Review your past days and log your thoughts.</p>
        </div>

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
            <Link 
              href="/journal/new"
              className="flex items-center justify-center gap-2 w-full p-4 rounded-3xl border-4 border-dashed border-amber-300 bg-amber-50 text-amber-600 font-black hover:bg-amber-100 transition-colors"
            >
              <Plus strokeWidth={3} /> New Journal Entry
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
}
