import { db } from "../local-db";
import { createSupabaseBrowserClient } from "../supabase/client";
import type { UserProfile } from "../db/types";

export interface CachedSession {
  user_id: string;
  email: string;
  profile: UserProfile | null;
  last_verified: string;
}

const SESSION_KEY = "current_session";
const client = createSupabaseBrowserClient();

export async function getCachedSession(): Promise<CachedSession | null> {
  const record = await db.meta.get(SESSION_KEY);
  return record?.value || null;
}

export async function setCachedSession(session: CachedSession): Promise<void> {
  await db.meta.put({ key: SESSION_KEY, value: session });
}

export async function clearCachedSession(): Promise<void> {
  await db.meta.delete(SESSION_KEY);
}

export async function refreshSession(): Promise<CachedSession | null> {
  if (!navigator.onLine) {
    return getCachedSession();
  }

  const { data: { user }, error } = await client.auth.getUser();
  
  if (error || !user) {
    // Session is invalid on the server
    await clearCachedSession();
    return null;
  }

  const { data: profile } = await client
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const newSession: CachedSession = {
    user_id: user.id,
    email: user.email || "",
    profile: profile as UserProfile | null,
    last_verified: new Date().toISOString()
  };

  await setCachedSession(newSession);
  return newSession;
}
