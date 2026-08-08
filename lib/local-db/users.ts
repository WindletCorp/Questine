import { db } from "./index";
import type { UserProfile, UserStats, DbResult } from "../db/types";
import { ok, err } from "../db/types";

export async function getLocalUserProfile(userId: string): Promise<DbResult<UserProfile>> {
  try {
    const profile = await db.users.get(userId);
    if (!profile) return err("User profile not found locally");
    return ok(profile);
  } catch (error: any) {
    return err(error.message);
  }
}

export async function saveLocalUserProfile(profile: UserProfile): Promise<DbResult<UserProfile>> {
  try {
    await db.users.put(profile);
    return ok(profile);
  } catch (error: any) {
    return err(error.message);
  }
}

export async function getLocalUserStats(userId: string): Promise<DbResult<UserStats>> {
  try {
    const stats = await db.user_stats.get(userId);
    if (!stats) return err("User stats not found locally");
    return ok(stats);
  } catch (error: any) {
    return err(error.message);
  }
}

export async function saveLocalUserStats(stats: UserStats): Promise<DbResult<UserStats>> {
  try {
    await db.user_stats.put(stats);
    return ok(stats);
  } catch (error: any) {
    return err(error.message);
  }
}
