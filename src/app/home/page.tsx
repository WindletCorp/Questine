import { createClient } from "@/lib/supabase/server";
import { seedDummyData } from "@/actions/debug";
import { Button } from "@/components/ui/Button";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const handleLogout = async () => {
    "use server";
    const supabaseServer = await createClient();
    await supabaseServer.auth.signOut();
    redirect("/");
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background p-6">
      <div className="w-full max-w-md flex flex-col gap-8 items-center text-center">
        <div>
          <h1 className="text-4xl font-black text-foreground mb-2">Welcome to Questine!</h1>
          <p className="text-zinc-500 font-bold">Logged in as: {user.email}</p>
        </div>
        
        <div className="flex flex-col gap-4 w-full">
          <form action={async () => { "use server"; await seedDummyData(); }} className="w-full">
            <Button type="submit" variant="secondary" fullWidth>
              Seed Dummy Data
            </Button>
          </form>

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
