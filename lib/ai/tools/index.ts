import type { SupabaseClient } from "@supabase/supabase-js";
import { makeTaskTools } from "./tasks";
import { makeRoutineBlockTools } from "./routine-blocks";
export interface BuildToolsOptions {
  client: SupabaseClient;
  userId: string;
}

export function buildTools({ client, userId }: BuildToolsOptions) {
  const tools = {
    ...makeTaskTools(client, userId),
    ...makeRoutineBlockTools(client, userId),
  };

  return tools;
}

export { makeTaskTools } from "./tasks";
export { makeRoutineBlockTools } from "./routine-blocks";
