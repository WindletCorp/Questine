import { createClient } from "@/lib/supabase/server";
import { seedDummyData } from "@/actions/debug";
import { Button } from "@/components/ui/Button";
import { redirect } from "next/navigation";
import { RoutineViewer, RoutineBlock } from "@/components/routine/RoutineViewer";
import { RoutineViewerWithToggle } from "@/components/routine/RoutineViewerWithToggle";
import { DateSelector } from "@/components/ui/DateSelector";
import { TodayEmptyState } from "@/components/routine/TodayEmptyState";
import { SeedButton } from "@/components/ui/SeedButton";
import { TaskCard } from "@/components/ui/TaskCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { CreateMetricInline } from "@/components/ui/CreateMetricInline";
import { CreateTaskInline } from "@/components/ui/CreateTaskInline";
import { JournalLogBubble } from "@/components/ui/JournalLogBubble";
import Link from "next/link";
import { Play, Plus } from "lucide-react";

type Props = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home(props: Props) {
  const searchParams = await props.searchParams;
  const dateParam = typeof searchParams?.date === 'string' ? searchParams.date : undefined;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Determine selected date, default to today
  const todayDateObj = new Date();
  const year = todayDateObj.getFullYear();
  const month = String(todayDateObj.getMonth() + 1).padStart(2, '0');
  const day = String(todayDateObj.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  
  const selectedDate = dateParam || todayStr;
  const isPast = selectedDate < todayStr;
  
  // Calculate yesterday for Catch-Up restriction
  const yesterdayDateObj = new Date(todayDateObj);
  yesterdayDateObj.setDate(yesterdayDateObj.getDate() - 1);
  const yYear = yesterdayDateObj.getFullYear();
  const yMonth = String(yesterdayDateObj.getMonth() + 1).padStart(2, '0');
  const yDay = String(yesterdayDateObj.getDate()).padStart(2, '0');
  const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;
  
  const canCatchUp = selectedDate === todayStr || selectedDate === yesterdayStr;

  // Determine the start and end of the selected day (assuming UTC for now)
  const startOfDay = new Date(`${selectedDate}T00:00:00.000Z`).toISOString();
  const endOfDay = new Date(new Date(startOfDay).getTime() + 24 * 60 * 60 * 1000).toISOString();

  // Fetch timeline blocks for the selected day (both plan and actual)
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

  const handleLogout = async () => {
    "use server";
    const supabaseServer = await createClient();
    await supabaseServer.auth.signOut();
    redirect("/");
  };

  return (
    <div className="flex flex-col flex-1 items-center bg-background p-6 md:p-12">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        
        <div className="flex justify-between items-center w-full">
          <div>
            <h1 className="text-3xl font-black text-foreground mb-1">Questine</h1>
            <p className="text-zinc-500 font-bold text-sm">Hello, {user.email?.split('@')[0]}</p>
          </div>
          <form action={handleLogout}>
            <Button type="submit" variant="danger" className="py-2 px-4 text-sm">
              Log Out
            </Button>
          </form>
        </div>

        <DateSelector selectedDate={selectedDate} />

        {blocks.length > 0 ? (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-foreground">
                {selectedDate === todayStr ? "Today's Routine" : "Routine"}
              </h2>
              {canCatchUp && (
                <Link href={`/catchup?date=${selectedDate}`}>
                  <Button type="button" variant="primary" className="py-2 px-4 shadow-[0_4px_0_0_rgba(251,207,232,1)] flex items-center gap-2">
                    <Play size={16} fill="currentColor" /> Log Reality
                  </Button>
                </Link>
              )}
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100">
              <RoutineViewerWithToggle 
                blocks={blocks} 
                viewDateStr={selectedDate}
                defaultMode={blocks.some(b => b.type === 'actual') ? (blocks.some(b => b.type === 'plan') ? 'overlay' : 'actual') : 'plan'}
                initialScrollTime={selectedDate === todayStr ? "current" : blocks.length > 0 ? new Date(blocks[0].start_time).toISOString().substring(11, 16) : "08:00"}
              />
            </div>
          </div>
        ) : isPast ? (
          <div className="bg-gray-50 p-8 rounded-3xl border-2 border-gray-200 text-center flex flex-col gap-4 shadow-[0_4px_0_0_rgba(229,231,235,1)]">
            <div className="text-5xl mb-2">🍃</div>
            <h2 className="text-2xl font-black text-gray-800">No routine logged.</h2>
            <p className="text-gray-500 font-bold">Looks like you took it easy on this day.</p>
          </div>
        ) : selectedDate > todayStr ? (
          <div className="bg-gray-50 p-8 rounded-3xl border-2 border-gray-200 text-center flex flex-col gap-4 shadow-[0_4px_0_0_rgba(229,231,235,1)]">
            <div className="text-5xl mb-2">🌅</div>
            <h2 className="text-2xl font-black text-gray-800">No routine planned yet.</h2>
            <p className="text-gray-500 font-bold">Wait for the day to arrive to plan your schedule!</p>
          </div>
        ) : (
          <TodayEmptyState />
        )}
        
        <div className="flex justify-center mt-4">
          <SeedButton />
        </div>
      </div>

      {/* Daily Summary Section */}
      <div className="w-full max-w-2xl mt-12 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-24">
        <div className="flex items-center gap-4">
          <div className="h-1 flex-1 bg-gray-200 rounded-full" />
          <h2 className="text-xl font-black text-gray-400 uppercase tracking-widest">Daily Summary</h2>
          <div className="h-1 flex-1 bg-gray-200 rounded-full" />
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-gray-800">Metrics</h3>
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

        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-gray-800">Tasks</h3>
          <div className="flex flex-col gap-3">
            {tasks?.map((t: any) => (
              <TaskCard 
                key={t.id} 
                id={t.id} 
                title={t.title} 
                status={t.status} 
                targetDate={t.target_date} 
                linkedBlockId={t.linked_block_id}
                availableBlocks={blocks}
              />
            ))}
            <CreateTaskInline dateStr={selectedDate} availableBlocks={blocks} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-gray-800">Journal Logs</h3>
          <div className="flex flex-col gap-6">
            {journalLogs?.map((log: any) => (
              <JournalLogBubble key={log.id} id={log.id} content={log.content} timestamp={log.logged_at} />
            ))}
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
