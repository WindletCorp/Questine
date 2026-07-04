import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { JournalEditor } from "./JournalEditor";

export default async function EditJournalPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: log, error } = await supabase
    .from("journal_logs")
    .select("*")
    .eq("id", resolvedParams.id)
    .eq("user_id", user.id)
    .single();

  if (error || !log) {
    redirect("/home");
  }

  return <JournalEditor id={log.id} initialContent={log.content} />;
}
