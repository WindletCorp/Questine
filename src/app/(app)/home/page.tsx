import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MetricCard } from "@/components/ui/MetricCard";
import { CreateMetricInline } from "@/components/ui/CreateMetricInline";
import { HomeAIAssistant } from "@/components/ui/HomeAIAssistant";

export default async function HomePage() {
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

  // Fetch today's timeline blocks to find current active block
  const { data: timelineBlocks } = await supabase
    .from("timeline_blocks")
    .select("*")
    .eq("user_id", user.id)
    .gte("start_time", startOfDay)
    .lt("start_time", endOfDay)
    .order("start_time", { ascending: true });

  const { data: metricLogs } = await supabase
    .from("metric_logs")
    .select("*, metric_definitions(name, unit)")
    .eq("user_id", user.id)
    .gte("recorded_at", startOfDay)
    .lt("recorded_at", endOfDay)
    .order("recorded_at", { ascending: true });

  const nowTime = todayDateObj.toISOString();
  
  // Find current block (prioritize actual, then plan)
  let currentBlock = null;
  if (timelineBlocks && timelineBlocks.length > 0) {
    const activeBlocks = timelineBlocks.filter(b => b.start_time <= nowTime && b.end_time >= nowTime);
    const actual = activeBlocks.find(b => b.type === 'actual');
    const plan = activeBlocks.find(b => b.type === 'plan');
    currentBlock = actual || plan || null;
  }

  const hour = todayDateObj.getHours();
  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

  return (
    <div className="flex flex-col flex-1 items-center bg-background p-6 pt-28 md:p-12 md:pt-32">
      
      {/* Top CTA Island */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white border-4 border-gray-200 rounded-[2rem] p-4 z-50 flex justify-center items-center shadow-[0_8px_0_0_#e5e7eb]">
        <span className="font-black text-gray-800 text-lg">{greeting}!</span>
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-8">

        {/* Current Block Widget */}
        <div className="flex flex-col gap-4 mt-4">
          <h2 className="text-xl font-black text-gray-800">Right Now</h2>
          {currentBlock ? (
            <div className="bg-blue-500 p-8 rounded-3xl text-white shadow-[0_6px_0_0_#1d4ed8]">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-blue-400 text-blue-900 text-xs font-black uppercase px-2 py-1 rounded-lg">
                  {currentBlock.type === 'actual' ? 'Actual' : 'Planned'}
                </span>
                <span className="font-bold opacity-80">
                  {new Date(currentBlock.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                  {new Date(currentBlock.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <h3 className="text-3xl font-black truncate">{currentBlock.label}</h3>
            </div>
          ) : (
            <div className="bg-gray-100 p-8 rounded-3xl text-gray-500 text-center font-bold border-4 border-dashed border-gray-200">
              No active routine block at the moment.
            </div>
          )}
        </div>

        {/* Daily Summary Section */}
        <div className="w-full mt-8 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center gap-4">
            <div className="h-1 flex-1 bg-gray-200 rounded-full" />
            <h2 className="text-xl font-black text-gray-400 uppercase tracking-widest">Today's Metrics</h2>
            <div className="h-1 flex-1 bg-gray-200 rounded-full" />
          </div>

          <div className="flex flex-col gap-4">
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
              <CreateMetricInline dateStr={todayStr} />
            </div>
          </div>
        </div>

        {/* AI Assistant */}
        <div className="mt-2 mb-24">
          <HomeAIAssistant />
        </div>
      </div>
    </div>
  );
}
