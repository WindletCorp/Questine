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
      description: "Get routine blocks. If the user specifies a date or range, ALWAYS pass those as start_date/end_date — historical dates are fully supported. Only fall back to the 48-hour default when no date context is given.",
      inputSchema: z.object({
        start_date: z.string().optional().describe("ISO 8601 UTC timestamp string for the start bound"),
        end_date: z.string().optional().describe("ISO 8601 UTC timestamp string for the end bound"),
      }),
      execute: async ({ start_date, end_date }) => {
        return await getRoutineBlocks(client, userId, start_date, end_date);
      },
    }),

    create_routine_block: tool({
      description: "Create a new routine block.",
      inputSchema: InsertRoutineBlockSchema,
      execute: async (args) => {
        // args is now automatically typed by Zod
        return await createRoutineBlock(client, { ...args, user_id: userId });
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
        return await updateRoutineBlock(client, id, updates);
      },
    }),

    delete_routine_block: tool({
      description: "Delete a routine block by its ID.",
      inputSchema: z.object({
        id: z.string().describe("The unique identifier of the routine block to delete")
      }),
      execute: async ({ id }) => {
        return await deleteRoutineBlock(client, id);
      },
    }),
  };
}
