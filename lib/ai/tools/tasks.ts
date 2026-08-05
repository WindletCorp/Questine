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
        console.time('[TOOL] get_tasks');
        const result = await getTasks(client, userId);
        if (result.data) {
            const mapped = result.data.map(t => {
                const { created_at, updated_at, ...rest } = t;
                return rest;
            });
            console.timeEnd('[TOOL] get_tasks');
            return mapped;
        }
        console.timeEnd('[TOOL] get_tasks');
        return result;
      },
    } as any),
    create_task: tool({
      description: "Create a new task.",
      inputSchema: InsertTaskSchema,
      execute: async (args: any) => {
        console.time('[TOOL] create_task');
        const result = await createTask(client, { ...args, user_id: userId });
        console.timeEnd('[TOOL] create_task');
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
        console.time('[TOOL] update_task');
        const result = await updateTask(client, args.id, args.updates);
        console.timeEnd('[TOOL] update_task');
        return result;
      },
    } as any),
    delete_task: tool({
      description: "Delete a task.",
      inputSchema: z.object({ id: z.string() }),
      execute: async (args: any) => {
        console.time('[TOOL] delete_task');
        const result = await deleteTask(client, args.id);
        console.timeEnd('[TOOL] delete_task');
        return result;
      },
    } as any),
  };
}
