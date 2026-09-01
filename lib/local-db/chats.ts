import { db, type LocalChatMessage } from "./index";
import type { DbResult } from "../db/types";
import { ok, err } from "../db/types";

/**
 * Get all local chat messages for a user, sorted by creation time.
 */
export async function getLocalChatMessages(userId: string): Promise<DbResult<LocalChatMessage[]>> {
  try {
    const messages = await db.ai_chat_messages
      .where("user_id")
      .equals(userId)
      .sortBy("created_at");
      
    return ok(messages);
  } catch (error: any) {
    console.error("Failed to fetch local chat messages:", error);
    return err(error.message);
  }
}

/**
 * Save a new chat message to the local database.
 */
export async function saveLocalChatMessage(
  userId: string,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<DbResult<LocalChatMessage>> {
  try {
    const newMessage: LocalChatMessage = {
      id: crypto.randomUUID(),
      user_id: userId,
      role,
      content,
      created_at: new Date().toISOString(),
    };

    await db.ai_chat_messages.add(newMessage);
    return ok(newMessage);
  } catch (error: any) {
    console.error("Failed to save local chat message:", error);
    return err(error.message);
  }
}

/**
 * Clear all chat messages for a specific user.
 */
export async function clearLocalChat(userId: string): Promise<DbResult<void>> {
  try {
    const keys = await db.ai_chat_messages
      .where("user_id")
      .equals(userId)
      .primaryKeys();
      
    await db.ai_chat_messages.bulkDelete(keys);
    return ok(undefined);
  } catch (error: any) {
    console.error("Failed to clear local chat:", error);
    return err(error.message);
  }
}
