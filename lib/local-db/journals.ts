import { db, type LocalJournal, type SyncQueueEntry } from "./index";
import type { JournalInsert, JournalUpdate, DbResult, Journal } from "../db/types";
import { ok, err } from "../db/types";

export async function getLocalJournals(
  userId: string,
  startTimeAfter?: string,
  startTimeBefore?: string
): Promise<DbResult<LocalJournal[]>> {
  try {
    let collection = db.journals.where("user_id").equals(userId);
    let journals = await collection.toArray();

    if (startTimeAfter) journals = journals.filter(j => j.start_time && j.start_time >= startTimeAfter);
    if (startTimeBefore) journals = journals.filter(j => j.start_time && j.start_time <= startTimeBefore);

    journals.sort((a, b) => (b.start_time || "").localeCompare(a.start_time || ""));
    return ok(journals);
  } catch (error: any) {
    return err(error.message);
  }
}

export async function createLocalJournal(journal: JournalInsert): Promise<DbResult<LocalJournal>> {
  try {
    const id = journal.id || crypto.randomUUID();
    const now = new Date().toISOString();
    
    const localJournal: LocalJournal = {
      id,
      user_id: journal.user_id,
      content: journal.content,
      ai_analysis: journal.ai_analysis ?? null,
      start_time: journal.start_time ?? null,
      end_time: journal.end_time ?? null,
      created_at: journal.created_at ?? now,
      updated_at: journal.updated_at ?? now,
      sync_status: "pending"
    };

    const queueEntry: SyncQueueEntry = {
      id: crypto.randomUUID(),
      table_name: "journals",
      operation: "INSERT",
      record_id: id,
      payload: localJournal,
      created_at: now
    };

    await db.transaction("rw", db.journals, db.sync_queue, async () => {
      await db.journals.add(localJournal);
      await db.sync_queue.add(queueEntry);
    });

    return ok(localJournal);
  } catch (error: any) {
    return err(error.message);
  }
}

export async function updateLocalJournal(id: string, updates: JournalUpdate): Promise<DbResult<LocalJournal>> {
  try {
    const now = new Date().toISOString();
    
    const finalUpdates = {
      ...updates,
      updated_at: now,
      sync_status: "pending" as const
    };

    const queueEntry: SyncQueueEntry = {
      id: crypto.randomUUID(),
      table_name: "journals",
      operation: "UPDATE",
      record_id: id,
      payload: updates,
      created_at: now
    };

    await db.transaction("rw", db.journals, db.sync_queue, async () => {
      await db.journals.update(id, finalUpdates);
      await db.sync_queue.add(queueEntry);
    });

    const updated = await db.journals.get(id);
    if (!updated) throw new Error("Journal not found after update");
    return ok(updated);
  } catch (error: any) {
    return err(error.message);
  }
}

export async function deleteLocalJournal(id: string): Promise<DbResult<null>> {
  try {
    const now = new Date().toISOString();
    
    const queueEntry: SyncQueueEntry = {
      id: crypto.randomUUID(),
      table_name: "journals",
      operation: "DELETE",
      record_id: id,
      payload: null,
      created_at: now
    };

    await db.transaction("rw", db.journals, db.sync_queue, async () => {
      await db.journals.delete(id);
      await db.sync_queue.add(queueEntry);
    });

    return ok(null);
  } catch (error: any) {
    return err(error.message);
  }
}
