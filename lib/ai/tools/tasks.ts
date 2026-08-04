import { tool } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getTasks, createTask, updateTask, deleteTask } from "@/lib/db/tasks";
import { InsertTaskSchema, UpdateTaskSchema } from "@/lib/db/schemas";
import { z } from "zod";

export function makeTaskTools(client: SupabaseClient, userId: string) {
  return {
    get_tasks: tool({
      description: "Get all tasks for the user.",
      parameters: z.object({}),
      execute: async (_args: any) => {
        const result = await getTasks(client, userId);
        return result;
      },
    } as any),
    create_task: tool({
      description: "Create a new task.",
      parameters: InsertTaskSchema,
      execute: async (args: any) => {
        const result = await createTask(client, { ...args, user_id: userId });
        return result;
      },
    } as any),
    update_task: tool({
      description: "Update a task.",
      parameters: z.object({
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
      parameters: z.object({ id: z.string() }),
      execute: async (args: any) => {
        const result = await deleteTask(client, args.id);
        return result;
      },
    } as any),
  };
}
