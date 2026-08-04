import type { SupabaseClient } from "@supabase/supabase-js";
import { makeTaskTools } from "./tasks";
import { makeRoutineBlockTools } from "./routine-blocks";
import { makeJournalTools } from "./journals";

export interface BuildToolsOptions {
  client: SupabaseClient;
  userId: string;
  journalsAllowed?: boolean;
}

export function buildTools({ client, userId, journalsAllowed = false }: BuildToolsOptions) {
  const tools = {
    ...makeTaskTools(client, userId),
    ...makeRoutineBlockTools(client, userId),
    ...(journalsAllowed ? makeJournalTools(client, userId) : {}),
  };

  return tools;
}

export { makeTaskTools } from "./tasks";
export { makeRoutineBlockTools } from "./routine-blocks";
export { makeJournalTools } from "./journals";
