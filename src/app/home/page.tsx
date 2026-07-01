import { createClient } from "@/lib/supabase/server";
import { seedDummyData } from "@/actions/debug";
import { Button } from "@/components/ui/Button";
import { redirect } from "next/navigation";
import { RoutineViewer, RoutineBlock } from "@/components/routine/RoutineViewer";
import { DateSelector } from "@/components/ui/DateSelector";
import { SeedButton } from "@/components/ui/SeedButton";

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

  // Fetch selected day's snapshot and blocks
  const { data: snapshot } = await supabase
    .from("day_snapshots")
    .select("plan_routine_id")
    .eq("user_id", user.id)
    .eq("date", selectedDate)
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
            <h2 className="text-2xl font-black text-foreground">
              {selectedDate === todayStr ? "Today's Routine" : "Routine Plan"}
            </h2>
            <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100">
              <RoutineViewer blocks={blocks} readOnly={true} />
            </div>
          </div>
        ) : isPast ? (
          <div className="bg-gray-50 p-8 rounded-3xl border-2 border-gray-200 text-center flex flex-col gap-4 shadow-[0_4px_0_0_rgba(229,231,235,1)]">
            <div className="text-5xl mb-2">🍃</div>
            <h2 className="text-2xl font-black text-gray-800">No routine logged.</h2>
            <p className="text-gray-500 font-bold">Looks like you took it easy on this day.</p>
          </div>
        ) : (
          <div className="bg-blue-50 p-8 rounded-3xl border-2 border-blue-200 text-center flex flex-col gap-6 shadow-[0_4px_0_0_rgba(191,219,254,1)]">
            <div>
              <h2 className="text-2xl font-black text-blue-900 mb-2">Let's build your routine!</h2>
              <p className="text-blue-700 font-bold">Head over to settings to provide your context and AI API key.</p>
            </div>
            <a href="/settings" className="mx-auto">
              <Button type="button" variant="primary">
                Go to Settings
              </Button>
            </a>
          </div>
        )}
        
        <div className="flex justify-center mt-4">
          <SeedButton />
        </div>
      </div>
    </div>
  );
}
