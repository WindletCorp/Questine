import { tool } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getJournals, createJournal, updateJournal, deleteJournal } from "@/lib/db/journals";
import { InsertJournalSchema, UpdateJournalSchema } from "@/lib/db/schemas";
import { z } from "zod";

export function makeJournalTools(client: SupabaseClient, userId: string) {
  return {
    get_journals: tool({
      description: "Get all journals for the user.",
      parameters: z.object({}),
      execute: async (_args: any) => {
        const result = await getJournals(client, userId);
        return result;
      },
    } as any),
    create_journal: tool({
      description: "Create a new journal.",
      parameters: InsertJournalSchema,
      execute: async (args: any) => {
        const result = await createJournal(client, { ...args, user_id: userId });
        return result;
      },
    } as any),
    update_journal: tool({
      description: "Update a journal.",
      parameters: z.object({
        id: z.string(),
        updates: UpdateJournalSchema,
      }),
      execute: async (args: any) => {
        const result = await updateJournal(client, args.id, args.updates);
        return result;
      },
    } as any),
    delete_journal: tool({
      description: "Delete a journal.",
      parameters: z.object({ id: z.string() }),
      execute: async (args: any) => {
        const result = await deleteJournal(client, args.id);
        return result;
      },
    } as any),
  };
}
