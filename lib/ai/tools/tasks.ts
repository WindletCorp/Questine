import { tool } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getTasks, createTask, updateTask, deleteTask } from "@/lib/db/tasks";
import { InsertTaskSchema, UpdateTaskSchema } from "@/lib/db/schemas";
import { z } from "zod";

export function makeTaskTools(client: SupabaseClient, userId: string) {
  return {
    get_tasks: tool({
      description: "Get all tasks for the user. (Defaults to those active in the last 48 hours)",
      inputSchema: z.object({}),
      execute: async () => {

        const result = await getTasks(client, userId);
        if (result.data) {
          const mapped = result.data.map(t => {
            const { created_at, updated_at, ...rest } = t;
            return rest;
          });

          return mapped;
        }

        return result;
      },
    } as any),
    create_task: tool({
      description: "Create a new task.",
      inputSchema: InsertTaskSchema,
      execute: async (args: any) => {

        const result = await createTask(client, { ...args, user_id: userId });

        return result;
      },
    } as any),
    update_task: tool({
      description: "Update a task.",
      inputSchema: z.object({
        id: z.string(),
        updates: UpdateTaskSchema,
      }),
      execute: async (args: any) => {

        const result = await updateTask(client, args.id, args.updates);

        return result;
      },
    } as any),
    delete_task: tool({
      description: "Delete a task.",
      inputSchema: z.object({ id: z.string() }),
      execute: async (args: any) => {

        const result = await deleteTask(client, args.id);

        return result;
      },
    } as any),
  };
}
