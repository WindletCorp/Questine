import { tool } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getRoutineBlocks, createRoutineBlock, updateRoutineBlock, deleteRoutineBlock } from "@/lib/db/routine-blocks";
import { InsertRoutineBlockSchema, UpdateRoutineBlockSchema } from "@/lib/db/schemas";
import { z } from "zod";

export function makeRoutineBlockTools(client: SupabaseClient, userId: string) {
  return {
    get_routine_blocks: tool({
      description: "Get all routine blocks for the user.",
      parameters: z.object({}),
      execute: async (_args: any) => {
        const result = await getRoutineBlocks(client, userId);
        return result;
      },
    } as any),
    create_routine_block: tool({
      description: "Create a new routine block.",
      parameters: InsertRoutineBlockSchema,
      execute: async (args: any) => {
        const result = await createRoutineBlock(client, { ...args, user_id: userId });
        return result;
      },
    } as any),
    update_routine_block: tool({
      description: "Update a routine block.",
      parameters: z.object({
        id: z.string(),
        updates: UpdateRoutineBlockSchema,
      }),
      execute: async (args: any) => {
        const result = await updateRoutineBlock(client, args.id, args.updates);
        return result;
      },
    } as any),
    delete_routine_block: tool({
      description: "Delete a routine block.",
      parameters: z.object({ id: z.string() }),
      execute: async (args: any) => {
        const result = await deleteRoutineBlock(client, args.id);
        return result;
      },
    } as any),
  };
}
