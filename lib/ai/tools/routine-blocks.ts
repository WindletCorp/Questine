import { tool } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getRoutineBlocks,
  createRoutineBlock,
  updateRoutineBlock,
  deleteRoutineBlock
} from "@/lib/db/routine-blocks";
import { InsertRoutineBlockSchema, UpdateRoutineBlockSchema } from "@/lib/db/schemas";
import { z } from "zod";

export function makeRoutineBlockTools(client: SupabaseClient, userId: string) {
  return {
    get_routine_blocks: tool({
      description: "Get routine blocks. If the user specifies a date or range, ALWAYS pass those as from/to — historical dates are fully supported. Only fall back to the 48-hour default when no date context is given.",
      inputSchema: z.object({
        from: z.string().optional().describe("ISO 8601 UTC start of the time window"),
        to: z.string().optional().describe("ISO 8601 UTC end of the time window"),
      }),
      execute: async ({ from, to }) => {

        const res = await getRoutineBlocks(client, userId, { from, to });

        return res;
      },
    }),

    create_routine_block: tool({
      description: "Create a new routine block.",
      inputSchema: InsertRoutineBlockSchema,
      execute: async (args) => {
        // args is now automatically typed by Zod

        const res = await createRoutineBlock(client, { ...args, user_id: userId });

        return res;
      },
    }),

    update_routine_block: tool({
      description: "Update an existing routine block.",
      inputSchema: z.object({
        id: z.string().describe("The unique identifier of the routine block"),
        updates: UpdateRoutineBlockSchema,
      }),
      execute: async ({ id, updates }) => {
        // Destructuring matches the Zod schema layout exactly

        const res = await updateRoutineBlock(client, id, updates);

        return res;
      },
    }),

    delete_routine_block: tool({
      description: "Delete a routine block by its ID.",
      inputSchema: z.object({
        id: z.string().describe("The unique identifier of the routine block to delete")
      }),
      execute: async ({ id }) => {

        const res = await deleteRoutineBlock(client, id);

        return res;
      },
    }),
  };
}
