"use server";

import { createClient } from "@/lib/supabase/server";

export async function checkUsername(username: string): Promise<boolean> {
  if (!username || username.length < 3) return false;
  
  const supabase = await createClient();
  
  // Clean username (lowercase, alphanumeric, underscores only)
  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
  
  if (cleanUsername !== username) return false;
  
  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", cleanUsername)
    .single();
    
  if (error && error.code === 'PGRST116') {
    // No rows found -> available!
    return true;
  }
  
  // Found a row, or some other error -> not available
  return false;
}
